
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Star, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { format } from "date-fns";

interface Evaluation {
  id: string;
  grade: string;
  assignment_text: string;
  instructions_text: string | null;
  reasoning: string;
  strengths: string[];
  improvements: string[];
  created_at: string;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Evaluation[];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Tidligere vurderinger</h1>
      <div className="space-y-6">
        {evaluations?.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">Du har endnu ingen vurderinger</p>
          </Card>
        ) : (
          evaluations?.map((evaluation) => (
            <Card key={evaluation.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    Karakter: {evaluation.grade}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {format(new Date(evaluation.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Opgave
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {evaluation.assignment_text}
                    </p>
                    
                    {evaluation.instructions_text && (
                      <>
                        <h3 className="font-semibold flex items-center gap-2 mb-2 mt-4">
                          <FileText className="h-4 w-4" />
                          Opgavebeskrivelse
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {evaluation.instructions_text}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4" />
                        Styrker
                      </h3>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {evaluation.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Forbedringspunkter
                      </h3>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {evaluation.improvements.map((improvement, index) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
