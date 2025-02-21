
import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import EvaluationResult from "@/components/EvaluationResult";
import { Progress } from "@/components/ui/progress";
import { evaluateAssignment } from "@/functions/evaluate-assignment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { AccuracyStats } from "@/components/AccuracyStats";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedHeader } from "@/components/home/AnimatedHeader";
import { UploadSections } from "@/components/home/UploadSections";
import { AuthPremiumDialogs } from "@/components/home/AuthPremiumDialogs";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [assignmentText, setAssignmentText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [instructionsFile, setInstructionsFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const { toast } = useToast();

  const checkDailyUsage = async () => {
    try {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('daily_evaluation_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (error) throw error;
      const count = data?.count || 0;
      setDailyUsage(count);
      return count;
    } catch (error) {
      console.error('Error checking daily usage:', error);
      return 0;
    }
  };

  const handleEvaluateClick = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (!assignmentText && !assignmentFile) {
      toast({
        title: "Ingen opgave at vurdere",
        description: "Du skal enten uploade en fil eller indtaste opgavetekst",
        variant: "destructive"
      });
      return;
    }

    // Check daily usage before starting evaluation
    const currentUsage = await checkDailyUsage();

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!roleData;

    if (!isAdmin && currentUsage >= 5) {
      toast({
        title: "Daglig grænse nået",
        description: "Du har nået din daglige grænse på 5 evalueringer.",
        variant: "destructive"
      });
      setShowPremiumDialog(true);
      return;
    }

    // Only start loading and evaluation if we haven't hit the limit
    handleEvaluate();
  };

  const handleEvaluate = async () => {
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
      await checkDailyUsage(); // Update usage count after successful evaluation
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <AnimatedHeader onEvaluateClick={handleEvaluateClick} isLoading={isLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <section className="mb-6">
          <AccuracyStats />
        </section>

        <AuthPremiumDialogs
          showAuthDialog={showAuthDialog}
          showPremiumDialog={showPremiumDialog}
          setShowAuthDialog={setShowAuthDialog}
          setShowPremiumDialog={setShowPremiumDialog}
        />

        {isLoading && (
          <div className="max-w-xl mx-auto mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analyserer din opgave...</h3>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-gray-600 text-center">
                Vores AI gennemgår din opgave grundigt
              </p>
            </Card>
          </div>
        )}

        {evaluation && !isLoading && (
          <div className="max-w-4xl mx-auto mb-8">
            <EvaluationResult evaluation={evaluation} isPremium={false} />
          </div>
        )}

        <div className="max-w-7xl mx-auto mb-16">
          <UploadSections
            instructionsFile={instructionsFile}
            assignmentFile={assignmentFile}
            instructionsText={instructionsText}
            assignmentText={assignmentText}
            onInstructionsFileChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setInstructionsFile(e.target.files[0]);
              }
            }}
            onAssignmentFileChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAssignmentFile(e.target.files[0]);
              }
            }}
            onInstructionsTextChange={(e) => setInstructionsText(e.target.value)}
            onAssignmentTextChange={(e) => setAssignmentText(e.target.value)}
            onDrop={handleDrop}
          />
        </div>

        <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Om os</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Kontakt
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Juridisk</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Privatlivspolitik
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Vilkår & betingelser
                    </Link>
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
    </div>
  );
};

export default Index;
