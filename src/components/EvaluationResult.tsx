﻿import { Card } from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Copy, 
  CheckCircle, 
  Sparkles,
  ArrowUp, 
  ThumbsUp, 
  Award,
  Lightbulb,
  Zap,
  BookOpen,
  CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// New interface for question data
interface QuestionData {
  type: 'math' | 'multiplechoice' | 'trueFalse' | 'text';
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
  options?: string[]; // For multiple choice questions
  subjectArea?: string; // More specific categorization (e.g., "Algebra", "Grammar", "History-WWII")
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface EvaluationResultProps {
  evaluation: {
    grade?: string;
    reasoning?: string;
    improvements?: string[] | any[];
    strengths?: string[] | any[];
    rawText?: string; // Raw ChatGPT response
    [key: string]: any; // Allow any additional fields from flexible AI response
  };
  isPremium?: boolean;
  assignment?: {
    subject?: string;
    title?: string;
    content?: string;
    wordCount?: number;
    submissionDate?: string;
    assignmentType?: string; // essay, report, analysis, etc.
    questionData?: QuestionData; // New field for simple questions
  };
}

// Map Danish 7-scale grades to more generous descriptions
const gradeDescriptions: Record<string, { description: string, emoji: string, color: string, bgGradient: string }> = {
  "12": { 
    description: "Fremragende præstation! Du har demonstreret en exceptionel forståelse af emnet.",
    emoji: "🏆",
    color: "text-green-600",
    bgGradient: "from-green-400 to-emerald-500"
  },
  "10": { 
    description: "Fortrinlig præstation! Du viser stor indsigt og kun få mindre mangler.",
    emoji: "🌟",
    color: "text-emerald-600",
    bgGradient: "from-emerald-400 to-teal-500"
  },
  "7": { 
    description: "God præstation! Du har en solid forståelse med plads til forbedring.",
    emoji: "👍",
    color: "text-blue-600",
    bgGradient: "from-blue-400 to-indigo-500"
  },
  "4": { 
    description: "Jævn præstation med potentiale. Med få justeringer kan du nå meget højere!",
    emoji: "⚡",
    color: "text-yellow-600",
    bgGradient: "from-yellow-400 to-amber-500"
  },
  "02": { 
    description: "Du har opnået de grundlæggende mål. Med lidt mere arbejde kan du forbedre dig markant!",
    emoji: "🔍",
    color: "text-orange-500",
    bgGradient: "from-orange-400 to-amber-500"
  },
  "00": { 
    description: "Du er tæt på at nå målet! Med fokuseret indsats kan du bestå næste gang.",
    emoji: "🚀",
    color: "text-red-500",
    bgGradient: "from-red-400 to-orange-500"
  },
  "-3": { 
    description: "Der er plads til forbedring, men du har potentiale! Lad os fokusere på næste skridt.",
    emoji: "💪",
    color: "text-red-600",
    bgGradient: "from-red-500 to-pink-600"
  },
};

// Upgrade grades to be more generous, but only for non-math questions or correct math answers
const upgradeGrade = (grade: string, assignment?: EvaluationResultProps['assignment']): string => {
  // Don't upgrade grades for math questions with incorrect answers
  if (assignment?.questionData?.type === 'math') {
    const studentAnswer = assignment.questionData.studentAnswer;
    const correctAnswer = assignment.questionData.correctAnswer;
    
    // If the answer is incorrect, don't upgrade the grade
    if (studentAnswer !== correctAnswer) {
      return grade;
    }
  }
  
  const gradeMap: Record<string, string> = {
    "-3": "00",
    "00": "02",
    "02": "4",
    "4": "7",
    "7": "10",
    // 12 stays at 12
  };
  
  return gradeMap[grade] || grade;
};

// Add this at the top of the file, near other interfaces
interface DetailedImprovement {
  category: string;
  original: string;
  context?: string;
  suggestions: {
    title: string;
    improved: string;
    explanation: string;
    note?: string;
  }[];
}

// Declare the global window interface to include assignment property
declare global {
  interface Window {
    assignment?: {
      subject?: string;
      content?: string;
      title?: string;
      assignmentType?: string;
      questionData?: {
        type?: string;
      };
    };
  }
}

// Move these helper functions to the top of the file, before they're used
// Helper functions for text processing
const cleanCitationText = (text: string): string => {
  // Remove any embedded improvement suggestions
  let cleaned = text;
  
  // Remove "FORBEDRING:" and everything after it
  if (cleaned.includes("FORBEDRING:")) {
    cleaned = cleaned.split("FORBEDRING:")[0].trim();
  }
  
  // Remove "OMSKRIV TIL:" and everything after it
  if (cleaned.includes("OMSKRIV TIL:")) {
    cleaned = cleaned.split("OMSKRIV TIL:")[0].trim();
  }
  
  // Remove category markers
  cleaned = cleaned.replace(/❌\s*Sprog:/gi, "").trim();
  cleaned = cleaned.replace(/❌\s*Fagligt indhold:/gi, "").trim();
  cleaned = cleaned.replace(/❌\s*Struktur:/gi, "").trim();
  cleaned = cleaned.replace(/❌\s*Kritisk tænkning:/gi, "").trim();
  cleaned = cleaned.replace(/❌\s*Praktisk anvendelse:/gi, "").trim();
  
  // Remove quotes if they're at the beginning and end
  cleaned = cleaned.replace(/^"|"$/g, "").trim();
  
  return cleaned;
};

const separateImprovedTextAndNote = (text: string): { improvedText: string; note?: string } => {
  // Common patterns for explanatory notes
  const notePatterns = [
    /\.\s*(Dette giver teksten et mere professionelt udtryk\.?)$/,
    /\.\s*(Dette vil give din opgave mere dybde og præcision\.?)$/,
    /\.\s*(Herved bliver din argumentation mere overbevisende\.?)$/,
    /\.\s*(Dette vil løfte kvaliteten af din opgave betydeligt\.?)$/,
    /\.\s*(Dette leder til en mere overbevisende konklusion på dit argument\.?)$/
  ];
  
  for (const pattern of notePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Return the text without the explanatory note, and the note separately
      return {
        improvedText: text.replace(pattern, '.'),
        note: match[1]
      };
    }
  }
  
  // If no explanatory note is found, return the original text
  return { improvedText: text };
};

// Process the text to preserve formatting but make it HTML-safe
const processText = (text: string) => {
  return text
    // Preserve emojis and special characters
    .replace(/✅/g, '<span class="text-green-500">✅</span>')
    .replace(/❌/g, '<span class="text-red-500">❌</span>')
    .replace(/📌/g, '<span class="text-blue-500">📌</span>')
    .replace(/📊/g, '<span class="text-purple-500">📊</span>')
    .replace(/💪/g, '<span>💪</span>')
    .replace(/😊/g, '<span>😊</span>')
    // Convert newlines to <br> tags
    .split('\n').join('<br />');
};

const EvaluationResult = ({ evaluation, isPremium = false, assignment }: EvaluationResultProps) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  // Store the final grade in state to prevent it from changing during scrolling
  const [finalGrade, setFinalGrade] = useState<string | undefined>(undefined);
  
  // Set the final grade once on component mount
  useEffect(() => {
    if (evaluation.grade && !evaluation.rawText) {
      setFinalGrade(upgradeGrade(evaluation.grade, assignment));
    } else if (evaluation.grade) {
      setFinalGrade(evaluation.grade);
    }
  }, [evaluation.grade, evaluation.rawText, assignment]);
  
  // Generate a formatted text from structured data if rawText is not available
  const getDisplayText = () => {
    // If rawText is provided, use it directly
    if (evaluation.rawText) {
      return evaluation.rawText;
    }
    
    // Otherwise, generate a formatted text from the structured data
    let formattedText = "Jeg har læst din opgave, og jeg kan give en vurdering af den ud fra en typisk dansk gymnasial standard.\n\n";
    formattedText += "Vurdering af din opgave\n\n";
    
    // Add grade if available - use finalGrade instead of evaluation.grade
    if (finalGrade) {
      formattedText += `Karakter: ${finalGrade}\n\n`;
    }
    
    // Add reasoning/explanation if available
    if (evaluation.reasoning) {
      formattedText += `${evaluation.reasoning}\n\n`;
    }
    
    // Add strengths section if available
    if (evaluation.strengths && evaluation.strengths.length > 0) {
      formattedText += "Styrker\n";
      evaluation.strengths.forEach((strength: any) => {
        if (typeof strength === 'string') {
          formattedText += `✅ ${strength}\n\n`;
        } else if (typeof strength === 'object') {
          formattedText += `✅ ${JSON.stringify(strength)}\n\n`;
        }
      });
    }
    
    // Add improvements section if available
    if (evaluation.improvements && evaluation.improvements.length > 0) {
      formattedText += "Forbedringspunkter\n";
      evaluation.improvements.forEach((improvement: any) => {
        if (typeof improvement === 'string') {
          formattedText += `❌ ${improvement}\n\n`;
        } else if (typeof improvement === 'object') {
          formattedText += `❌ ${JSON.stringify(improvement)}\n\n`;
        }
      });
    }
    
    // Add any additional sections from the evaluation
    Object.entries(evaluation).forEach(([key, value]) => {
      // Skip already processed fields and empty values
      if (['grade', 'reasoning', 'strengths', 'improvements', 'rawText'].includes(key) || 
          !value || key.startsWith('_')) {
        return;
      }
      
      // Format the section title
      const sectionTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      formattedText += `${sectionTitle}\n\n`;
      
      // Format the content based on its type
      if (typeof value === 'string') {
        formattedText += `${value}\n\n`;
      } else if (Array.isArray(value)) {
        value.forEach((item: any) => {
          if (typeof item === 'string') {
            formattedText += `• ${item}\n`;
          } else if (typeof item === 'object') {
            formattedText += `• ${JSON.stringify(item)}\n`;
          }
        });
        formattedText += "\n";
      }
    });
    
    // Add a conclusion
    formattedText += "Konklusion\n\n";
    formattedText += "Tak for din opgave. Jeg håber, at min feedback er nyttig for dit videre arbejde. Hvis du har spørgsmål til vurderingen, er du velkommen til at spørge. 📚✨";
    
    return formattedText;
  };

  // Extract improvement suggestions with "better versions" from text
  const extractImprovements = (text: string) => {
    const improvements: { original: string; improved: string; prefix?: string; context?: string }[] = [];
    
    // Look for patterns like:
    // "Fagligt indhold: Manglende dybde i analysen [CITAT: "Det er samtidig et bevis på den amerikanske drøm..."] OMSKRIV TIL: "Denne passage illustrerer..."
    const regex = /([^"]+)\[CITAT: "([^"]+)"\]\s*OMSKRIV TIL:\s*"([^"]+)"\s*(?:FORBEDRING:\s*([^"]+))?/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      improvements.push({
        original: match[1].trim(),
        context: match[2].trim(),
        improved: match[3].trim(),
        prefix: match[4] ? match[4].trim() : undefined
      });
    }
    
    // Look for patterns like "FORBEDRING: En tydeligere konklusion..." with embedded citations
    const forbedringRegex = /FORBEDRING:\s*([^❌\[]+)(?:❌\s*([^[]+))?\s*\[CITAT:\s*"([^"]+)"\]/gi;
    while ((match = forbedringRegex.exec(text)) !== null) {
      const original = match[2] ? match[2].trim() : "Forbedringspotentiale i formuleringen";
      improvements.push({
        original: original,
        context: match[3].trim(),
        improved: match[1].trim(),
        prefix: "FORBEDRING"
      });
    }
    
    // If no matches found, try the simpler pattern
    if (improvements.length === 0) {
      const simpleRegex = /"([^"]+)"\s*–\s*(?:(Det burde være|Bedre formulering kunne være:|OMSKRIV TIL:))\s*"([^"]+)"/g;
      while ((match = simpleRegex.exec(text)) !== null) {
        improvements.push({
          original: match[1],
          improved: match[3],
          prefix: match[2]
        });
      }
    }
    
    // Also look for any quoted text that might be citations
    const quotedTextRegex = /"([^"]{15,})"/g;
    const foundQuotes = new Set<string>();
    
    // Add already found quotes to the set to avoid duplicates
    improvements.forEach(imp => {
      if (imp.context) foundQuotes.add(imp.context);
    });
    
    // Find additional quotes that could be used as citations
    while ((match = quotedTextRegex.exec(text)) !== null) {
      const quote = match[1].trim();
      // Only add if it's not already included and is reasonably long
      if (!foundQuotes.has(quote) && quote.length > 20 && quote.length < 200) {
        foundQuotes.add(quote);
        // For these quotes, we don't have specific improvements yet
        improvements.push({
          original: "Forbedringspotentiale i formuleringen",
          context: quote,
          improved: "", // Will be generated later
          prefix: undefined
        });
      }
    }
    
    // Clean up any malformed improvements
    return improvements.map(imp => {
      // Check if the context contains both original and improved text
      if (imp.context && imp.context.includes("FORBEDRING:")) {
        const parts = imp.context.split("FORBEDRING:");
        if (parts.length > 1) {
          return {
            ...imp,
            context: parts[0].trim(),
            improved: parts[1].trim()
          };
        }
      }
      
      // Check if the context contains both original and improved text with other markers
      if (imp.context && (imp.context.includes("kunne omformuleres til:") || imp.context.includes("OMSKRIV TIL:"))) {
        let contextPart = imp.context;
        let improvedPart = "";
        
        if (imp.context.includes("kunne omformuleres til:")) {
          const parts = imp.context.split("kunne omformuleres til:");
          if (parts.length > 1) {
            contextPart = parts[0].trim();
            improvedPart = parts[1].trim();
          }
        } else if (imp.context.includes("OMSKRIV TIL:")) {
          const parts = imp.context.split("OMSKRIV TIL:");
          if (parts.length > 1) {
            contextPart = parts[0].trim();
            improvedPart = parts[1].trim();
          }
        }
        
        // If we successfully split it
        if (improvedPart) {
          return {
            ...imp,
            context: contextPart,
            improved: improvedPart.replace(/^"|"$/g, '') // Remove quotes if present
          };
        }
      }
      
      // Check if the original contains category markers that should be separated
      if (imp.original && imp.original.includes("❌")) {
        const parts = imp.original.split("❌");
        if (parts.length > 1) {
      return {
            ...imp,
            original: parts[1].trim()
          };
        }
      }
      
      return imp;
    });
  };
  
  // Extract overall evaluation from text
  const extractOverallEvaluation = (text: string) => {
    // Look for patterns like "Jeg har læst din opgave, og jeg kan give en vurdering..."
    const regex = /Jeg har læst din opgave[^\.]+\.\s*([^]*?)(?=Styrker|Forbedringspunkter|Konklusion|$)/i;
    const match = regex.exec(text);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
  };

  // Extract specific improvement points from text
  const extractSpecificImprovements = (text: string) => {
    // Look for patterns like "Forbedringspunkter ❌ Fagligt indhold: Manglende dybde..."
    const regex = /Forbedringspunkter\s*([^]*?)(?=Konklusion|$)/i;
    const match = regex.exec(text);
    
    if (match && match[1]) {
      // Split by ❌ to get individual improvement points
      const points = match[1].split('❌').filter(p => p.trim().length > 0);
      return points.map(point => point.trim());
    }
    
    return [];
  };

  // Clean up improvement text to remove the overall evaluation
  const cleanImprovementText = (text: string) => {
    // Remove the standard intro text that appears in every evaluation
    const introPattern = /^Jeg har læst din opgave, og jeg kan give en vurdering af den ud fra en typisk dansk gymnasial standard\.\s*Vurdering af din opgave\s*Karakter:\s*\d+\s*/i;
    let cleaned = text.replace(introPattern, '');
    
    // Remove any text that looks like an overall evaluation
    const evalPattern = /Besvarelsen demonstrerer en[^\.]+\./g;
    cleaned = cleaned.replace(evalPattern, '');
    
    // Remove any strengths section markers
    const strengthsPattern = /Styrker\s*✅/g;
    cleaned = cleaned.replace(strengthsPattern, '');
    
    // Remove all the strengths and positive points that come before the actual improvement
    const strengthsRemovalPattern = /.*?(?:Fagligt indhold|Struktur|Sprog|Kritisk tænkning|Praktisk anvendelse):[^❌]+✅\s*/g;
    cleaned = cleaned.replace(strengthsRemovalPattern, '');
    
    // Remove "Forbedringspunkter" text
    cleaned = cleaned.replace(/Forbedringspunkter\s*/, '');
    
    // Focus on just the specific improvement point after the ❌ symbol
    if (cleaned.includes('❌')) {
      const parts = cleaned.split('❌');
      if (parts.length > 1) {
        // Take the part after the ❌ symbol
        cleaned = parts[1].trim();
      }
    }
    
    // If there are multiple improvement points, take only the first one
    const specificPattern = /Fagligt indhold:|Sprog:|Struktur:|Kritisk tænkning:|Praktisk anvendelse:/i;
    const match = specificPattern.exec(cleaned);
    
    if (match) {
      // Get the text from the specific improvement marker
      const startIndex = cleaned.indexOf(match[0]);
      if (startIndex >= 0) {
        cleaned = cleaned.substring(startIndex);
        
        // If there's another improvement point after this one, cut it off
        const nextImprovement = cleaned.indexOf('❌', 1);
        if (nextImprovement > 0) {
          cleaned = cleaned.substring(0, nextImprovement).trim();
        }
      }
    }
    
    return cleaned.trim();
  };

  // Handle copying text to clipboard - only copy the improved text
  const copyToClipboard = (text: string) => {
    // Clean up the text before copying
    let cleanText = text;
    
    // Remove any quotes at the beginning and end
    cleanText = cleanText.replace(/^["']|["']$/g, '');
    
    // Remove explanatory phrases like "kunne styrkes til:" or "kunne præciseres til:"
    const explanatoryPhrases = [
      /^"[^"]*"\s*kunne styrkes til:\s*/i,
      /^"[^"]*"\s*kunne præciseres til:\s*/i,
      /^"[^"]*"\s*kunne objektiveres til:\s*/i,
      /^"[^"]*"\s*kunne nuanceres til:\s*/i,
      /^"[^"]*"\s*kunne omformuleres til:\s*/i,
      /^"[^"]*"\s*kunne uddybes til:\s*/i,
      /^"[^"]*"\s*kunne uddybes med:\s*/i,
      /^"[^"]*"\s*kunne styrkes med fagbegreber:\s*/i,
      /^"[^"]*"\s*kunne underbygges med:\s*/i,
      /^"[^"]*"\s*kunne styrkes med data:\s*/i
    ];
    
    for (const phrase of explanatoryPhrases) {
      cleanText = cleanText.replace(phrase, '');
    }
    
    // Ensure the text is a concrete example, not an evaluative statement
    if (cleanText.includes('ville skabe') || 
        cleanText.includes('ville give') || 
        cleanText.includes('ville forbedre') ||
        cleanText.includes('ville styrke')) {
      // This is likely an evaluative statement, not concrete text
      // Replace it with a concrete example based on the category
      const category = 
        cleanText.includes('struktur') || cleanText.includes('flow') ? 'struktur' :
        cleanText.includes('sprog') || cleanText.includes('formulering') ? 'sprog' :
        cleanText.includes('fagbegreber') || cleanText.includes('fagligt') ? 'fagbegreber' :
        cleanText.includes('kritisk') || cleanText.includes('nuancering') ? 'kritisk' :
        cleanText.includes('analyse') || cleanText.includes('dybde') ? 'analyse' : 'default';
      
      const examples = {
        'struktur': "I det følgende afsnit vil jeg analysere, hvordan de centrale faktorer påvirker den overordnede problemstilling.",
        'sprog': "Analysen viser en signifikant sammenhæng mellem de observerede faktorer, hvilket understøtter den teoretiske model.",
        'fagbegreber': "Gennem anvendelsen af relevante fagbegreber kan vi opnå en dybere forståelse af fænomenets kompleksitet.",
        'kritisk': "Selvom denne tilgang har flere styrker, er det vigtigt at anerkende dens begrænsninger i forhold til kontekstuelle faktorer.",
        'analyse': "En dybdegående analyse af datamaterialet afslører mønstre, som bidrager til en mere nuanceret forståelse af problemstillingen.",
        'default': "Denne formulering præciserer argumentet og skaber en tydeligere sammenhæng mellem præmisser og konklusion."
      };
      
      cleanText = examples[category];
    }
    
    navigator.clipboard.writeText(cleanText);
    setCopiedText(text); // Keep the original text for UI feedback
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Show confetti animation when component mounts
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate more detailed improvement suggestions with diverse feedback types
  const generateDetailedImprovements = (text: string) => {
    // Base improvements from the text
    const extractedImprovements = extractImprovements(text);
    
    // Define the interface for improvement objects
    interface DetailedImprovement {
      category: string;
      original: string;
      context?: string;
      suggestions: { title: string; improved: string; explanation: string; note?: string }[];
    }
    
    // Helper function to clean up citation text
    const cleanCitationText = (text: string): string => {
      // Remove excessive whitespace and normalize
      return text.trim().replace(/\s+/g, ' ');
    };
    
    const separateImprovedTextAndNote = (text: string): { improved: string; note?: string } => {
      // Check if there's a note section (indicated by a specific format like "Note:" or similar)
      const noteSeparator = /\s*\(Note:|\s*\[Note:|\s*Note:/i;
      const parts = text.split(noteSeparator);
      
      if (parts.length > 1) {
        return {
          improved: parts[0].trim(),
          note: parts[1].replace(/\)$|\]$/g, '').trim()
        };
      }
      
      return { improved: text.trim() };
    };
    
    // Ensure we have exactly 12 detailed improvements
    const ensureTwelveImprovements = (improvements: DetailedImprovement[]): DetailedImprovement[] => {
      // If we have more than 12, take the first 12
      if (improvements.length >= 12) {
        return improvements.slice(0, 12);
      }
      
      // If we have less than 12, generate additional improvements
      const additionalImprovement = (index: number): DetailedImprovement => {
        // Common improvement categories we want to ensure are covered
        const commonCategories = [
          "Fagligt indhold", "Struktur", "Sprog", "Kritisk tænkning", 
          "Analyse", "Argumentation", "Praktisk anvendelse", "Fagterminologi", 
          "Kilder", "Metode", "Konklusion", "Perspektivering"
        ];
        
        // Check which categories we already have
        const existingCategories = new Set(improvements.map(imp => imp.category));
        
        // Find a category we don't have yet
        const missingCategories = commonCategories.filter(cat => !existingCategories.has(cat));
        const newCategory = missingCategories.length > 0 
          ? missingCategories[index % missingCategories.length] 
          : commonCategories[index % commonCategories.length];
        
        // Create a new improvement with this category
        return {
          category: newCategory,
          original: `Forbedringspotentiale inden for ${newCategory.toLowerCase()}`,
          suggestions: generateHighQualitySuggestions(`Forbedringspotentiale inden for ${newCategory.toLowerCase()}`)
        };
      };
      
      // Add additional improvements until we have 12
      const result = [...improvements];
      for (let i = improvements.length; i < 12; i++) {
        result.push(additionalImprovement(i));
      }
      
      return result;
    };
    
    // Get sentences from the evaluation result
    const assignmentSentences = evaluation.extractedSentences || [];
    
    // Create detailed improvements from the sentences
    let detailedImprovements: DetailedImprovement[] = [];
    
    if (assignmentSentences.length > 0) {
      // Create one detailed improvement per sentence
      detailedImprovements = assignmentSentences.map((sentence, index) => {
        // Determine the category based on the sentence content or index
        const sentenceLower = sentence.toLowerCase();
        const category = sentenceLower.includes('sprog') ? 'Sprog' :
                        sentenceLower.includes('struktur') ? 'Struktur' :
                        sentenceLower.includes('analyse') ? 'Analyse' :
                        sentenceLower.includes('argument') ? 'Argumentation' :
                        sentenceLower.includes('kilde') ? 'Kildehenvisning' :
                        sentenceLower.includes('fagligt') ? 'Fagligt indhold' :
                        sentenceLower.includes('kritisk') ? 'Kritisk tænkning' :
                        sentenceLower.includes('praktisk') ? 'Praktisk anvendelse' :
                        index % 12 < 1 ? 'Fagligt indhold' :
                        index % 12 < 2 ? 'Struktur' :
                        index % 12 < 3 ? 'Sprog' :
                        index % 12 < 4 ? 'Kritisk tænkning' :
                        index % 12 < 5 ? 'Analyse' :
                        index % 12 < 6 ? 'Argumentation' :
                        index % 12 < 7 ? 'Praktisk anvendelse' :
                        index % 12 < 8 ? 'Fagterminologi' :
                        index % 12 < 9 ? 'Kilder' :
                        index % 12 < 10 ? 'Metode' :
                        index % 12 < 11 ? 'Konklusion' : 'Perspektivering';
        
        // Generate improvement suggestions based on the sentence
        const suggestions = generateHighQualitySuggestions(`Forbedringspotentiale i ${category.toLowerCase()}`, sentence);
        
        return {
          category,
          original: `Forbedringspotentiale i ${category.toLowerCase()}`,
          context: sentence,
          suggestions
        } as DetailedImprovement;
      });
    } else if (extractedImprovements.length > 0) {
      // Fallback to extracted improvements if no sentences are available
      detailedImprovements = extractedImprovements.map((imp, index) => {
        // Determine the category based on the original text
        const original = imp.original || "";
        const category = original.includes('sprog') ? 'Sprog' :
                        original.includes('struktur') ? 'Struktur' :
                        original.includes('analyse') ? 'Analyse' :
                        original.includes('argument') ? 'Argumentation' :
                        original.includes('kilde') ? 'Kildehenvisning' :
                        original.includes('fagligt') ? 'Fagligt indhold' :
                        original.includes('kritisk') ? 'Kritisk tænkning' :
                        original.includes('Praktisk anvendelse') ? 'Praktisk anvendelse' : 'Generelt';
        
        // Clean up the original text to remove overall evaluation
        const cleanedOriginal = cleanImprovementText(original);
        
        // Clean up the context if it exists
        const cleanedContext = imp.context ? cleanCitationText(imp.context) : undefined;
        
        // Generate one appropriate suggestion based on the original improvement
        const suggestions = generateHighQualitySuggestions(cleanedOriginal, cleanedContext);
        
        return {
          category,
          original: cleanedOriginal,
          context: cleanedContext,
          suggestions
        } as DetailedImprovement;
      });
    } else if (evaluation.improvements && evaluation.improvements.length > 0) {
      // For each improvement point, generate a detailed suggestion
      evaluation.improvements.forEach((improvement: any, index: number) => {
        if (typeof improvement === 'string') {
          // Clean up the improvement text
          const cleanedImprovement = cleanImprovementText(improvement);
          
          // Generate a category from the improvement
          const category = cleanedImprovement.includes('sprog') ? 'Sprog' :
                          cleanedImprovement.includes('struktur') ? 'Struktur' :
                          cleanedImprovement.includes('analyse') ? 'Analyse' :
                          cleanedImprovement.includes('argument') ? 'Argumentation' :
                          cleanedImprovement.includes('kilde') ? 'Kildehenvisning' :
                          cleanedImprovement.includes('fagligt') ? 'Fagligt indhold' :
                          cleanedImprovement.includes('kritisk') ? 'Kritisk tænkning' :
                          cleanedImprovement.includes('Praktisk anvendelse') ? 'Praktisk anvendelse' : 'Generelt';
          
          // Generate a suggestion
          const suggestions = generateHighQualitySuggestions(cleanedImprovement);
          
          detailedImprovements.push({
            category,
            original: cleanedImprovement,
            suggestions
          });
        }
      });
    }
    
    // If we have no improvements from any source, generate standard improvements
    if (detailedImprovements.length === 0) {
      // Generate standard improvement categories
      const standardCategories = [
        "Fagligt indhold", "Struktur", "Sprog", "Kritisk tænkning", 
        "Analyse", "Argumentation", "Praktisk anvendelse", "Fagterminologi", 
        "Kilder", "Metode", "Konklusion", "Perspektivering"
      ];
      
      detailedImprovements = standardCategories.map(category => {
        const improvementType = `Forbedringspotentiale inden for ${category.toLowerCase()}`;
    return {
          category,
          original: improvementType,
          suggestions: generateHighQualitySuggestions(improvementType)
        };
      });
    }
    
    // Ensure we have exactly 12 improvements
    return ensureTwelveImprovements(detailedImprovements);
  };

  // Generate additional citations from the assignment content if available
  const generateAdditionalCitations = (assignment?: EvaluationResultProps['assignment']): { original: string; context: string; improved: string; prefix?: string }[] => {
    const additionalCitations = [];
    
    if (assignment?.content) {
      // Split content into sentences or paragraphs
      const sentences = assignment.content
        .replace(/([.!?])\s+/g, "$1|")
        .split("|")
        .filter(s => s.length > 30 && s.length < 200); // Only reasonably sized sentences
      
      // Select up to 3 random sentences to use as citations
      const selectedSentences = [];
      if (sentences.length > 0) {
        // Try to get sentences from different parts of the text
        const third = Math.floor(sentences.length / 3);
        if (third > 0) {
          // Get one from each third if possible
          selectedSentences.push(
            sentences[Math.floor(Math.random() * third)],
            sentences[Math.floor(Math.random() * third) + third],
            sentences[Math.floor(Math.random() * third) + 2 * third]
          );
        } else {
          // Just get random ones if text is short
          for (let i = 0; i < Math.min(3, sentences.length); i++) {
            selectedSentences.push(sentences[Math.floor(Math.random() * sentences.length)]);
          }
        }
        
        // Create improvement objects for each selected sentence
        selectedSentences.forEach(sentence => {
          additionalCitations.push({
            original: "Forbedringspotentiale i formuleringen",
            context: sentence.trim(),
            improved: "", // Will be generated by generateHighQualitySuggestions
            prefix: undefined
          });
        });
      }
    }
    
    return additionalCitations;
  };
  
  // Get the text to display
  const displayText = getDisplayText();
  
  // Extract improvements for interactive features
  const improvements = extractImprovements(displayText);
  
  // Generate detailed improvements
  const detailedImprovements = generateDetailedImprovements(displayText);

  // Render the component with the detailedImprovements
  return (
    <div className="space-y-6">
      {/* Confetti animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                initial={{ 
                  y: -20, 
                  opacity: 0 
                }}
                animate={{ 
                  y: `${Math.random() * 100 + 100}vh`, 
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  rotate: `${Math.random() * 360}deg`
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  ease: "easeOut",
                  delay: Math.random() * 0.5
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-6 relative overflow-hidden bg-white shadow-md">
        {/* Header with title */}
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
          <h2 className="text-lg font-semibold text-gray-800">AI Evaluering</h2>
                  </div>
        
        {/* Add special section for math questions with incorrect answers */}
        {assignment?.questionData?.type === 'math' && 
         assignment.questionData.studentAnswer !== assignment.questionData.correctAnswer && (
          <motion.div 
            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-start">
              <span className="text-red-500 mr-2 mt-1 flex-shrink-0">❌</span>
              <div>
                <p className="font-medium text-red-700 mb-1">Dit svar er ikke korrekt</p>
                <div className="flex flex-col space-y-2">
                  <div className="flex">
                    <span className="font-medium w-32">Spørgsmål:</span>
                    <span>{assignment.questionData.question}</span>
                            </div>
                  <div className="flex">
                    <span className="font-medium w-32">Dit svar:</span>
                    <span className="text-red-600">{assignment.questionData.studentAnswer}</span>
                          </div>
                  <div className="flex">
                    <span className="font-medium w-32">Korrekt svar:</span>
                    <span className="text-green-600">{assignment.questionData.correctAnswer}</span>
                        </div>
                  {assignment.questionData.explanation && (
                    <div className="flex">
                      <span className="font-medium w-32">Forklaring:</span>
                      <span>{assignment.questionData.explanation}</span>
                  </div>
                  )}
                </div>
              </div>
          </div>
          </motion.div>
        )}
        
        {/* Centered grade display - use finalGrade instead of evaluation.grade */}
        {finalGrade && (
          <motion.div 
            className="flex flex-col items-center justify-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="mb-4"
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ 
                scale: [0.5, 1.2, 1], 
                opacity: 1, 
                rotate: [0, 5, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                times: [0, 0.6, 1]
              }}
                  >
                    <div className={cn(
                "relative flex items-center justify-center",
                "w-28 h-28 rounded-full shadow-lg",
                "bg-gradient-to-br",
                gradeDescriptions[finalGrade]?.bgGradient || "from-blue-400 to-indigo-500"
              )}>
                <motion.div
                  className="absolute inset-0 rounded-full opacity-50"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)`
                  }}
                />
                <div className="flex flex-col items-center justify-center text-white">
                  <span className="text-5xl font-bold">{finalGrade}</span>
                  <span className="text-2xl mt-1">{gradeDescriptions[finalGrade]?.emoji || "🎓"}</span>
                    </div>
                    </div>
            </motion.div>
            
            <motion.div 
              className="w-full max-w-lg p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-start">
                <Award className="h-5 w-5 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                <p className={cn(
                  "font-medium text-center",
                  gradeDescriptions[finalGrade]?.color || "text-gray-700"
                )}>
                  {gradeDescriptions[finalGrade]?.description || 
                   "Godt arbejde med din opgave!"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Main content */}
        <div className="space-y-6">
          {/* Overall evaluation section - moved from reasoning to be more prominent */}
          {(evaluation.reasoning || extractOverallEvaluation(displayText)) && (
            <motion.div 
              className="p-4 rounded-lg border border-blue-100 bg-blue-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center mb-3">
                <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-blue-800">Overordnet vurdering</h3>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <p className="text-gray-700 whitespace-pre-line">
                  {evaluation.reasoning || extractOverallEvaluation(displayText)}
                </p>
                </div>
            </motion.div>
              )}

          {/* Strengths section */}
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <motion.div
              className="p-4 rounded-lg border border-green-100 bg-green-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <div className="flex items-center mb-3">
                <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-800">Styrker</h3>
                </div>
              
              <ul className="space-y-3">
                {evaluation.strengths.map((strength: any, index: number) => (
                  <motion.li 
                    key={index}
                    className="flex items-start bg-white p-3 rounded-md shadow-sm"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.1 + (index * 0.1) }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      {typeof strength === 'string' ? strength : JSON.stringify(strength)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
          
          {/* Enhanced Improvements section with cleaner, more structured feedback */}
                            <motion.div
            className="p-4 rounded-lg border border-amber-100 bg-amber-50"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Lightbulb className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-medium text-amber-800">Forbedringsforslag</h3>
                                    </div>
              
              <div className="text-sm text-amber-700">
                <span className="font-medium">{detailedImprovements.length}</span> forbedringspunkter
                                            </div>
                                          </div>
                                          
            {/* Detailed improvements */}
            <div className="space-y-6">
              {detailedImprovements.map((improvement, index) => (
                <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-amber-100">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-800">{improvement.category}</h4>
                      <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Punkt {index + 1}
                      </Badge>
                                              </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(`improvement-${index}`)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedSections[`improvement-${index}`] ? 'Skjul' : 'Vis'} forslag
                      <ArrowUp
                        className={`ml-1 h-4 w-4 transition-transform ${
                          expandedSections[`improvement-${index}`] ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                                              </div>
                  
                  <div className="mb-4 p-3 bg-red-50 rounded-md">
                    <div className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1 flex-shrink-0">❌</span>
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium mb-1">Forbedringspunkt:</p>
                        <p className="text-gray-600">{improvement.original}</p>
                                        </div>
                                        </div>
                                      </div>
                  
                  {improvement.context && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-start">
                        <span className="text-gray-500 mr-2 mt-1 flex-shrink-0">📝</span>
                        <div className="flex-1">
                          <p className="text-gray-700 font-medium mb-1">Kontekst:</p>
                          <p className="text-gray-600 italic">"{improvement.context}"</p>
                                        </div>
                                        </div>
                                      </div>
                                    )}
                                    
                  <AnimatePresence>
                    {expandedSections[`improvement-${index}`] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 mt-4">
                          {improvement.suggestions && improvement.suggestions.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-md">
                              <div className="flex items-start">
                                <span className="text-green-500 mr-2 mt-1 flex-shrink-0">✅</span>
                                <div className="flex-1">
                                  <p className="text-gray-700 font-medium mb-1">
                                    {improvement.suggestions[0].title}:
                                  </p>
                                  <p className="text-gray-600 mb-2">
                                    {improvement.suggestions[0].improved}
                                  </p>
                                  <div className="flex justify-between items-center mt-3">
                                    <p className="text-xs text-gray-500 italic">
                                      {improvement.suggestions[0].explanation}
                                    </p>
                                      <Button 
                                        size="sm"
                                      variant="outline"
                                      className="ml-2 flex-shrink-0"
                                      onClick={() => copyToClipboard(improvement.suggestions[0].improved)}
                                    >
                                      {copiedText === improvement.suggestions[0].improved ? (
                                        <CheckCheck className="h-4 w-4 mr-1" />
                                      ) : (
                                        <Copy className="h-4 w-4 mr-1" />
                                      )}
                                      {copiedText === improvement.suggestions[0].improved ? 'Kopieret' : 'Kopiér'}
                                      </Button>
                                    </div>
                                  </div>
                      </div>
                    </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                ))}
              </div>
          </motion.div>
          
          {/* Conclusion */}
          <motion.div 
            className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex items-center mb-2">
              <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-purple-800">Næste skridt</h3>
                </div>
            <p className="text-gray-700">
              Tak for din opgave! Du har gjort et godt stykke arbejde. 
              Fokuser på de foreslåede forbedringer, og din næste opgave vil blive endnu bedre. 
              Husk at du altid kan spørge, hvis du har brug for yderligere hjælp. 
              <span className="ml-1">💪✨</span>
            </p>
          </motion.div>
            </div>
          </Card>
    </div>
  );
};

// Generate high-quality concrete improvement suggestions for any context
const generateHighQualitySuggestions = (improvementType: string, context?: string): { title: string; improved: string; explanation: string; note?: string }[] => {
  const suggestions = [];
  const cleanContext = context ? cleanCitationText(context) : "";
  
  // Function to generate an improved version of a specific sentence
  const generateImprovedSentence = (originalSentence: string, subject: string): string => {
    if (!originalSentence) return "";
    
    // Clean up the sentence
    const cleanSentence = originalSentence.trim();
    
    // Identify common issues to improve
    const hasVagueness = /(?:nogle|mange|flere|diverse|forskellige|visse)/i.test(cleanSentence);
    const hasPassiveVoice = /(?:bliver|blev|er blevet|var blevet|være blevet)\s+\w+(?:et|t)/i.test(cleanSentence);
    const hasWeakVerbs = /(?:\ser\s|\svar\s|\shar\s|\shavde\s|\skan\s|\skunne\s)/i.test(cleanSentence);
    const hasRedundancy = /(?:faktisk|egentlig|i princippet|på en måde|så at sige|som sagt)/i.test(cleanSentence);
    const hasInformalLanguage = /(?:super|mega|vildt|rigtig|ret|meget|totalt|bare|jo|vel)/i.test(cleanSentence);
    const hasUnclearReference = /(?:dette|det|den|disse|de|dem)\s+(?:er|var|har|havde)/i.test(cleanSentence);
    const hasLongSentence = cleanSentence.length > 120;
    const hasShortSentence = cleanSentence.length < 40 && cleanSentence.length > 0;
    
    // Create an improved version based on the identified issues
    let improvedSentence = cleanSentence;
    
    // Replace vague terms with specific ones
    if (hasVagueness) {
      improvedSentence = improvedSentence
        .replace(/nogle/gi, "tre specifikt udvalgte")
        .replace(/mange/gi, "en betydelig andel (cirka 70%)")
        .replace(/flere/gi, "fem centrale")
        .replace(/diverse/gi, "forskellige veldefinerede")
        .replace(/forskellige/gi, "distinkte")
        .replace(/visse/gi, "bestemte centrale");
    }
    
    // Convert passive voice to active voice
    if (hasPassiveVoice) {
      // This is a simplified approach - a full implementation would need more complex parsing
      if (subject === "history") {
        improvedSentence = improvedSentence
          .replace(/blev undersøgt/gi, "historikere undersøgte")
          .replace(/er blevet analyseret/gi, "forskere har analyseret")
          .replace(/blev betragtet/gi, "samtidige kilder betragtede");
      } else if (subject === "literature") {
        improvedSentence = improvedSentence
          .replace(/bliver beskrevet/gi, "forfatteren beskriver")
          .replace(/er blevet fortolket/gi, "litteraturkritikere har fortolket")
          .replace(/blev skrevet/gi, "forfatteren skrev");
      } else if (subject === "science") {
        improvedSentence = improvedSentence
          .replace(/blev observeret/gi, "forskerne observerede")
          .replace(/er blevet påvist/gi, "eksperimentet påviste")
          .replace(/bliver målt/gi, "videnskabsfolk måler");
      } else {
        improvedSentence = improvedSentence
          .replace(/bliver/gi, "aktivt")
          .replace(/blev/gi, "aktivt")
          .replace(/er blevet/gi, "har aktivt")
          .replace(/var blevet/gi, "havde aktivt");
      }
    }
    
    // Strengthen weak verbs
    if (hasWeakVerbs) {
      improvedSentence = improvedSentence
        .replace(/\ser\s/gi, " demonstrerer ")
        .replace(/\svar\s/gi, " manifesterede sig som ")
        .replace(/\shar\s/gi, " besidder ")
        .replace(/\shavde\s/gi, " udviste ")
        .replace(/\skan\s/gi, " formår at ")
        .replace(/\skunne\s/gi, " formåede at ");
    }
    
    // Remove redundancies
    if (hasRedundancy) {
      improvedSentence = improvedSentence
        .replace(/faktisk/gi, "")
        .replace(/egentlig/gi, "")
        .replace(/i princippet/gi, "")
        .replace(/på en måde/gi, "")
        .replace(/så at sige/gi, "")
        .replace(/som sagt/gi, "")
        .trim().replace(/\s+/g, " ");
    }
    
    // Formalize language
    if (hasInformalLanguage) {
      improvedSentence = improvedSentence
        .replace(/super/gi, "exceptionelt")
        .replace(/mega/gi, "betydeligt")
        .replace(/vildt/gi, "bemærkelsesværdigt")
        .replace(/rigtig/gi, "særdeles")
        .replace(/ret/gi, "relativt")
        .replace(/meget/gi, "substantielt")
        .replace(/totalt/gi, "fuldstændigt")
        .replace(/bare/gi, "udelukkende")
        .replace(/jo/gi, "")
        .replace(/vel/gi, "")
        .trim().replace(/\s+/g, " ");
    }
    
    // Clarify references
    if (hasUnclearReference) {
      // This is a simplified approach - a full implementation would need more context
      if (subject === "history") {
        improvedSentence = improvedSentence
          .replace(/dette er/gi, "denne historiske begivenhed er")
          .replace(/det var/gi, "denne udvikling var")
          .replace(/den har/gi, "denne historiske periode har");
      } else if (subject === "literature") {
        improvedSentence = improvedSentence
          .replace(/dette er/gi, "dette litterære værk er")
          .replace(/det var/gi, "denne tekstpassage var")
          .replace(/den har/gi, "denne fortælling har");
      } else if (subject === "science") {
        improvedSentence = improvedSentence
          .replace(/dette er/gi, "dette fænomen er")
          .replace(/det var/gi, "dette eksperiment var")
          .replace(/den har/gi, "denne proces har");
      } else {
        improvedSentence = improvedSentence
          .replace(/dette er/gi, "dette specifikke emne er")
          .replace(/det var/gi, "det pågældende element var")
          .replace(/den har/gi, "den omtalte faktor har");
      }
    }
    
    // Split long sentences
    if (hasLongSentence) {
      // Find a natural breaking point
      const breakPoints = [", og ", "; ", ": ", ", men ", ", hvilket ", ", hvorved "];
      for (const point of breakPoints) {
        if (improvedSentence.includes(point)) {
          const parts = improvedSentence.split(point);
          if (parts.length >= 2) {
            const firstPart = parts[0];
            const secondPart = parts.slice(1).join(point);
            improvedSentence = `${firstPart}. ${secondPart.charAt(0).toUpperCase() + secondPart.slice(1)}`;
            break;
          }
        }
      }
    }
    
    // Expand short sentences
    if (hasShortSentence) {
      if (subject === "history") {
        improvedSentence += " Dette er særligt relevant i den historiske kontekst, hvor samtidige faktorer også spillede en afgørende rolle.";
      } else if (subject === "literature") {
        improvedSentence += " Denne litterære teknik bidrager til værkets overordnede tematiske udvikling og karakterernes psykologiske dybde.";
      } else if (subject === "science") {
        improvedSentence += " Dette fænomen kan forklares gennem etablerede videnskabelige principper og understøttes af empiriske observationer.";
      } else {
        improvedSentence += " Dette aspekt er centralt for en dybere forståelse af emnet og dets bredere implikationer.";
      }
    }
    
    // Add subject-specific academic language
    if (subject === "history") {
      improvedSentence = improvedSentence
        .replace(/folk/gi, "befolkningen")
        .replace(/ting/gi, "faktorer")
        .replace(/god/gi, "fordelagtig")
        .replace(/dårlig/gi, "problematisk");
    } else if (subject === "literature") {
      improvedSentence = improvedSentence
        .replace(/siger/gi, "udtrykker")
        .replace(/viser/gi, "illustrerer")
        .replace(/god/gi, "vellykket")
        .replace(/dårlig/gi, "mangelfuld");
    } else if (subject === "science") {
      improvedSentence = improvedSentence
        .replace(/ser/gi, "observerer")
        .replace(/tror/gi, "antager")
        .replace(/god/gi, "effektiv")
        .replace(/dårlig/gi, "ineffektiv");
    } else {
      improvedSentence = improvedSentence
        .replace(/ting/gi, "elementer")
        .replace(/god/gi, "hensigtsmæssig")
        .replace(/dårlig/gi, "uhensigtsmæssig");
    }
    
    // If no changes were made, make a generic improvement
    if (improvedSentence === cleanSentence) {
      if (subject === "history") {
        improvedSentence = `${cleanSentence} Denne historiske udvikling kan analyseres i lyset af samtidens politiske og økonomiske strukturer.`;
      } else if (subject === "literature") {
        improvedSentence = `${cleanSentence} Denne litterære passage illustrerer forfatterens stilistiske særpræg og tematiske intentioner.`;
      } else if (subject === "science") {
        improvedSentence = `${cleanSentence} Dette videnskabelige princip kan verificeres gennem systematisk empirisk observation og eksperimentel testning.`;
      } else {
        improvedSentence = `${cleanSentence} Denne faglige pointe kan uddybes gennem en mere nuanceret analyse af de underliggende faktorer.`;
      }
    }
    
    return improvedSentence;
  };
  
  // Generate explanation for the improvements
  const generateExplanation = (originalSentence: string, improvedSentence: string): string => {
    const explanations = [];
    
    // Compare original and improved to identify what changed
    if (improvedSentence.length > originalSentence.length * 1.2) {
      explanations.push("Uddybning af fagligt indhold");
    }
    
    if (improvedSentence.includes("specifik") || improvedSentence.includes("konkret")) {
      explanations.push("Øget præcision og specificitet");
    }
    
    if (/(?:demonstrerer|manifesterede|besidder|udviste|formår)/i.test(improvedSentence)) {
      explanations.push("Stærkere og mere præcise verber");
    }
    
    if (/(?:exceptionelt|betydeligt|bemærkelsesværdigt|særdeles)/i.test(improvedSentence)) {
      explanations.push("Mere formelt og akademisk sprog");
    }
    
    if (originalSentence.length > 120 && improvedSentence.includes(". ")) {
      explanations.push("Forbedret læsbarhed gennem opdeling af lange sætninger");
    }
    
    if (/(?:historiske|litterære|videnskabelige|faglige)/i.test(improvedSentence)) {
      explanations.push("Integration af fagspecifik terminologi");
    }
    
    // If no specific explanations were identified, provide a generic one
    if (explanations.length === 0) {
      explanations.push("Forbedret akademisk formulering og præcision");
    }
    
    return explanations.join(". ") + ".";
  };
  
  // Generate note about why the improvement is better
  const generateNote = (improvedSentence: string): string => {
    const notes = [
      "Dette demonstrerer en dybere faglig forståelse",
      "Dette viser akademisk modenhed og præcision",
      "Dette løfter det faglige niveau i din fremstilling",
      "Dette styrker din argumentation gennem præcision",
      "Dette viser beherskelse af akademisk sprogbrug",
      "Dette demonstrerer evnen til at kommunikere komplekse ideer klart",
      "Dette viser evnen til at nuancere faglige pointer",
      "Dette styrker din faglige troværdighed",
      "Dette viser evnen til at tænke kritisk og analytisk",
      "Dette demonstrerer en dybere forståelse af emnet",
      "Dette viser evnen til at se sammenhænge på tværs af fagområdet",
      "Dette styrker din akademiske stemme"
    ];
    
    // Select a note based on the improved sentence characteristics
    if (improvedSentence.includes("analyse") || improvedSentence.includes("analysere")) {
      return "Dette demonstrerer din evne til at tænke analytisk og se dybere sammenhænge.";
    } else if (improvedSentence.includes("nuanceret") || improvedSentence.includes("perspektiv")) {
      return "Dette viser din evne til at se emnet fra flere perspektiver og tænke kritisk.";
    } else if (improvedSentence.includes("specifik") || improvedSentence.includes("konkret")) {
      return "Dette viser din evne til at være præcis og konkret i din faglige kommunikation.";
    } else if (improvedSentence.length > 100) {
      return "Dette demonstrerer din evne til at udtrykke komplekse ideer på en sammenhængende måde.";
    } else {
      // Select a random note if no specific characteristics were identified
      return notes[Math.floor(Math.random() * notes.length)];
    }
  };
  
  // DETERMINE SUBJECT AREAS FROM CONTENT AND ASSIGNMENT INFO
  // Get assignment info and extract subject info
  const assignmentInfo = window.assignment || {};
  const assignmentSubject = assignmentInfo?.subject?.toLowerCase() || "";
  const assignmentContent = assignmentInfo?.content?.toLowerCase() || "";
  const assignmentTitle = assignmentInfo?.title?.toLowerCase() || "";
  const assignmentType = assignmentInfo?.assignmentType?.toLowerCase() || "";
  const contextLower = cleanContext.toLowerCase();
  
  // Detect math content with stronger checks and actual math keywords
  const isMathProblem = 
    (contextLower.includes('integral') && (contextLower.includes('dx') || contextLower.includes('∫'))) || 
    (contextLower.includes('derivative') && (contextLower.includes('d/dx') || contextLower.includes('f\''))) || 
    (contextLower.includes('math') && contextLower.includes('=')) ||
    (contextLower.includes('equation') && /\d/.test(contextLower)) ||
    (/\d[+\-*/^=]\d/.test(contextLower)) ||
    assignmentSubject.includes('math') ||
    assignmentSubject.includes('matematik') ||
    assignmentInfo?.questionData?.type === 'math';
  
  // History/social studies content
  const isHistoryAssignment = 
    assignmentSubject.includes('historie') ||
    assignmentSubject.includes('history') ||
    assignmentSubject.includes('samfundsfag') ||
    assignmentSubject.includes('social studies') ||
    assignmentTitle.includes('historie') ||
    assignmentTitle.includes('history') ||
    assignmentTitle.includes('samfundsfag') ||
    (contextLower.includes('krig') && !isMathProblem) || 
    (contextLower.includes('politik') && !isMathProblem) ||
    contextLower.includes('verdenskrig') ||
    contextLower.includes('revolution') ||
    contextLower.includes('samfund') ||
    contextLower.includes('jøder') ||
    contextLower.includes('holocaust') ||
    contextLower.includes('besættelse') ||
    (assignmentContent && (
      assignmentContent.includes('historie') ||
      assignmentContent.includes('krig') ||
      assignmentContent.includes('politik') ||
      assignmentContent.includes('samfund')
    ));
  
  // Literature/Danish content
  const isLiteratureAssignment = 
    assignmentSubject.includes('dansk') ||
    assignmentSubject.includes('litteratur') ||
    assignmentSubject.includes('english') ||
    assignmentSubject.includes('spanish') ||
    assignmentSubject.includes('french') ||
    assignmentSubject.includes('german') ||
    assignmentSubject.includes('language') ||
    assignmentType.includes('essay') ||
    assignmentType.includes('analyse') ||
    assignmentType.includes('interpretation') ||
    (contextLower.includes('forfatter') && !isMathProblem) || 
    (contextLower.includes('digt') && !isMathProblem) ||
    contextLower.includes('roman') ||
    contextLower.includes('novelle') ||
    contextLower.includes('litterær') ||
    contextLower.includes('tekst') ||
    contextLower.includes('fortælling') ||
    (assignmentContent && (
      assignmentContent.includes('litteratur') ||
      assignmentContent.includes('analyse') ||
      assignmentContent.includes('fortolkning')
    ));
  
  // Science content
  const isScienceAssignment = 
    assignmentSubject.includes('fysik') ||
    assignmentSubject.includes('physics') ||
    assignmentSubject.includes('kemi') ||
    assignmentSubject.includes('chemistry') ||
    assignmentSubject.includes('biologi') ||
    assignmentSubject.includes('biology') ||
    assignmentSubject.includes('natur') ||
    assignmentSubject.includes('science') ||
    (contextLower.includes('experiment') && !isMathProblem) ||
    (contextLower.includes('forsøg') && !isMathProblem) ||
    contextLower.includes('videnskab') ||
    contextLower.includes('reaktion') ||
    contextLower.includes('molekyl') ||
    contextLower.includes('atom') ||
    (assignmentContent && (
      assignmentContent.includes('forsøg') ||
      assignmentContent.includes('hypotese') ||
      assignmentContent.includes('videnskab')
    ));
  
  // If we have a specific context (sentence), generate an improvement for it
  if (cleanContext) {
    let subject = "general";
    if (isHistoryAssignment) subject = "history";
    else if (isLiteratureAssignment) subject = "literature";
    else if (isScienceAssignment) subject = "science";
    else if (isMathProblem) subject = "math";
    
    const improvedSentence = generateImprovedSentence(cleanContext, subject);
    const explanation = generateExplanation(cleanContext, improvedSentence);
    const note = generateNote(improvedSentence);
    
    // Determine an appropriate title based on the improvement type
    let title = "Forbedret akademisk formulering";
    
    if (explanation.includes("præcision")) {
      title = "Øget præcision og specificitet";
    } else if (explanation.includes("verber")) {
      title = "Stærkere sprogbrug";
    } else if (explanation.includes("formelt")) {
      title = "Mere akademisk sprog";
    } else if (explanation.includes("læsbarhed")) {
      title = "Forbedret sætningsstruktur";
    } else if (explanation.includes("terminologi")) {
      title = "Integration af fagterminologi";
    } else if (explanation.includes("indhold")) {
      title = "Uddybning af fagligt indhold";
    }
    
    suggestions.push({
      title,
      improved: improvedSentence,
      explanation,
      note
    });
    
    return suggestions;
  }
  
  // DETERMINE WHAT TYPE OF IMPROVEMENT IS NEEDED
  // Instead of generating 12 suggestions per improvement point, we'll generate one relevant suggestion
  // based on the detected subject and improvement type
  
  // Determine what type of improvement is needed
  const needsDeepAnalysis = 
    improvementType.includes('dybde') || 
    improvementType.includes('analyse') || 
    improvementType.includes('uddybning');
  
  const needsStructure = 
    improvementType.includes('struktur') || 
    improvementType.includes('opbygning') || 
    improvementType.includes('indledning') ||
    improvementType.includes('disposition') ||
    improvementType.includes('overgang');
  
  const needsAcademicLanguage = 
    improvementType.includes('sprog') || 
    improvementType.includes('formulering') || 
    improvementType.includes('akademisk');
  
  const needsCriticalThinking = 
    improvementType.includes('kritisk') || 
    improvementType.includes('nuancering') || 
    improvementType.includes('perspektiv');
  
  const needsConcretization = 
    improvementType.includes('konkret') || 
    improvementType.includes('eksempel') || 
    improvementType.includes('anvendelse');
  
  // Now generate relevant improvement suggestions based on subject and improvement type
  
  // HISTORY ASSIGNMENT IMPROVEMENTS
  if (isHistoryAssignment) {
    if (needsDeepAnalysis) {
      suggestions.push({
        title: 'Uddyb historisk analyse',
        improved: `${cleanContext ? cleanContext + '. ' : ''}Dette historiske forløb var resultatet af komplekse faktorer, herunder politiske spændinger, økonomiske interesser og sociale bevægelser. Særligt spillede [specifik faktor] en afgørende rolle, da den påvirkede både elitens beslutninger og befolkningens reaktioner.`,
        explanation: 'Dybere historisk analyse viser forståelse for historiske årsagssammenhænge.',
        note: 'Dette demonstrerer din evne til at se kompleksiteten i historiske begivenheder.'
      });
    }
    else if (needsStructure) {
      suggestions.push({
        title: 'Forbedre kronologisk struktur',
        improved: `For at styrke den analytiske struktur vil jeg opdele min undersøgelse af ${cleanContext ? cleanContext.toLowerCase() : 'dette historiske emne'} i tre faser: Først vil jeg analysere de forudgående faktorer, dernæst vil jeg undersøge selve begivenhedsforløbet, og afslutningsvis vil jeg diskutere de langsigtede konsekvenser.`,
        explanation: 'En klar kronologisk struktur skaber overblik i historiske analyser.',
        note: 'Dette skaber en logisk progression i din historiske argumentation.'
      });
    }
    else if (needsAcademicLanguage) {
      suggestions.push({
        title: 'Anvend historiske fagbegreber',
        improved: `${cleanContext ? cleanContext.replace(/krig|konflikt/gi, 'militær konflikt').replace(/politik|politisk/gi, 'politiske magtrelationer') : 'De politiske magtrelationer i perioden var karakteriseret af ideologiske modsætninger.'} Dette afspejlede tidens hegemoniske strukturer og geopolitiske spændinger.`,
        explanation: 'Fagterminologi demonstrerer din beherskelse af historiske begreber.',
        note: 'Dette løfter det faglige niveau i din historiske analyse.'
      });
    }
    else if (needsCriticalThinking) {
      suggestions.push({
        title: 'Nuancér historisk fortolkning',
        improved: `${cleanContext ? cleanContext + '. ' : ''}Denne fortolkning kan dog problematiseres, da nyere forskning har fremhævet alternative perspektiver. Historikere som [relevante historikere] har argumenteret for, at økonomiske faktorer spillede en større rolle end tidligere antaget, mens [andre historikere] har fremhævet sociale bevægelsers betydning.`,
        explanation: 'Nuancering af historiske fortolkninger viser akademisk modenhed.',
        note: 'Dette demonstrerer din evne til at forholde dig kritisk til historiske kilder og narrativer.'
      });
    }
    else if (needsConcretization) {
      suggestions.push({
        title: 'Inddrag konkrete historiske eksempler',
        improved: `${cleanContext ? cleanContext + '. ' : ''}Dette kan konkret illustreres med [specifikt historisk eksempel], hvor [relevante aktører] handlede på en måde, der tydeliggør [relevant historisk pointe]. Dette eksempel viser, hvordan abstrakte historiske processer manifesterede sig i konkrete begivenheder.`,
        explanation: 'Konkrete historiske eksempler styrker din argumentation.',
        note: 'Dette demonstrerer din evne til at forbinde teori med historisk empiri.'
      });
    }
    else {
      suggestions.push({
        title: 'Styrk historisk argumentation',
        improved: `${cleanContext ? cleanContext + '. ' : ''}Denne historiske udvikling kan forklares gennem en analyse af samspillet mellem politiske motiver, økonomiske interesser og ideologiske overbevisninger. Særligt afgørende var [specifik faktor], som påvirkede begivenhedernes forløb afgørende.`,
        explanation: 'Stærk historisk argumentation demonstrerer din analytiske evner.',
        note: 'Dette viser din evne til at tænke historisk og se sammenhænge på tværs af tid og rum.'
      });
    }
  }
  
  // ... existing code for other subject types ...
  
  // If no suggestions have been added yet (which shouldn't happen with our improved logic),
  // add a general academic improvement suggestion as fallback
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Styrk faglig fremstilling',
      improved: `${cleanContext ? cleanContext + '. ' : ''}For at styrke denne faglige fremstilling vil jeg uddybe min analyse, anvende relevant fagterminologi, underbygge mine påstande med konkrete eksempler, og forholde mig kritisk til de teorier og metoder, jeg anvender.`,
      explanation: 'En stærk faglig fremstilling kombinerer dybde, præcision og kritisk refleksion.',
      note: 'Dette demonstrerer din akademiske modenhed og selvstændige tænkning.'
    });
  }
  
  return suggestions;
};

export default EvaluationResult;
