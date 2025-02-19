
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { UserHeader } from "@/components/profile/UserHeader";
import { EvaluationList } from "@/components/profile/EvaluationList";
import { calculateAccuracy } from "@/utils/evaluation-utils";

interface Evaluation {
  id: string;
  created_at: string;
  assignment_text: string;
  file_name?: string;
  file_url?: string;
  grade: string;
  actual_grade?: string;
  accuracy_score?: number;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchEvaluations();
  }, [user, navigate]);

  const fetchEvaluations = async () => {
    try {
      console.log("Fetching evaluations...");
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq('user_id', user?.id) // Only fetch user's own evaluations
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched evaluations:", data);
      setEvaluations(data || []);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      toast({
        title: "Fejl ved hentning af evalueringer",
        description: "Der opstod en fejl. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActualGradeUpdate = async (evaluationId: string, actualGrade: string) => {
    try {
      console.log("Updating actual grade:", evaluationId, actualGrade);
      
      const evaluation = evaluations.find(e => e.id === evaluationId);
      if (!evaluation) {
        console.error("Evaluation not found:", evaluationId);
        return;
      }

      const accuracyScore = calculateAccuracy(evaluation.grade, actualGrade);
      console.log("Calculated accuracy score:", accuracyScore);

      const { error } = await supabase
        .from("evaluations")
        .update({ 
          actual_grade: actualGrade,
          accuracy_score: accuracyScore,
          user_id: user?.id // Ensure user_id is set
        })
        .eq("id", evaluationId)
        .select();

      if (error) {
        console.error("Error updating grade:", error);
        throw error;
      }

      // Update local state immediately
      setEvaluations(prevEvaluations => 
        prevEvaluations.map(evaluation => 
          evaluation.id === evaluationId
            ? { ...evaluation, actual_grade: actualGrade, accuracy_score: accuracyScore }
            : evaluation
        )
      );

      toast({
        title: "Karakter opdateret",
        description: "Din faktiske karakter er blevet gemt.",
      });
    } catch (error) {
      console.error("Error in handleActualGradeUpdate:", error);
      toast({
        title: "Fejl ved opdatering",
        description: "Der opstod en fejl. Prøv igen senere.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("evaluations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEvaluations((prevEvaluations) => 
        prevEvaluations.filter((evaluation) => evaluation.id !== id)
      );
      
      toast({
        title: "Evaluering slettet",
        description: "Din evaluering er blevet slettet.",
      });
    } catch (error) {
      toast({
        title: "Fejl ved sletning",
        description: "Der opstod en fejl. Prøv igen senere.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2" />
            Tilbage til forsiden
          </Button>

          {user && (
            <UserHeader 
              email={user.email || ""} 
              createdAt={user.created_at} 
            />
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Dine evalueringer</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Indlæser evalueringer...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">
                  Du har endnu ikke fået evalueret nogen opgaver.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/")}
                >
                  Evaluer din første opgave
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <EvaluationList 
                evaluations={evaluations}
                onDelete={handleDelete}
                onActualGradeUpdate={handleActualGradeUpdate}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
