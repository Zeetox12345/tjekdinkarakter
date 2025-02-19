
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { User, ArrowLeft, Trash2, FileText, File, Edit2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const GRADES = ["12", "10", "7", "4", "02", "00", "-3"];

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

  const calculateAccuracy = (predicted: string, actual: string): number => {
    const grades = ["12", "10", "7", "4", "02", "00", "-3"];
    const predictedIndex = grades.indexOf(predicted);
    const actualIndex = grades.indexOf(actual);
    
    // Calculate normalized distance (0 = perfect match, 1 = furthest apart)
    const maxDistance = grades.length - 1;
    const distance = Math.abs(predictedIndex - actualIndex);
    const accuracy = 1 - (distance / maxDistance);
    
    return Number(accuracy.toFixed(2));
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
          accuracy_score: accuracyScore
        })
        .eq("id", evaluationId);

      if (error) {
        console.error("Error updating grade:", error);
        throw error;
      }

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
      
      // Trigger a re-fetch to ensure our data is up to date
      fetchEvaluations();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("da-DK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderAssignmentContent = (evaluation: Evaluation) => {
    if (evaluation.file_url && evaluation.file_name) {
      return (
        <div className="flex items-center space-x-2">
          <File className="h-4 w-4" />
          <a 
            href={evaluation.file_url}
            download={evaluation.file_name}
            className="text-primary hover:underline"
          >
            {evaluation.file_name}
          </a>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4" />
        <span>{truncateText(evaluation.assignment_text)}</span>
      </div>
    );
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

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user?.email}</h1>
                  <p className="text-sm text-gray-500">
                    Medlem siden {user && formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opgave</TableHead>
                    <TableHead className="w-24">Estimeret</TableHead>
                    <TableHead className="w-24">Faktisk</TableHead>
                    <TableHead className="w-48">Dato</TableHead>
                    <TableHead className="w-24">Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">
                        {renderAssignmentContent(evaluation)}
                      </TableCell>
                      <TableCell>{evaluation.grade}</TableCell>
                      <TableCell>
                        <Select
                          value={evaluation.actual_grade || ""}
                          onValueChange={(value) => handleActualGradeUpdate(evaluation.id, value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{formatDate(evaluation.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(evaluation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
