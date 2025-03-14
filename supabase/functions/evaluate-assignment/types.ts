export interface EvaluationRequest {
  assignmentText: string;
  instructionsText?: string;
}

export interface SanitizedEvaluation {
  assignment_text: string;
  instructions_text: string;
  grade: string;
  reasoning: string;
  improvements: string[];
  strengths: string[];
}

// Basic required fields for backward compatibility
export interface EvaluationResult {
  grade: string;
  [key: string]: any; // Allow any additional fields
}
