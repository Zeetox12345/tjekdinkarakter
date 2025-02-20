
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface EvaluationResultProps {
  evaluation: {
    grade: string;
    reasoning: string;
    improvements: string[];
    strengths: string[];
  };
  isPremium?: boolean;
}

const EvaluationResult = ({ evaluation, isPremium = false }: EvaluationResultProps) => {
  const numericGrade = parseInt(evaluation.grade);
  const potentialGrade = Math.min(10, numericGrade + 3); // Cap at 10
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 space-y-6">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-primary">Karakter: {evaluation.grade}</h3>
          {!isPremium && numericGrade < 10 && (
            <p className="text-primary mt-2 font-medium">
              Opgrader til Premium og lær hvordan du kan forbedre din opgave til et {potentialGrade}tal!
            </p>
          )}
          <p className="text-gray-600 mt-2">{evaluation.reasoning}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xl font-semibold mb-4 text-green-600">Styrker</h4>
            <div className="relative">
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
              {!isPremium && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
                  <Button className="relative z-10" variant="outline">
                    <Lock className="mr-2 h-4 w-4" />
                    Se styrker med Premium
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-semibold mb-4 text-blue-600">
              Forbedringsmuligheder
            </h4>
            <div className="relative">
              <ul className="space-y-2">
                {evaluation.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">→</span>
                    {improvement}
                  </li>
                ))}
              </ul>
              {!isPremium && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
                  <Button className="relative z-10" variant="outline">
                    <Lock className="mr-2 h-4 w-4" />
                    Se forbedringsmuligheder med Premium
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isPremium && (
          <div className="mt-6 text-center">
            <Button className="w-full sm:w-auto" variant="default">
              <Lock className="mr-2 h-4 w-4" />
              Opgrader til Premium - 79 kr./måned
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Få adgang til detaljeret feedback og lær hvordan du kan forbedre din karakter
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default EvaluationResult;
