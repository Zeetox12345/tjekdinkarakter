
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { assignmentText, instructionsText } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const prompt = `
      Som en erfaren dansklærer, vurder venligst følgende opgave:
      
      ${instructionsText ? `Opgavebeskrivelse:\n${instructionsText}\n\n` : ''}
      
      Opgave:\n${assignmentText}
      
      VIGTIGT: Du skal svare i præcist dette JSON format, uden markdown eller kodeblokke:
      {
        "grade": "karakteren her",
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
            content: 'Du er en erfaren dansklærer der vurderer opgaver. Du svarer KUN med det ønskede JSON format, uden markdown eller kodeblokke.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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

      // Store the evaluation in the database
      const { data: storedEvaluation, error: dbError } = await supabase
        .from('evaluations')
        .insert({
          assignment_text: assignmentText,
          instructions_text: instructionsText,
          grade: evaluation.grade,
          reasoning: evaluation.reasoning,
          improvements: evaluation.improvements,
          strengths: evaluation.strengths
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database Error:', dbError)
        throw new Error('Failed to store evaluation')
      }

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
