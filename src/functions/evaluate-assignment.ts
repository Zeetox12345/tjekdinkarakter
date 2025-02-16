
import { supabase } from "@/integrations/supabase/client";
import * as pdfjs from 'pdfjs-dist';

interface EvaluationResult {
  grade: string;
  reasoning: string;
  improvements: string[];
  strengths: string[];
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
      assignmentContent = await readFileContent(assignmentFile);
    }

    if (instructionsFile) {
      instructionsContent = await readFileContent(instructionsFile);
    }

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

const readFileContent = async (file: File): Promise<string> => {
  try {
    if (file.type === 'application/pdf') {
      return await readPDFContent(file);
    } else if (file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await readWordContent(file);
    }
    return await readTextContent(file);
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error('Unable to read file content');
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
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const readPDFContent = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  
  // Initialize PDF.js
  const loadingTask = pdfjs.getDocument(typedArray);
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  // Read text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
};

const readWordContent = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  const formData = new FormData();
  formData.append('file', blob);

  // Use Edge Function to process Word documents
  const { data, error } = await supabase.functions.invoke('process-document', {
    body: { fileContent: Array.from(new Uint8Array(arrayBuffer)) }
  });

  if (error) {
    throw new Error('Failed to process Word document');
  }

  return data.text;
};
