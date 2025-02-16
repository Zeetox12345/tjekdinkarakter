
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

    const prompt = `
      Som en erfaren dansklærer, vurder venligst følgende opgave:
      
      ${instructionsContent ? `Opgavebeskrivelse:\n${instructionsContent}\n\n` : ''}
      
      Opgave:\n${assignmentContent}
      
      Giv venligst:
      1. En karakter på 7-trinsskalaen
      2. En detaljeret begrundelse for karakteren
      3. Konkrete forbedringsforslag
      4. Specifikke styrker ved opgaven
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Du er en erfaren dansklærer der vurderer opgaver.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to evaluate assignment');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
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

