
export interface EvaluationRequest {
  assignmentText: string;
  instructionsText?: string;
}

export interface EvaluationResult {
  grade: string;
  reasoning: string;
  improvements: string[];
  strengths: string[];
}

export interface SanitizedEvaluation {
  assignment_text: string;
  instructions_text: string;
  grade: string;
  reasoning: string;
  improvements: string[];
  strengths: string[];
}
