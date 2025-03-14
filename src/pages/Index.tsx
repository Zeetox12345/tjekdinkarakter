import { FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
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
  const [anonymousUsage, setAnonymousUsage] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const loadingMessages = [
    "Analyserer din opgave grundigt...",
    "Gennemgår argumentationsstruktur...",
    "Evaluerer fagligt indhold...",
    "Vurderer sproglig kvalitet...",
    "Sammenligner med karakterskala...",
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const checkUsage = async () => {
    try {
      if (user?.id) {
        // Check authenticated user usage
        const { data, error } = await supabase
          .from('daily_evaluation_usage')
          .select('count')
          .eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .single();

        if (error) throw error;
        setDailyUsage(data?.count || 0);
      } else {
        // For anonymous users, use local storage in development
        if (window.location.hostname === 'localhost') {
          const today = new Date().toISOString().split('T')[0];
          const localStorageKey = `anonymous_usage_${today}`;
          const storedUsage = localStorage.getItem(localStorageKey);
          setAnonymousUsage(storedUsage ? parseInt(storedUsage, 10) : 0);
        } else {
          // Production environment - use Supabase
          const { data: { session } } = await supabase.auth.getSession();
          const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
          const { data: ipData } = await supabase.functions.invoke('get-client-ip', { headers });
          const clientIp = ipData?.ip;

          if (clientIp) {
            const { data, error } = await supabase
              .from('anonymous_evaluation_usage')
              .select('count')
              .eq('ip_address', clientIp)
              .eq('date', new Date().toISOString().split('T')[0])
              .single();

            if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
              throw error;
            }
            setAnonymousUsage(data?.count || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    }
  };

  // Function to increment anonymous usage in local storage
  const incrementLocalAnonymousUsage = () => {
    if (window.location.hostname === 'localhost') {
      const today = new Date().toISOString().split('T')[0];
      const localStorageKey = `anonymous_usage_${today}`;
      const currentUsage = localStorage.getItem(localStorageKey);
      const newUsage = (currentUsage ? parseInt(currentUsage, 10) : 0) + 1;
      localStorage.setItem(localStorageKey, newUsage.toString());
      setAnonymousUsage(newUsage);
    }
  };

  // Add function to check admin status
  const checkAdminStatus = async () => {
    if (user?.id) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      }
    }
  };

  useEffect(() => {
    checkAdminStatus();
    checkUsage();
  }, [user]);

  const handleEvaluateClick = async () => {
    // First check if there's any content to evaluate
    if (!assignmentText && !assignmentFile) {
      toast({
        title: "Ingen opgave at vurdere",
        description: "Du skal enten uploade en fil eller indtaste opgavetekst",
        variant: "destructive"
      });
      return;
    }

    // Check usage limits for both anonymous and authenticated users
    await checkUsage();

    if (!user) {
      // Handle anonymous user
      if (anonymousUsage >= 5) {
        // Show auth dialog only if anonymous user has no prompts left
        setShowAuthDialog(true);
        return;
      }
      // If they have prompts left, continue to evaluation
      handleEvaluate();
      return;
    }

    // Handle authenticated user
    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!roleData;

    if (!isAdmin && dailyUsage >= 5) {
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
    
    // Message rotation interval
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        // More natural progression
        const increment = Math.max(1, Math.floor((90 - prev) / 10));
        return Math.min(90, prev + increment);
      });
    }, 300);
    
    try {
      const result = await evaluateAssignment(assignmentFile, assignmentText, instructionsFile, instructionsText);
      setEvaluation(result);
      setProgress(100);
      
      // Increment usage count after successful evaluation
      if (!user && window.location.hostname === 'localhost') {
        incrementLocalAnonymousUsage();
      } else {
        await checkUsage();
      }
    } catch (error) {
      toast({
        title: "Fejl ved vurdering",
        description: "Der opstod en fejl under vurderingen af din opgave. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setIsLoading(false);
      setCurrentMessageIndex(0);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white/50 to-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(88,28,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(123,97,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="pt-24 relative">
        <AnimatedHeader onEvaluateClick={handleEvaluateClick} isLoading={isLoading} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 relative">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-8 border border-blue-100">
          <h3 className="text-lg font-medium text-blue-800 mb-2">🆕 Forbedret evaluering med AI</h3>
          <p className="text-blue-600">
            Vores system benytter nu en avanceret AI-model, der kan strukturere din evaluering på den mest 
            hjælpsomme måde. Du vil modtage en detaljeret, skræddersyet vurdering af dit arbejde med specifik 
            feedback i forskellige kategorier.
          </p>
        </div>

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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8"
          >
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
              <div className="relative">
                <div className="flex items-center justify-center mb-4 space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Analyserer din opgave
                  </h3>
                </div>
                
                <div className="relative mb-4">
                  <Progress value={progress} className="h-2" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-gray-600 text-center"
                  >
                    {loadingMessages[currentMessageIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        )}

        {evaluation && !isLoading && (
          <div className="max-w-4xl mx-auto mb-8">
            <EvaluationResult evaluation={evaluation} isPremium={isAdmin} />
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
