import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to sanitize text input
const sanitizeText = (text: string): string => {
  // Remove null bytes and other problematic characters
  return text
    .replace(/\0/g, '')
    // Replace Unicode escape sequences with their actual characters
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Remove any non-printable characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Ensure the text is valid UTF-8
    .normalize();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { assignmentText, instructionsText } = await req.json()

    // Validate input
    if (!assignmentText || assignmentText.trim().length === 0) {
      throw new Error('No assignment text provided');
    }

    // Sanitize and truncate input texts to prevent timeouts
    const maxLength = 10000; // Limit text length to prevent timeouts
    const sanitizedAssignmentText = sanitizeText(assignmentText).slice(0, maxLength);
    const sanitizedInstructionsText = instructionsText ? 
      sanitizeText(instructionsText).slice(0, maxLength) : '';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const prompt = `
      Du er en erfaren lærer, der skal vurdere følgende opgavebesvarelse på den danske 7-trinsskala (-3, 00, 02, 4, 7, 10, 12).

      ${sanitizedInstructionsText ? `OPGAVEBESKRIVELSE:\n${sanitizedInstructionsText}\n\n` : ''}
      
      OPGAVEBESVARELSE:\n${sanitizedAssignmentText}
      
      VIGTIGE RETNINGSLINJER FOR VURDERING:
      1. Vurder primært hvor godt opgavebesvarelsen opfylder kravene fra opgaveformuleringen ved at:
         - Kontrollere at ALLE delspørgsmål er besvaret grundigt
         - Vurdere dybden og kvaliteten af analysen for hvert delspørgsmål
         - Se på sammenhængen mellem delkonklusioner og hovedkonklusion
      
      2. Vurder den akademiske kvalitet ud fra:
         A. Primære kriterier (vægter tungest):
            - Dybdegående analyse med relevant brug af fagbegreber og modeller
            - Selvstændig anvendelse af teori på case/empiri
            - Velargumenterede konklusioner baseret på analysen
            - Kritisk vurdering og diskussion af resultater
         B. Sekundære kriterier:
            - Struktur og rød tråd
            - Kildeanvendelse og dokumentation
            - Sprog og formidling
      
      3. Karaktergivning skal følge disse retningslinjer:
         - 12: Gives for den FREMRAGENDE præstation hvor:
           * Alle opgavekrav er udtømmende besvaret
           * Analysen er særdeles dybtgående og selvstændig
           * Teorier og modeller anvendes præcist og med stor indsigt
           * Argumentationen er overbevisende og velunderbygget
           * Konklusioner følger logisk af analyserne
           * Der vises kritisk sans og selvstændig vurdering
         - 10: Fortrinlig besvarelse der opfylder næsten alle krav til 12
         - 7: God besvarelse med flere gode elementer men ikke alle dele er lige vellykkede
         - 4: Jævn besvarelse med flere mangler i analyse og argumentation
         - 02: Tilstrækkelig besvarelse der kun minimalt besvarer opgavekravene
         - 00: Utilstrækkelig besvarelse
         - -3: Helt uacceptabel præstation
      
      4. Særligt positive elementer der skal belønnes:
         - Grundig behandling af alle opgavens dele
         - Selvstændig analyse der går ud over det åbenlyse
         - God brug af relevant teori og modeller
         - Velargumenterede konklusioner
         - God struktur og rød tråd
         - Relevant brug af kilder og data
      
      5. Ved erhvervsøkonomiske opgaver, læg særlig vægt på:
         - Anvendelse af relevante analysemodeller (PEST, Five Forces etc.)
         - Kobling mellem teori og praktisk analyse
         - Dybde i markedsanalysen
         - Velunderbyggede strategiske anbefalinger
      
      VIGTIGT: Du skal svare i præcist dette JSON format, uden markdown eller kodeblokke:
      {
        "grade": "karakteren her (-3, 00, 02, 4, 7, 10 eller 12)",
        "reasoning": "begrundelse her",
        "improvements": ["forbedring 1", "forbedring 2"],
        "strengths": ["styrke 1", "styrke 2"]
      }
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Du er en erfaren lærer der vurderer opgaver. Fremragende besvarelser der viser dyb analyse, selvstændig brug af teori og modeller, samt grundig behandling af alle opgavekrav fortjener topkarakterer. Vær særlig opmærksom på at belønne god brug af analysemodeller og velunderbyggede konklusioner i erhvervsøkonomiske opgaver. Du svarer KUN med det ønskede JSON format, uden markdown eller kodeblokke.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API Error:', errorData)
      throw new Error(errorData.error?.message || 'Failed to evaluate assignment')
    }

    const data = await response.json()
    let evaluationContent = data.choices[0].message.content.trim()
    
    // Remove any potential markdown formatting or code blocks
    if (evaluationContent.startsWith('```json')) {
      evaluationContent = evaluationContent.replace(/```json\n/, '').replace(/\n```$/, '')
    } else if (evaluationContent.startsWith('```')) {
      evaluationContent = evaluationContent.replace(/```\n/, '').replace(/\n```$/, '')
    }

    try {
      const evaluation = JSON.parse(evaluationContent)
      
      // Store the evaluation in background
      EdgeRuntime.waitUntil((async () => {
        try {
          const sanitizedEvaluation = {
            assignment_text: sanitizedAssignmentText,
            instructions_text: sanitizedInstructionsText,
            grade: sanitizeText(evaluation.grade),
            reasoning: sanitizeText(evaluation.reasoning),
            improvements: evaluation.improvements.map(sanitizeText),
            strengths: evaluation.strengths.map(sanitizeText)
          }

          await supabase
            .from('evaluations')
            .insert(sanitizedEvaluation)
        } catch (dbError) {
          console.error('Database Error:', dbError)
        }
      })())

      return new Response(
        JSON.stringify(evaluation),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      )
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Content:', evaluationContent)
      throw new Error('Failed to parse evaluation response')
    }
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
