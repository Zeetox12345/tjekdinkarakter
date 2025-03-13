// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sanitizeText } from './text-utils.ts'
import { getOpenAIEvaluation } from './openai.ts'
import type { EvaluationRequest, SanitizedEvaluation } from './types.ts'

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

    // Increase max length to accommodate more complex analysis
    const maxLength = 15000;
    const sanitizedAssignmentText = sanitizeText(assignmentText).slice(0, maxLength);
    const sanitizedInstructionsText = instructionsText ? 
      sanitizeText(instructionsText).slice(0, maxLength) : '';

    // Set a longer timeout for the API call (GPT-o1 may take longer to process)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

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

      // Store the evaluation in background
      EdgeRuntime.waitUntil((async () => {
        try {
          const sanitizedEvaluation: SanitizedEvaluation = {
            assignment_text: sanitizedAssignmentText,
            instructions_text: sanitizedInstructionsText,
            grade: sanitizeText(evaluation.grade),
            reasoning: sanitizeText(evaluation.reasoning),
            improvements: evaluation.improvements.map(sanitizeText),
            strengths: evaluation.strengths.map(sanitizeText)
          };

          await supabase
            .from('evaluations')
            .insert(sanitizedEvaluation);
        } catch (dbError) {
          console.error('Database Error:', dbError);
        }
      })());

      return new Response(
        JSON.stringify(evaluation),
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
        message: 'Failed to evaluate assignment. This may be due to the complexity of the text or a timeout.'
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
