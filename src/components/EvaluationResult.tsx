
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 space-y-6">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-primary">Karakter: {evaluation.grade}</h3>
          <p className="text-gray-600 mt-2">{evaluation.reasoning}</p>
        </div>

        <div className="relative">
          {!isPremium && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
              <div className="text-center p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Opgrader til Premium for at se den detaljerede feedback
                </p>
                <Button className="w-full" variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  Opgrader til Premium - 79 kr./måned
                </Button>
              </div>
            </div>
          )}
          
          <div className={!isPremium ? "filter blur-sm" : ""}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xl font-semibold mb-4 text-green-600">Styrker</h4>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-4 text-blue-600">
                  Forbedringsmuligheder
                </h4>
                <ul className="space-y-2">
                  {evaluation.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default EvaluationResult;
