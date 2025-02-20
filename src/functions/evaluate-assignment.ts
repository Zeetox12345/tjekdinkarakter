
import { supabase } from "@/integrations/supabase/client";
import { readFileContent } from './file-processing/file-reader';
import { cleanContent } from './utils/text-cleaner';

export interface EvaluationResult {
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

    // After successful evaluation, insert into evaluations table which triggers the daily usage counter
    const { error: insertError } = await supabase
      .from('evaluations')
      .insert({
        assignment_text: assignmentContent,
        instructions_text: instructionsContent,
        grade: data.grade,
        reasoning: data.reasoning,
        improvements: data.improvements,
        strengths: data.strengths,
      });

    if (insertError) {
      console.error('Error inserting evaluation:', insertError);
    }

    return data;
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    throw error;
  }
};
