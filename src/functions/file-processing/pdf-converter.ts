
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Set up PDF.js worker with absolute HTTPS URL to ensure it works in all environments
if (typeof window !== 'undefined') {
  try {
    console.log('Setting up PDF.js worker');
    // Use jsdelivr CDN which is more reliable for npm packages
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    console.log('PDF.js worker setup complete with version:', pdfjs.version);
  } catch (error) {
    console.error('Error setting up PDF.js worker:', error);
  }
}

export const convertPDFtoDOCX = async (pdfFile: File): Promise<string> => {
  try {
    console.log('Starting PDF text extraction for file:', pdfFile.name);
    
    // Load the PDF file
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('PDF loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Create loading task with minimal configuration to avoid issues
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF document loaded successfully, pages:', pdf.numPages);
    
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
        console.log(`Page ${pageNum} text extracted, length:`, pageText.length);
      }
    }
    
    const fullContent = textContent.join('\n\n');
    console.log('Total extracted text length:', fullContent.length);
    
    if (!fullContent.trim()) {
      throw new Error('No text content could be extracted from PDF');
    }
    
    const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)));
    console.log('Content encoded to base64');
    
    // Send the extracted text to the API
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { 
        fileName: pdfFile.name.replace('.pdf', '.docx'),
        fileContent: contentBase64,
        sourceFormat: 'pdf'
      }
    });

    if (error) {
      console.error('Document processing API error:', error);
      throw new Error(`Processing failed: ${error.message}`);
    }

    if (!data?.text) {
      console.error('No text received from document processor');
      throw new Error('No text content received from document processor');
    }

    console.log('Successfully processed document, content length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};
