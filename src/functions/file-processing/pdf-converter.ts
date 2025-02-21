
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Initialize PDF.js worker with a more reliable approach
const initializePdfJs = async () => {
  if (typeof window === 'undefined' || pdfjs.GlobalWorkerOptions.workerSrc) return;

  try {
    console.log('Initializing PDF.js worker...');
    const workerSrc = await import('pdfjs-dist/build/pdf.worker.js?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc.default;
    console.log('PDF.js worker initialized successfully');
  } catch (error) {
    console.error('Failed to load PDF.js worker:', error);
    // Fallback to legacy worker if dynamic import fails
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;
  }
};

export const convertPDFtoDOCX = async (pdfFile: File): Promise<string> => {
  try {
    console.log('Starting PDF processing for file:', pdfFile.name);
    
    // Initialize worker
    await initializePdfJs();
    
    // Load the PDF file
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('PDF file loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Create PDF document loading task with alternative configuration
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 1,
      disableFontFace: true, // Disable font loading to avoid potential issues
      nativeImageDecoderSupport: 'none',
      ignoreErrors: true,
    });

    console.log('PDF loading task created');
    
    // Load the PDF document
    const pdfDoc = await loadingTask.promise;
    console.log('PDF document loaded successfully, pages:', pdfDoc.numPages);
    
    let fullText = '';
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${pdfDoc.numPages}`);
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += pageText + '\n\n';
          console.log(`Page ${pageNum} processed, extracted text length:`, pageText.length);
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with next page even if one fails
      }
    }
    
    fullText = fullText.trim();
    console.log('Total extracted text length:', fullText.length);
    
    if (!fullText) {
      throw new Error('No text content could be extracted from PDF');
    }

    // Send the extracted text to evaluation
    const { data, error } = await supabase.functions.invoke('evaluate-assignment', {
      body: { 
        assignmentText: fullText,
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

    console.log('Successfully processed and evaluated PDF content');
    return fullText;
    
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};
