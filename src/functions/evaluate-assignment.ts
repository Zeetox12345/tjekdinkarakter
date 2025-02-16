
import { supabase } from "@/integrations/supabase/client";
import * as pdfjs from 'pdfjs-dist';

interface EvaluationResult {
  grade: string;
  reasoning: string;
  improvements: string[];
  strengths: string[];
}

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
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
    }

    if (instructionsFile) {
      console.log('Processing instructions file:', instructionsFile.name, instructionsFile.type);
      instructionsContent = await readFileContent(instructionsFile);
    }

    console.log('Assignment content length:', assignmentContent.length);
    console.log('Instructions content length:', instructionsContent.length);

    // Clean the content before sending to the API
    assignmentContent = cleanContent(assignmentContent);
    instructionsContent = cleanContent(instructionsContent);

    const { data, error } = await supabase.functions.invoke('evaluate-assignment', {
      body: {
        assignmentText: assignmentContent,
        instructionsText: instructionsContent,
      },
    });

    if (error) {
      console.error('Evaluation Error:', error);
      throw new Error('Failed to evaluate assignment');
    }

    return data;
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    throw error;
  }
};

const cleanContent = (text: string): string => {
  return text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\u0000/g, '') // Remove null bytes
    .trim();
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
    
    // Default to text content for unknown types
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
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Initialize PDF.js with the typed array
    console.log('Initializing PDF.js...');
    const loadingTask = pdfjs.getDocument({ data: typedArray });
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Read text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing PDF page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => {
          // Handle different types of PDF text content
          if (typeof item.str === 'string') {
            return item.str;
          }
          // Handle potential numeric or other types
          return String(item.str || '');
        })
        .join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('PDF content extracted, length:', fullText.length);
    
    // Clean up any leftover control characters or invalid Unicode
    fullText = fullText
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove Unicode replacement characters
      .trim();
    
    if (!fullText) {
      throw new Error('No text content extracted from PDF');
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

    console.log('Word content processed successfully');
    return data.text;
  } catch (error) {
    console.error('Word processing error:', error);
    throw new Error(`Failed to process Word document: ${error.message}`);
  }
};
