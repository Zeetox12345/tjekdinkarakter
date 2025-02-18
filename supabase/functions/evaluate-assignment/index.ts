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
      Du er en erfaren dansklærer, der skal vurdere følgende opgavebesvarelse på den danske 7-trinsskala (-3, 00, 02, 4, 7, 10, 12).

      ${sanitizedInstructionsText ? `OPGAVEBESKRIVELSE:\n${sanitizedInstructionsText}\n\n` : ''}
      
      OPGAVEBESVARELSE:\n${sanitizedAssignmentText}
      
      VIGTIGE RETNINGSLINJER FOR VURDERING:
      1. Vurder primært hvor godt opgavebesvarelsen opfylder kravene fra opgaveformuleringen
      2. Vurder besvarelsen ud fra disse kriterier i prioriteret rækkefølge:
         A. Primære kriterier (vægter tungest):
            - Grundig og udtømmende besvarelse af ALLE delspørgsmål fra opgaveformuleringen
            - Fremragende analyse og fortolkning med selvstændig brug af relevante fagbegreber
            - Evne til at kombinere teori og analyse på en overbevisende måde
            - Velstruktureret argumentation med klar rød tråd
         B. Sekundære kriterier:
            - Korrekt anvendelse af kilder og dokumentation
            - Akademisk sprog og formidling
            - God struktur med indholdsfortegnelse og logisk opbygning
      3. Karaktergivning skal følge disse retningslinjer:
         - 12: Gives for den FREMRAGENDE præstation der:
           * Besvarer ALLE opgavekrav udtømmende og selvstændigt
           * Viser excellent analyse og brug af fagbegreber
           * Har særdeles velargumenterede pointer
           * Demonstrerer fremragende evne til at kombinere teori og analyse
           * Har fejlfri dokumentation og akademisk sprog
         - 10: En fortrinlig besvarelse med få uvæsentlige mangler
         - 7: En god besvarelse med nogle mangler
         - 4: En jævn besvarelse med flere væsentlige mangler
         - 02: En tilstrækkelig besvarelse med store mangler
         - 00: En utilstrækkelig besvarelse
         - -3: En helt uacceptabel præstation
      4. Vær særligt opmærksom på at belønne:
         - Selvstændig og dyb analyse
         - Evne til at kombinere teori og analyse på sofistikeret vis
         - Velunderbygget argumentation
         - Grundig behandling af alle opgavens dele
         - God struktur og rød tråd gennem opgaven
      5. For at få topkarakteren 12 skal besvarelsen:
         - Vise fremragende forståelse af alle aspekter af opgaven
         - Have særdeles velargumenterede pointer
         - Demonstrere selvstændig analyse og brug af relevante fagbegreber
         - Have en klar rød tråd og logisk struktur
      
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
            content: 'Du er en erfaren dansklærer der vurderer opgaver. Fremragende besvarelser der viser dyb forståelse, selvstændig analyse og grundig behandling af alle opgavekrav fortjener topkarakteren 12. Du svarer KUN med det ønskede JSON format, uden markdown eller kodeblokke.' 
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
