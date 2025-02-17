
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
      // Convert PDF to DOCX first
      console.log('Converting PDF to DOCX...');
      const docxContent = await convertPDFtoDOCX(file);
      console.log('PDF converted to DOCX successfully');
      return docxContent;
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

const convertPDFtoDOCX = async (pdfFile: File): Promise<string> => {
  try {
    console.log('Starting PDF to DOCX conversion for file:', pdfFile.name);
    
    // First extract text content from PDF
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('PDF loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
    console.log('PDF document loaded, pages:', pdf.numPages);
    
    let textContent = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing PDF page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .filter(str => str && str.trim()) // Filter out empty strings
        .join(' ');
      
      if (pageText.trim()) {
        textContent.push(pageText);
        console.log(`Page ${pageNum} extracted content length:`, pageText.length);
      }
    }
    
    // Join all text content
    const fullContent = textContent.join('\n\n');
    console.log('Total extracted content length:', fullContent.length);
    
    if (!fullContent.trim()) {
      throw new Error('No text content could be extracted from PDF');
    }
    
    // Encode content for API
    const contentBase64 = btoa(unescape(encodeURIComponent(fullContent)));
    console.log('Content encoded to base64');
    
    // Send to document processing API
    console.log('Sending to document processing API...');
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

const readWordContent = async (file: File): Promise<string> => {
  try {
    console.log('Reading Word file:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    // Create Uint8Array from ArrayBuffer
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    uint8Array.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    const base64Content = btoa(binary);
    
    console.log('Word file processed, sending to API...');
    
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { 
        fileName: file.name,
        fileContent: base64Content
      }
    });

    if (error) {
      console.error('Word processing error:', error);
      throw new Error(`Failed to process Word document: ${error.message}`);
    }

    if (!data?.text) {
      console.error('No text received from document processor');
      throw new Error('No text content received from document processor');
    }

    console.log('Word content processed successfully, length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('Word processing error:', error);
    throw new Error(`Failed to process Word document: ${error.message}`);
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
