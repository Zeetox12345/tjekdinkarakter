import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Star, TrendingUp, CheckCircle2, AlertCircle, BookOpen, Layout, MessageSquare, Brain, Lightbulb, LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface EvaluationResultProps {
  evaluation: {
    grade: string;
    reasoning: string;
    improvements: string[];
    strengths: string[];
  };
  isPremium?: boolean;
}

interface FeedbackCategory {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const gradeColors: Record<string, { bg: string; text: string }> = {
  "12": { bg: "bg-green-500", text: "text-green-500" },
  "10": { bg: "bg-emerald-500", text: "text-emerald-500" },
  "7": { bg: "bg-blue-500", text: "text-blue-500" },
  "4": { bg: "bg-yellow-500", text: "text-yellow-500" },
  "02": { bg: "bg-orange-500", text: "text-orange-500" },
  "00": { bg: "bg-red-500", text: "text-red-500" },
  "-3": { bg: "bg-red-700", text: "text-red-700" },
};

const feedbackCategories: Record<string, FeedbackCategory> = {
  "Fagligt indhold": {
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  "Struktur": {
    icon: Layout,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  "Sprog": {
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  "Kritisk tænkning": {
    icon: Brain,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  "Praktisk anvendelse": {
    icon: Lightbulb,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
};

const EvaluationResult = ({ evaluation, isPremium = false }: EvaluationResultProps) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const gradeColor = gradeColors[evaluation.grade] || { bg: "bg-gray-500", text: "text-gray-500" };

  const renderStrengthItem = (strength: string, category: string) => {
    const categoryConfig = feedbackCategories[category];
    return (
      <div className={cn(
        "flex items-start space-x-2 p-3 rounded-lg",
        categoryConfig?.bgColor || "bg-gray-50"
      )}>
        <span className={cn(
          "shrink-0 mt-1",
          categoryConfig?.color || "text-gray-500"
        )}>✓</span>
        <span className="text-gray-800">{strength.replace(`${category}: `, '')}</span>
      </div>
    );
  };

  const renderImprovementItem = (improvementText: string, category: string, index: number) => {
    const id = `improvement-${category}-${index}`;
    const isOpen = openItems[id];
    const categoryConfig = feedbackCategories[category];
    
    // Remove category prefix and clean the text
    const description = improvementText.replace(`${category}: `, '').trim();
    
    // Generate examples based on the improvement type
    const generateExample = (desc: string, category: string): {
      citation: string;
      improvement: string;
      explanation: string;
    } => {
      const examples = {
        "Fagligt indhold": {
          citation: "I denne periode var der modstand mod jøderne i Danmark",
          improvement: "Under mellemkrigstiden observerede man en stigende antisemitisk tendens i det danske samfund, særligt blandt konservative kredse og i DNSAP's propaganda",
          explanation: "Ved at bruge præcise fagbegreber og historiske referencer styrkes den faglige dybde og akademiske kvalitet af analysen."
        },
        "Struktur": {
          citation: "Nu vil jeg gå videre til at snakke om...",
          improvement: "Denne udvikling i antisemitismen skal ses i sammenhæng med den generelle politiske radikalisering i 1930'erne, hvor...",
          explanation: "En stærkere overgang skaber bedre sammenhæng mellem afsnittene og tydeliggør den røde tråd i argumentationen."
        },
        "Sprog": {
          citation: "Det var ret slemt hvordan de behandlede jøderne",
          improvement: "Den systematiske diskrimination og forfølgelse af den jødiske befolkning vidner om antisemitismens alvorlige konsekvenser",
          explanation: "Et mere præcist og akademisk sprog styrker tekstens troværdighed og formidler pointerne mere effektivt."
        },
        "Kritisk tænkning": {
          citation: "Alle danskere var imod antisemitismen",
          improvement: "Mens mange danskere aktivt modsatte sig antisemitismen, var der også grupper i samfundet, særligt inden for DNSAP, der sympatiserede med de antisemitiske strømninger",
          explanation: "Ved at belyse forskellige perspektiver og nuancer demonstreres en dybere forståelse af periodens kompleksitet."
        },
        "Praktisk anvendelse": {
          citation: "Dette er stadig relevant i dag",
          improvement: "Erfaringerne fra mellemkrigstidens antisemitisme er højaktuelle i dagens debat om minoriteters rettigheder og samfundets ansvar, eksempelvis i diskussionen om...",
          explanation: "Konkrete nutidige eksempler gør analysen mere relevant og viser forståelse for historiens betydning for samtiden."
        }
      };

      // Get the default example for the category
      const defaultExample = examples[category as keyof typeof examples] || examples["Fagligt indhold"];
      
      // Customize the example based on the actual description
      return {
        citation: defaultExample.citation,
        improvement: defaultExample.improvement,
        explanation: `${defaultExample.explanation} ${desc}`
      };
    };

    const example = generateExample(description, category);
    
    return (
      <Collapsible
        key={index}
        open={isOpen}
        onOpenChange={() => toggleItem(id)}
        className={cn(
          "rounded-lg overflow-hidden transition-all",
          categoryConfig?.bgColor || "bg-gray-50"
        )}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start space-x-2 p-3">
            <span className={cn(
              "shrink-0 mt-1",
              categoryConfig?.color || "text-gray-500"
            )}>→</span>
            <span className="text-gray-800 text-left flex-grow">{description}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isOpen ? "transform rotate-180" : ""
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-8 pb-3 space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Eksempel fra din tekst:</div>
              <div className="text-sm bg-white/50 rounded-md p-3 italic text-gray-600">
                "{example.citation}"
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Sådan kunne det formuleres bedre:</div>
              <div className="text-sm bg-primary/5 rounded-md p-3 text-primary font-medium">
                "{example.improvement}"
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Hvorfor det forbedrer opgaven:</div>
              <div className="text-sm text-gray-600">
                {example.explanation}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const categorizedFeedback = (items: string[], type: "strengths" | "improvements") => {
    const categorized = Object.keys(feedbackCategories).reduce((acc, category) => {
      acc[category] = items.filter(item => item.startsWith(category + ":"));
      return acc;
    }, {} as Record<string, string[]>);

    const uncategorized = items.filter(item => 
      !Object.keys(feedbackCategories).some(category => item.startsWith(category + ":"))
    );

    if (uncategorized.length > 0) {
      categorized["Andre punkter"] = uncategorized;
    }

    return categorized;
  };

  const categorizedStrengths = categorizedFeedback(evaluation.strengths, "strengths");
  const categorizedImprovements = categorizedFeedback(evaluation.improvements, "improvements");

  const renderCategoryIcon = (category: string) => {
    const categoryConfig = feedbackCategories[category];
    if (!categoryConfig) return null;
    
    const Icon = categoryConfig.icon;
    return <Icon className={cn("w-5 h-5", categoryConfig.color)} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Grade Display */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="relative"
      >
        <div className="absolute inset-0 blur-3xl opacity-20" style={{ background: `var(--${gradeColor.bg})` }} />
        <Card className="p-8 backdrop-blur-sm bg-white/90 border-2 relative overflow-hidden">
          <div className={cn("absolute top-0 left-0 w-full h-1.5", gradeColor.bg)} />
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
              className="inline-flex items-center justify-center"
            >
              <span className={cn("text-6xl font-bold", gradeColor.text)}>
                {evaluation.grade}
              </span>
              <Star className={cn("w-8 h-8 ml-2", gradeColor.text)} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed"
            >
              {evaluation.reasoning}
            </motion.p>
          </div>
        </Card>
      </motion.div>

      {/* Feedback Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Section */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="h-full">
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <h4 className="text-xl font-semibold text-green-600">Styrker</h4>
              </div>
              <div className="relative">
                <div className="space-y-6">
                  {Object.entries(categorizedStrengths).map(([category, items], categoryIndex) => (
                    <motion.div
                      key={category}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + categoryIndex * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        {renderCategoryIcon(category)}
                        <h5 className="font-semibold text-gray-700">{category}</h5>
                      </div>
                      <motion.div className="space-y-3">
                        {items.map((strength, index) => renderStrengthItem(strength, category))}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                {!isPremium && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
                    <Button className="relative z-10" variant="outline">
                      <Lock className="mr-2 h-4 w-4" />
                      Se styrker med Premium
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Improvements Section */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="h-full">
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                <h4 className="text-xl font-semibold text-blue-600">
                  Forbedringsmuligheder
                </h4>
              </div>
              <div className="relative">
                {/* Summary bullet points */}
                <div className="mb-6 bg-blue-50/50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-600 mb-3">Dine næste skridt:</h5>
                  <ul className="space-y-2">
                    {Object.entries(categorizedImprovements).slice(0, 5).map(([category, items], index) => {
                      if (!items[0]) return null;
                      
                      // Extract the improvement suggestion from the text
                      const text = items[0];
                      const citationMatch = text.match(/\[CITAT:.*?\]/);
                      const improvementMatch = text.match(/OMSKRIV TIL: "(.*?)"/);
                      
                      // Create action-oriented text based on the category
                      const getActionText = (category: string, description: string, fullText: string) => {
                        // For fagligt indhold, extract the suggested terms from OMSKRIV TIL
                        if (category === "Fagligt indhold") {
                          const omskrivMatch = fullText.match(/OMSKRIV TIL: "(.*?)"/);
                          if (omskrivMatch && omskrivMatch[1]) {
                            const forbedring = fullText.match(/FORBEDRING: (.*?)(?:\[|$)/);
                            const forbedringText = forbedring ? forbedring[1].trim() : '';
                            return `Styrk din faglige argumentation: Brug disse fagbegreber i din tekst: "${omskrivMatch[1]}". ${forbedringText}`;
                          }
                        }
                        
                        const actionMap: Record<string, string> = {
                          "Fagligt indhold": "Styrk din faglige argumentation: Definer og forklar de centrale begreber, og brug dem aktivt i din analyse",
                          "Struktur": "Forbedre strukturen: Start hvert afsnit med en klar hovedpointe, og brug overgangsord som 'derfor', 'desuden' og 'imidlertid'",
                          "Sprog": "Løft sproget: Erstat hverdagsudtryk med akademiske formuleringer. F.eks. 'dette medfører' i stedet for 'det gør at'",
                          "Kritisk tænkning": "Nuancér analysen: Præsentér både fordele og ulemper ved dine argumenter. Brug 'på den ene side... på den anden side'",
                          "Praktisk anvendelse": "Konkretisér: Giv specifikke eksempler fra praksis, og forklar hvordan teorien kan anvendes i virkeligheden"
                        };
                        
                        return actionMap[category] || "Forbedre dette punkt";
                      };
                      
                      // Get the base description without category prefix
                      const baseDescription = text.split('[CITAT:')[0].replace(`${category}: `, '');
                      
                      return (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1 shrink-0">→</span>
                          <span className="text-gray-700">{getActionText(category, baseDescription, text)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="space-y-6">
                  {Object.entries(categorizedImprovements).map(([category, items], categoryIndex) => (
                    <motion.div
                      key={category}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + categoryIndex * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        {renderCategoryIcon(category)}
                        <h5 className="font-semibold text-gray-700">{category}</h5>
                      </div>
                      <motion.div className="space-y-3">
                        {items.map((improvement, index) => renderImprovementItem(improvement, category, index))}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                {!isPremium && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
                    <Button className="relative z-10" variant="outline">
                      <Lock className="mr-2 h-4 w-4" />
                      Se forbedringsmuligheder med Premium
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {!isPremium && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <Button className="w-full sm:w-auto" variant="default">
            <Lock className="mr-2 h-4 w-4" />
            Opgrader til Premium - 79 kr./måned
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EvaluationResult;
