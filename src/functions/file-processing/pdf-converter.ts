
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    console.log('Setting up PDF.js worker');
    // Use the worker directly from the package
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
    console.log('PDF.js worker setup complete');
  } catch (error) {
    console.error('Error setting up PDF.js worker:', error);
  }
}

export const convertPDFtoDOCX = async (pdfFile: File): Promise<string> => {
  try {
    console.log('Starting PDF to DOCX conversion for file:', pdfFile.name);
    
    // First extract text content from PDF
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('PDF loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false, // Disable worker fetch to prevent CORS issues
      isEvalSupported: false, // Disable eval for security
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
    }).promise;
    
    console.log('PDF document loaded, pages:', pdf.numPages);
    
    let textContent = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing PDF page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .filter(str => str && str.trim())
        .join(' ');
      
      if (pageText.trim()) {
        textContent.push(pageText);
        console.log(`Page ${pageNum} extracted content length:`, pageText.length);
      }
    }
    
    const fullContent = textContent.join('\n\n');
    console.log('Total extracted content length:', fullContent.length);
    
    if (!fullContent.trim()) {
      throw new Error('No text content could be extracted from PDF');
    }
    
    const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)));
    console.log('Content encoded to base64');
    
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { 
        fileName: pdfFile.name.replace('.pdf', '.docx'),
        fileContent: contentBase64,
        sourceFormat: 'pdf'
      }
    });

    if (error) {
      console.error('Document processing API error:', error);
      throw new Error(`Conversion failed: ${error.message}`);
    }

    if (!data?.text) {
      console.error('No text received from document processor');
      throw new Error('No text content received from document processor');
    }

    console.log('Successfully received processed document, content length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('PDF to DOCX conversion failed:', error);
    throw new Error(`PDF to DOCX conversion failed: ${error.message}`);
  }
};
