
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    console.log('Setting up PDF.js worker');
    // Use unpkg CDN which is more reliable for PDF.js
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
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
    
    // Wait for worker to be ready
    await pdfjs.getDocument({ data: new Uint8Array(0) }).promise.catch(() => {});
    console.log('PDF.js worker is ready');
    
    // Create loading task with minimal configuration
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
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
    
    // Send the extracted text directly to the evaluation function
    const { data, error } = await supabase.functions.invoke('evaluate-assignment', {
      body: { 
        assignmentText: fullContent,
      }
    });

    if (error) {
      console.error('Evaluation API error:', error);
      throw new Error(`Evaluation failed: ${error.message}`);
    }

    if (!data) {
      console.error('No evaluation data received');
      throw new Error('No evaluation data received from API');
    }

    console.log('Successfully processed evaluation');
    return fullContent;
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};
