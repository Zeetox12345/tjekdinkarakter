
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import mammoth from 'https://esm.sh/mammoth@1.6.0'

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
    const { fileContent, fileName } = await req.json()
    console.log('Processing document:', fileName);
    
    // Convert base64 back to Uint8Array
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Document size:', bytes.length, 'bytes');

    // Process Word document
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    
    if (!result.value) {
      throw new Error('No text content extracted from document');
    }

    const text = result.value.trim();
    console.log('Extracted text length:', text.length);

    // Log any warnings
    if (result.messages.length > 0) {
      console.log('Document processing messages:', result.messages);
    }

    return new Response(
      JSON.stringify({ text }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process document'
      }),
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
