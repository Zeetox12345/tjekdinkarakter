
import { supabase } from "@/integrations/supabase/client";
import * as pdfjs from 'pdfjs-dist';

interface EvaluationResult {
  grade: string;
  reasoning: string;
  improvements: string[];
  strengths: string[];
}

// Set up PDF.js worker with absolute HTTPS URL
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export const evaluateAssignment = async (
  assignmentFile: File | null,
  assignmentText: string,
  instructionsFile: File | null,
  instructionsText: string
): Promise<EvaluationResult> => {
  try {
    let assignmentContent = assignmentText || '';
    let instructionsContent = instructionsText || '';

    // Handle file content if files are provided
    if (assignmentFile) {
      console.log('Processing assignment file:', assignmentFile.name, assignmentFile.type);
      assignmentContent = await readFileContent(assignmentFile);
      console.log('Successfully processed assignment file, content length:', assignmentContent.length);
    }

    if (instructionsFile) {
      console.log('Processing instructions file:', instructionsFile.name, instructionsFile.type);
      instructionsContent = await readFileContent(instructionsFile);
      console.log('Successfully processed instructions file, content length:', instructionsContent.length);
    }

    // Validate content before sending to API
    if (!assignmentContent.trim()) {
      throw new Error('No content found in assignment');
    }

    // Clean and truncate content if needed
    assignmentContent = cleanContent(assignmentContent);
    instructionsContent = cleanContent(instructionsContent);

    // Log content sizes before sending
    console.log('Final assignment content length:', assignmentContent.length);
    console.log('Final instructions content length:', instructionsContent.length);

    const { data, error } = await supabase.functions.invoke('evaluate-assignment', {
      body: {
        assignmentText: assignmentContent,
        instructionsText: instructionsContent,
      },
    });

    if (error) {
      console.error('Evaluation Error:', error);
      throw new Error(`Failed to evaluate assignment: ${error.message}`);
    }

    if (!data) {
      throw new Error('No evaluation data received');
    }

    return data;
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    throw error;
  }
};

const cleanContent = (text: string): string => {
  let cleaned = text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove Unicode replacement characters
    .trim();

  // Ensure we have valid content after cleaning
  if (!cleaned) {
    throw new Error('Content is empty after cleaning');
  }

  return cleaned;
};

const readFileContent = async (file: File): Promise<string> => {
  try {
    console.log('Starting to read file:', file.name, file.type);
    
    if (file.type === 'application/pdf') {
      return await readPDFContent(file);
    } else if (
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await readWordContent(file);
    }
    
    return await readTextContent(file);
  } catch (error) {
    console.error('Error reading file:', file.name, error);
    throw new Error(`Unable to read file content: ${error.message}`);
  }
};

const readTextContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error(`FileReader error: ${reader.error?.message || 'Unknown error'}`));
    reader.readAsText(file);
  });
};

const readPDFContent = async (file: File): Promise<string> => {
  try {
    console.log('Reading PDF file:', file.name);
    const fileReader = new FileReader();

    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
      fileReader.onerror = () => reject(fileReader.error);
      fileReader.readAsArrayBuffer(file);
    });

    console.log('PDF file loaded into ArrayBuffer');
    const typedArray = new Uint8Array(arrayBuffer);

    // Make sure the worker is properly initialized
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      console.error('PDF.js worker not initialized');
      throw new Error('PDF.js worker not properly initialized');
    }

    console.log('Loading PDF document...');
    const loadingTask = pdfjs.getDocument({
      data: typedArray,
      verbosity: 1  // Increase verbosity for debugging
    });

    console.log('Awaiting PDF document...');
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);

    let fullText = '';

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        console.log(`Processing page ${i} of ${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => item && (typeof item.str === 'string' || typeof item.str === 'number'))
          .map((item: any) => String(item.str).trim())
          .join(' ');

        if (pageText.trim()) {
          fullText += pageText + '\n';
        }
        
        console.log(`Page ${i} processed successfully`);
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        // Continue with other pages even if one fails
      }
    }

    console.log('PDF text extraction complete');
    fullText = fullText.trim();

    if (!fullText) {
      throw new Error('No text content could be extracted from the PDF');
    }

    return fullText;
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
};

const readWordContent = async (file: File): Promise<string> => {
  try {
    console.log('Reading Word file:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 to avoid binary data issues
    const base64Content = btoa(String.fromCharCode.apply(null, uint8Array));
    
    console.log('Word file size:', uint8Array.length, 'bytes');
    
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { 
        fileName: file.name,
        fileContent: base64Content
      }
    });

    if (error) {
      console.error('Word processing error:', error);
      throw new Error('Failed to process Word document');
    }

    if (!data?.text) {
      throw new Error('No text content received from document processor');
    }

    console.log('Word content processed successfully');
    return data.text;
  } catch (error) {
    console.error('Word processing error:', error);
    throw new Error(`Failed to process Word document: ${error.message}`);
  }
};
