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
  const workerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  console.log('Setting up PDF.js worker at:', workerUrl);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
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
    console.log('Starting PDF processing for:', file.name);

    // Load file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);

    // Load the PDF document
    console.log('Loading PDF document...');
    const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
    console.log('PDF loaded, pages:', pdf.numPages);

    let allContent: string[] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${pdf.numPages}`);
        const page = await pdf.getPage(pageNum);

        // Get text content
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => 
          typeof item.str === 'string' ? item.str.trim() : ''
        ).filter(Boolean);

        // Get annotations (might contain additional text)
        const annotations = await page.getAnnotations();
        const annotationText = annotations
          .map(annot => annot.contents || '')
          .filter(Boolean);

        // Extract any embedded text from figures/images
        const operatorList = await page.getOperatorList();
        const imgItems = operatorList.fnArray
          .map((fn: any, index: number) => {
            if (fn === pdfjs.OPS.paintImageXObject) {
              const imgData = operatorList.argsArray[index][0];
              return `[Image: ${imgData}]`; // Mark image presence in text
            }
            return '';
          })
          .filter(Boolean);

        // Combine all content from this page
        const pageContent = [
          ...textItems,
          ...annotationText,
          ...imgItems
        ].join(' ');

        if (pageContent.trim()) {
          allContent.push(pageContent);
          console.log(`Page ${pageNum} content length:`, pageContent.length);
        }

      } catch (pageError) {
        console.error(`Error on page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }

    const finalContent = allContent.join('\n\n').trim();
    console.log('Total extracted content length:', finalContent.length);

    if (!finalContent) {
      throw new Error('No content could be extracted from PDF');
    }

    // Clean up the content
    const cleanedContent = finalContent
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\[Image:[^\]]+\]/g, ' ') // Clean up image markers
      .trim();

    return cleanedContent;
  } catch (error) {
    console.error('PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
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
