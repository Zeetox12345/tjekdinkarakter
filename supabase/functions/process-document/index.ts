
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
    const { fileContent } = await req.json()
    
    // Convert array back to Uint8Array
    const buffer = new Uint8Array(fileContent)

    // Process Word document
    const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer })
    const text = result.value

    // Also extract any images or equations (base64 encoded)
    const images = await mammoth.images.embedImage({
      arrayBuffer: buffer.buffer,
      contentType: "image/*"
    })

    return new Response(
      JSON.stringify({ 
        text,
        images: images.map(img => ({
          contentType: img.contentType,
          data: img.data.toString('base64')
        }))
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error processing document:', error)
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
