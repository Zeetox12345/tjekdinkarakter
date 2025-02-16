
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Document } from "https://deno.land/x/doc_reader@v0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const assignmentFile = formData.get('assignmentFile') as File;
    const assignmentText = formData.get('assignmentText') as string;
    const instructionsFile = formData.get('instructionsFile') as File;
    const instructionsText = formData.get('instructionsText') as string;

    let assignmentContent = assignmentText || '';
    let instructionsContent = instructionsText || '';

    // Handle file content if files are provided
    if (assignmentFile) {
      const doc = new Document(await assignmentFile.arrayBuffer());
      assignmentContent = await doc.getText();
    }

    if (instructionsFile) {
      const doc = new Document(await instructionsFile.arrayBuffer());
      instructionsContent = await doc.getText();
    }

    const prompt = `
      Som en erfaren dansklærer, vurder venligst følgende opgave:
      
      ${instructionsContent ? `Opgavebeskrivelse:\n${instructionsContent}\n\n` : ''}
      
      Opgave:\n${assignmentContent}
      
      Giv venligst:
      1. En karakter på 7-trinsskalaen
      2. En detaljeret begrundelse for karakteren
      3. Konkrete forbedringsforslag
      4. Specifikke styrker ved opgaven
      
      Format svaret som JSON med følgende struktur:
      {
        "grade": "karakter",
        "reasoning": "begrundelse",
        "improvements": ["forbedringsforslag1", "forbedringsforslag2", ...],
        "strengths": ["styrke1", "styrke2", ...]
      }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Du er en erfaren dansklærer der vurderer opgaver.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const evaluation = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
