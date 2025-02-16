
import { supabase } from "@/integrations/supabase/client";

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
  if (file.type === 'application/pdf') {
    return await readPDFContent(file);
  }
  return await readTextContent(file);
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
  // For now, return a simple text reading. We can enhance this later with PDF.js
  return await readTextContent(file);
};
