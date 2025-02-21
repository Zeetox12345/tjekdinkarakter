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
    <header className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent">
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
              className="flex items-center gap-4 bg-white/10 backdrop-blur-[2px] p-4 rounded-2xl group cursor-default"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Brain className="h-6 w-6 text-primary relative animate-pulse-slow group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-600 group-hover:to-primary/80 transition-all duration-300">
                AI-drevet analyse
              </span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-4 bg-white/10 backdrop-blur-[2px] p-4 rounded-2xl group cursor-default"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Target className="h-6 w-6 text-primary relative group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-600 group-hover:to-primary/80 transition-all duration-300">
                98% nøjagtighed
              </span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-4 bg-white/10 backdrop-blur-[2px] p-4 rounded-2xl group cursor-default"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Zap className="h-6 w-6 text-primary relative group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-600 group-hover:to-primary/80 transition-all duration-300">
                Svar på sekunder
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
