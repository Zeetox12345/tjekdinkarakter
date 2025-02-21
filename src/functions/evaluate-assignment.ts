
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
    const user = (await supabase.auth.getUser()).data.user;
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!roleData;

    if (!isAdmin) {
      // Get or create today's usage record
      const today = new Date().toISOString().split('T')[0];
      let { data: usageData, error: usageError } = await supabase
        .from('daily_evaluation_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (usageError) {
        console.error('Error checking usage:', usageError);
        throw new Error('Could not check usage limit');
      }

      // If no usage record exists, create one
      if (!usageData) {
        const { error: insertError } = await supabase
          .from('daily_evaluation_usage')
          .insert({
            user_id: user.id,
            date: today,
            count: 0
          });

        if (insertError) {
          console.error('Error creating usage record:', insertError);
          throw new Error('Could not initialize usage tracking');
        }

        usageData = { count: 0 };
      }

      if (usageData.count >= 5) {
        throw new Error('Du har nået din daglige grænse på 5 evalueringer');
      }
    }

    let assignmentContent = assignmentText || '';
    let instructionsContent = instructionsText || '';

    if (assignmentFile) {
      assignmentContent = await readFileContent(assignmentFile);
    }

    if (instructionsFile) {
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
        user_id: user.id
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
