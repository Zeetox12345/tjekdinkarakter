
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Initialize PDF.js once
const initializePdfJs = () => {
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    console.log('Initializing PDF.js with version:', pdfjs.version);
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
};

export const convertPDFtoDOCX = async (pdfFile: File): Promise<string> => {
  try {
    console.log('Starting PDF processing for file:', pdfFile.name);
    
    // Initialize PDF.js
    initializePdfJs();
    
    // Load the PDF file
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('PDF file loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Create PDF document loading task with more robust configuration
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjs.version + '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjs.version + '/standard_fonts/',
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
