
import { EvaluationResult } from './types.ts';
import { cleanJsonContent } from './text-utils.ts';
import { getSystemPrompt, getEvaluationPrompt } from './prompts.ts';

export async function getOpenAIEvaluation(
  assignmentText: string,
  instructionsText?: string
): Promise<EvaluationResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: getSystemPrompt()
        },
        { 
          role: 'user', 
          content: getEvaluationPrompt(assignmentText, instructionsText)
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API Error:', errorData);
    throw new Error(errorData.error?.message || 'Failed to evaluate assignment');
  }

  const data = await response.json();
  const evaluationContent = cleanJsonContent(data.choices[0].message.content);

  try {
    return JSON.parse(evaluationContent);
  } catch (error) {
    console.error('JSON Parse Error:', error, 'Content:', evaluationContent);
    throw new Error('Failed to parse evaluation response');
  }
}
