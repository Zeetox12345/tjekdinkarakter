import { Upload, AlertCircle, Star, FileText, LockIcon, Zap, Brain, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import EvaluationResult from "@/components/EvaluationResult";
import { Progress } from "@/components/ui/progress";
import { evaluateAssignment } from "@/functions/evaluate-assignment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { AccuracyStats } from "@/components/AccuracyStats";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [assignmentText, setAssignmentText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [instructionsFile, setInstructionsFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const {
    toast
  } = useToast();

  const handleAssignmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssignmentFile(e.target.files[0]);
    }
  };

  const handleInstructionsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInstructionsFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'instructions' | 'assignment') => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'instructions') {
        setInstructionsFile(file);
      } else {
        setAssignmentFile(file);
      }
    }
  };

  const handleEvaluateClick = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    handleEvaluate();
  };

  const handleEvaluate = async () => {
    if (!assignmentText && !assignmentFile) {
      toast({
        title: "Ingen opgave at vurdere",
        description: "Du skal enten uploade en fil eller indtaste opgavetekst",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 1000);
    try {
      const result = await evaluateAssignment(assignmentFile, assignmentText, instructionsFile, instructionsText);
      setEvaluation(result);
      setProgress(100);
    } catch (error) {
      toast({
        title: "Fejl ved vurdering",
        description: "Der opstod en fejl under vurderingen af din opgave. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <header className="w-full py-12 px-4 sm:px-6 lg:px-8 hero-gradient">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              Din AI-Drevne Karakterguide
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto">
              Få øjeblikkelig indsigt i din karakter med Danmarks førende AI-karakterestimator
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto mt-8"
          >
            <div className="flex items-center justify-center mb-8">
              <motion.span 
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Brugt af over 10.000 studerende
              </motion.span>
            </div>
            
            <div className="flex justify-center mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button 
                  size="lg" 
                  className="btn-epic text-white px-8 py-6 text-lg rounded-lg pulse-glow"
                  onClick={handleEvaluateClick}
                  disabled={isLoading}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  {isLoading ? "Vurderer..." : "Få øjeblikkelig vurdering"}
                </Button>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <motion.div 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                <Brain className="h-5 w-5 text-white animate-float" />
                <span className="text-sm text-white">AI-drevet analyse</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
              >
                <Target className="h-5 w-5 text-white animate-float" />
                <span className="text-sm text-white">98% nøjagtighed</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="h-5 w-5 text-white animate-float" />
                <span className="text-sm text-white">Svar på sekunder</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <AccuracyStats />
        </section>

        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log ind for at fortsætte</DialogTitle>
              <DialogDescription>
                For at få din opgave vurderet skal du oprette en konto eller logge ind.
              </DialogDescription>
            </DialogHeader>
            <motion.div initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-4 pt-4">
              <div className="rounded-full bg-primary/10 p-4">
                <LockIcon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Ved at oprette en konto kan du:
                <br />• Få detaljerede opgavevurderinger
                <br />• Gemme dine tidligere vurderinger
                <br />• Følge din progression over tid
              </p>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setShowAuthDialog(false);
                  navigate("/auth");
                }}>
                  Log ind
                </Button>
                <Button className="flex-1 btn-epic" onClick={() => {
                  setShowAuthDialog(false);
                  navigate("/auth");
                }}>
                  Opret konto
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {isLoading && <div className="max-w-xl mx-auto mb-8">
            <Card className="p-6 card-glow">
              <h3 className="text-lg font-semibold mb-4">Analyserer din opgave...</h3>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-gray-600 text-center">
                Vores AI gennemgår din opgave grundigt
              </p>
            </Card>
          </div>}

        {evaluation && !isLoading && <div className="max-w-4xl mx-auto mb-8">
            <EvaluationResult evaluation={evaluation} />
          </div>}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto mb-16"
        >
          <Card className="p-6 bg-white/50 backdrop-blur-sm card-glow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Opgavebeskrivelse</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Upload opgavebeskrivelsen</label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                      ${instructionsFile ? 'border-primary' : 'border-gray-300'}
                      hover:border-primary cursor-pointer`} onDragOver={handleDragOver} onDrop={e => handleDrop(e, 'instructions')}>
                    <input type="file" accept=".doc,.docx,.pdf" onChange={handleInstructionsFileChange} className="hidden" id="instructions-upload" />
                    <label htmlFor="instructions-upload" className="cursor-pointer flex flex-col items-center">
                      <FileText className="w-12 h-12 text-primary mb-2" />
                      <span className="text-sm text-gray-600">
                        Træk filen hertil eller klik for at uploade (.doc, .docx, .pdf)
                      </span>
                      {instructionsFile && <span className="mt-2 text-sm text-primary">{instructionsFile.name}</span>}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Eller indsæt opgavebeskrivelsen direkte
                  </label>
                  <Textarea placeholder="Indsæt opgavebeskrivelsen her..." value={instructionsText} onChange={e => setInstructionsText(e.target.value)} className="min-h-[400px]" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Din Opgave</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Upload din opgave</label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                      ${assignmentFile ? 'border-primary' : 'border-gray-300'}
                      hover:border-primary cursor-pointer`} onDragOver={handleDragOver} onDrop={e => handleDrop(e, 'assignment')}>
                    <input type="file" accept=".doc,.docx,.pdf" onChange={handleAssignmentFileChange} className="hidden" id="assignment-upload" />
                    <label htmlFor="assignment-upload" className="cursor-pointer flex flex-col items-center">
                      <FileText className="w-12 h-12 text-primary mb-2" />
                      <span className="text-sm text-gray-600">
                        Træk filen hertil eller klik for at uploade (.doc, .docx, .pdf)
                      </span>
                      {assignmentFile && <span className="mt-2 text-sm text-primary">{assignmentFile.name}</span>}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Eller indsæt din opgavetekst direkte
                  </label>
                  <Textarea placeholder="Indsæt din opgavetekst her..." value={assignmentText} onChange={e => setAssignmentText(e.target.value)} className="min-h-[400px]" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow h-full card-glow">
              <Brain className="w-12 h-12 text-primary mb-4 animate-float" />
              <h3 className="text-xl font-semibold mb-2">Avanceret AI-analyse</h3>
              <p className="text-gray-600">
                Vores AI analyserer din opgave på sekunder og giver dig præcis feedback
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow h-full card-glow">
              <Target className="w-12 h-12 text-primary mb-4 animate-float" />
              <h3 className="text-xl font-semibold mb-2">Præcis vurdering</h3>
              <p className="text-gray-600">
                Få en detaljeret analyse af dine styrker og forbedringsmuligheder
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow h-full card-glow">
              <Zap className="w-12 h-12 text-primary mb-4 animate-float" />
              <h3 className="text-xl font-semibold mb-2">Lynhurtig feedback</h3>
              <p className="text-gray-600">
                Ingen ventetid - få din karaktervurdering med det samme
              </p>
            </Card>
          </motion.div>
        </div>

        <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Om os</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Kontakt
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Juridisk</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Privatlivspolitik
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Vilkår & betingelser
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-500">
                © {new Date().getFullYear()} TjekDinKarakter.dk. Alle rettigheder forbeholdes.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>;
};

export default Index;
