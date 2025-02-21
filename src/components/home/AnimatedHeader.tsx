import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface AnimatedHeaderProps {
  onEvaluateClick: () => void;
  isLoading: boolean;
}

export const AnimatedHeader = ({ onEvaluateClick, isLoading }: AnimatedHeaderProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const headerTexts = [
    "Få øjeblikkelig indsigt i din karakter med Danmarks førende AI-karakterestimator",
    "Optimer din opgave med præcis feedback fra vores avancerede AI-system",
    "Få professionel bedømmelse af din opgave på få sekunder",
    "Forbedr din akademiske præstation med detaljeret karakteranalyse",
    "Få personlig vejledning til at løfte din karakter til næste niveau"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === headerTexts.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-white/50">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.h1 
            className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight text-glow mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Din AI-Drevne Karakterguide
          </motion.h1>
          <div className="h-20">
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentTextIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-2 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
              >
                {headerTexts[currentTextIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <motion.div 
            className="flex justify-center mb-8"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button 
              size="lg" 
              className="btn-epic text-white px-8 py-6 text-lg rounded-lg"
              onClick={onEvaluateClick}
              disabled={isLoading}
            >
              <Zap className="mr-2 h-5 w-5 animate-pulse" />
              {isLoading ? "Vurderer..." : "Få øjeblikkelig vurdering"}
            </Button>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            <motion.div 
              className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-lg card-glow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Brain className="h-6 w-6 text-primary animate-float" />
              <span className="text-sm font-medium text-gray-700">AI-drevet analyse</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-lg card-glow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Target className="h-6 w-6 text-primary animate-float" />
              <span className="text-sm font-medium text-gray-700">98% nøjagtighed</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-lg card-glow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Zap className="h-6 w-6 text-primary animate-float" />
              <span className="text-sm font-medium text-gray-700">Svar på sekunder</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
