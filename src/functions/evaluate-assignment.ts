import { supabase } from "@/integrations/supabase/client";
import { readFileContent } from './file-processing/file-reader';
import { cleanContent } from './utils/text-cleaner';

export interface EvaluationResult {
  grade: string;
  reasoning?: string;
  improvements?: string[] | any[];
  strengths?: string[] | any[];
  extractedSentences?: string[];
  [key: string]: any; // Allow any additional fields
}

export const evaluateAssignment = async (
  assignmentFile: File | null,
  assignmentText: string,
  instructionsFile: File | null,
  instructionsText: string
): Promise<EvaluationResult> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    const today = new Date().toISOString().split('T')[0];

    // Handle usage limits
    if (user?.id) {
      // Handle authenticated user
      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const isAdmin = !!roleData;

      if (!isAdmin) {
        // Get or create today's usage record for authenticated user
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

        // Check and enforce daily limit for authenticated users
        if (usageData.count >= 5) {
          throw new Error('Du har nået din daglige grænse på 5 evalueringer');
        }

        // Increment usage count for authenticated user
        const { error: updateError } = await supabase
          .from('daily_evaluation_usage')
          .update({ count: usageData.count + 1 })
          .eq('user_id', user.id)
          .eq('date', today);

        if (updateError) {
          console.error('Error updating usage count:', updateError);
          throw new Error('Could not update usage count');
        }
      }
    } else {
      // Handle anonymous user
      if (window.location.hostname === 'localhost') {
        // For local development, usage is handled in the UI component
        const localStorageKey = `anonymous_usage_${today}`;
        const storedUsage = localStorage.getItem(localStorageKey);
        const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0;
        
        if (currentUsage >= 5) {
          throw new Error('Du har nået din daglige grænse på 5 evalueringer. Opret en konto for at fortsætte.');
        }
      } else {
        // Production environment - use Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        const { data: ipData } = await supabase.functions.invoke('get-client-ip', { headers });
        const clientIp = ipData?.ip;

        if (!clientIp) {
          throw new Error('Could not determine client IP address');
        }

        // Get or create today's usage record for anonymous user
        let { data: anonUsageData, error: anonUsageError } = await supabase
          .from('anonymous_evaluation_usage')
          .select('count')
          .eq('ip_address', clientIp)
          .eq('date', today)
          .maybeSingle();

        if (anonUsageError) {
          console.error('Error checking anonymous usage:', anonUsageError);
          throw new Error('Could not check usage limit');
        }

        // If no usage record exists, create one
        if (!anonUsageData) {
          const { error: insertError } = await supabase
            .from('anonymous_evaluation_usage')
            .insert({
              ip_address: clientIp,
              date: today,
              count: 0
            });

          if (insertError) {
            console.error('Error creating anonymous usage record:', insertError);
            throw new Error('Could not initialize usage tracking');
          }

          anonUsageData = { count: 0 };
        }

        // Check and enforce daily limit for anonymous users (5 prompts)
        if (anonUsageData.count >= 5) {
          throw new Error('Du har nået din daglige grænse på 5 evalueringer. Opret en konto for at fortsætte.');
        }

        // Increment usage count for anonymous user
        const { error: updateError } = await supabase
          .from('anonymous_evaluation_usage')
          .update({ count: anonUsageData.count + 1 })
          .eq('ip_address', clientIp)
          .eq('date', today);

        if (updateError) {
          console.error('Error updating anonymous usage count:', updateError);
          throw new Error('Could not update usage count');
        }
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

    // Extract sentences from the assignment content for improvement suggestions
    const extractSentences = (text: string): string[] => {
      if (!text) return [];
      
      // Split content into sentences
      const sentences = text
        .replace(/([.!?])\s+/g, "$1|")
        .split("|")
        .filter(s => s.trim().length > 20 && s.trim().length < 200) // Only reasonably sized sentences
        .map(s => s.trim());
      
      // Ensure we have unique sentences
      const uniqueSentences = Array.from(new Set(sentences));
      
      // If we have fewer than 12 sentences, we'll use what we have
      // If we have more than 12, select 12 sentences distributed throughout the text
      if (uniqueSentences.length <= 12) {
        return uniqueSentences;
      } else {
        const result = [];
        const step = Math.floor(uniqueSentences.length / 12);
        
        for (let i = 0; i < 12; i++) {
          const index = Math.min(i * step, uniqueSentences.length - 1);
          result.push(uniqueSentences[index]);
        }
        
        return result;
      }
    };

    // Extract sentences from the assignment content
    const extractedSentences = extractSentences(assignmentContent);

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

    // Add extracted sentences to the evaluation result
    data.extractedSentences = extractedSentences;

    // Only save evaluation to database for authenticated users
    if (user?.id) {
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
    }

    return data;
  } catch (error) {
    console.error('Error in evaluate-assignment function:', error);
    throw error;
  }
};
