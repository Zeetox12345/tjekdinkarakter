// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sanitizeText } from './text-utils.ts'
import { getOpenAIEvaluation } from './openai.ts'
import type { EvaluationRequest, SanitizedEvaluation, EvaluationResult } from './types.ts'

// Add Deno namespace declaration for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Add EdgeRuntime declaration for TypeScript
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignmentText, instructionsText } = await req.json() as EvaluationRequest;

    if (!assignmentText?.trim()) {
      throw new Error('No assignment text provided');
    }

    // Set max length for the model's context window
    const maxLength = 12000; // Increased for GPT-4
    const sanitizedAssignmentText = sanitizeText(assignmentText).slice(0, maxLength);
    const sanitizedInstructionsText = instructionsText ? 
      sanitizeText(instructionsText).slice(0, maxLength) : '';

    // Set a timeout for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased timeout for GPT-4

    try {
      const evaluation = await getOpenAIEvaluation(
        sanitizedAssignmentText,
        sanitizedInstructionsText
      );
      clearTimeout(timeoutId);

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
      const supabase = createClient(supabaseUrl!, supabaseKey!);

      // Extract required fields and handle any flexible format
      const extractedEvaluation = {
        grade: evaluation.grade || "",
        reasoning: evaluation.reasoning || evaluation.begrundelse || evaluation.vurdering || 
                  evaluation.explanation || evaluation.feedback || 
                  (typeof evaluation.overall === 'string' ? evaluation.overall : ""),
        improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements :
                     Array.isArray(evaluation.forbedringsforslag) ? evaluation.forbedringsforslag :
                     Array.isArray(evaluation.forbedringer) ? evaluation.forbedringer : 
                     Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [],
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : 
                  Array.isArray(evaluation.styrker) ? evaluation.styrker : []
      };

      // Store the evaluation in background
      EdgeRuntime.waitUntil((async () => {
        try {
          const sanitizedEvaluation: SanitizedEvaluation = {
            assignment_text: sanitizedAssignmentText,
            instructions_text: sanitizedInstructionsText,
            grade: sanitizeText(extractedEvaluation.grade),
            reasoning: sanitizeText(extractedEvaluation.reasoning),
            improvements: extractedEvaluation.improvements.map(item => 
              typeof item === 'string' ? sanitizeText(item) : sanitizeText(JSON.stringify(item))
            ),
            strengths: extractedEvaluation.strengths.map(item => 
              typeof item === 'string' ? sanitizeText(item) : sanitizeText(JSON.stringify(item))
            )
          };

          await supabase
            .from('evaluations')
            .insert(sanitizedEvaluation);
        } catch (dbError) {
          console.error('Database Error:', dbError);
        }
      })());

      return new Response(
        JSON.stringify(evaluation), // Return the original, complete evaluation
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    } catch (apiError) {
      clearTimeout(timeoutId);
      throw apiError;
    }
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to evaluate assignment. Please try again with a shorter text or contact support.'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
