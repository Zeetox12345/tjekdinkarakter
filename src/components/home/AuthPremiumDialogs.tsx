
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LockIcon, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface AuthPremiumDialogsProps {
  showAuthDialog: boolean;
  showPremiumDialog: boolean;
  setShowAuthDialog: (show: boolean) => void;
  setShowPremiumDialog: (show: boolean) => void;
}

export const AuthPremiumDialogs = ({
  showAuthDialog,
  showPremiumDialog,
  setShowAuthDialog,
  setShowPremiumDialog
}: AuthPremiumDialogsProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log ind for at fortsætte</DialogTitle>
            <DialogDescription>
              For at få din opgave vurderet skal du oprette en konto eller logge ind.
            </DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-4 pt-4"
          >
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAuthDialog(false);
                  navigate("/auth");
                }}
              >
                Log ind
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowAuthDialog(false);
                  navigate("/auth");
                }}
              >
                Opret konto
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opgrader til Premium</DialogTitle>
            <DialogDescription>
              Få ubegrænset adgang til karaktervurderinger og detaljeret feedback
            </DialogDescription>
          </DialogHeader>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-4 pt-4"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-primary">79 kr/måned</p>
              <p className="text-sm text-gray-600">
                Med Premium får du:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Ubegrænset antal vurderinger
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Detaljeret feedback og analyse
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Prioriteret support
                </li>
              </ul>
            </div>
            <div className="flex gap-4 w-full pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowPremiumDialog(false)}>
                Senere
              </Button>
              <Button 
                className="flex-1 gap-2" 
                onClick={() => {
                  setShowPremiumDialog(false);
                  navigate("/premium");
                }}
              >
                <Zap className="h-4 w-4" />
                Opgrader nu
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};
