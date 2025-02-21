
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
    // Get the current user's daily usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usageData } = await supabase
      .from('daily_evaluation_usage')
      .select('count')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('date', today)
      .maybeSingle();

    const currentUsage = usageData?.count || 0;
    if (currentUsage >= 5) {
      throw new Error('Du har nået din daglige grænse på 5 evalueringer');
    }

    let assignmentContent = assignmentText || '';
    let instructionsContent = instructionsText || '';

    if (assignmentFile) {
      console.log('Processing assignment file:', assignmentFile.name);
      assignmentContent = await readFileContent(assignmentFile);
    }

    if (instructionsFile) {
      console.log('Processing instructions file:', instructionsFile.name);
      instructionsContent = await readFileContent(instructionsFile);
    }

    if (!assignmentContent.trim()) {
      throw new Error('No content found in assignment');
    }

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
      throw new Error(`Failed to evaluate assignment: ${error.message}`);
    }

    if (!data) {
      throw new Error('No evaluation data received');
    }

    // Insert the evaluation which will trigger the daily usage increment
    const { error: insertError } = await supabase
      .from('evaluations')
      .insert({
        assignment_text: assignmentContent,
        instructions_text: instructionsContent,
        grade: data.grade,
        reasoning: data.reasoning,
        improvements: data.improvements,
        strengths: data.strengths,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (insertError) {
      console.error('Error inserting evaluation:', insertError);
      throw new Error('Failed to save evaluation');
    }

    return data;
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    throw error;
  }
};
