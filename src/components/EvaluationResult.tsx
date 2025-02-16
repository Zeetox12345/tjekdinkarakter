
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface EvaluationResultProps {
  evaluation: {
    grade: string;
    reasoning: string;
    improvements: string[];
    strengths: string[];
  };
}

const EvaluationResult = ({ evaluation }: EvaluationResultProps) => {
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
            <h4 className="text-xl font-semibold mb-4 text-blue-600">Forbedringsmuligheder</h4>
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
      </Card>
    </motion.div>
  );
};

export default EvaluationResult;
