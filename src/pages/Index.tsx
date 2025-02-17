
import { Upload, AlertCircle, Star, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import EvaluationResult from "@/components/EvaluationResult";
import { Progress } from "@/components/ui/progress";
import { evaluateAssignment } from "@/functions/evaluate-assignment";

const Index = () => {
  const [assignmentText, setAssignmentText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [instructionsFile, setInstructionsFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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

  const handleEvaluate = async () => {
    if (!assignmentText && !assignmentFile) {
      toast({
        title: "Ingen opgave at vurdere",
        description: "Du skal enten uploade en fil eller indtaste opgavetekst",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 1000);

    try {
      const result = await evaluateAssignment(
        assignmentFile,
        assignmentText,
        instructionsFile,
        instructionsText
      );
      
      setEvaluation(result);
      setProgress(100);
    } catch (error) {
      toast({
        title: "Fejl ved vurdering",
        description: "Der opstod en fejl under vurderingen af din opgave. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            TjekDinKarakter.dk
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Få en hurtig, AI-drevet vurdering af din opgave
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
              Upload din opgave og få øjeblikkelig feedback
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Vi bruger avanceret AI-teknologi til at give dig en hurtig karaktervurdering,
              så du kan forbedre din opgave før endelig aflevering.
            </p>
            
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all mb-8"
              onClick={handleEvaluate}
              disabled={isLoading}
            >
              <Upload className="mr-2 h-5 w-5" />
              {isLoading ? "Vurderer..." : "Bedøm opgave"}
            </Button>
          </motion.div>
        </section>

        {isLoading && (
          <div className="max-w-xl mx-auto mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Vurderer din opgave...</h3>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-gray-600 text-center">
                Dette kan tage et par minutter
              </p>
            </Card>
          </div>
        )}

        {evaluation && !isLoading && (
          <div className="max-w-4xl mx-auto mb-8">
            <EvaluationResult evaluation={evaluation} />
          </div>
        )}

        <div className="max-w-7xl mx-auto mb-16">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instructions Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Opgavebeskrivelse</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Upload opgavebeskrivelsen</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={handleInstructionsFileChange}
                      className="hidden"
                      id="instructions-upload"
                    />
                    <label
                      htmlFor="instructions-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileText className="w-12 h-12 text-primary mb-2" />
                      <span className="text-sm text-gray-600">
                        Klik for at uploade eller træk filen hertil (.doc, .docx, .pdf)
                      </span>
                      {instructionsFile && (
                        <span className="mt-2 text-sm text-primary">{instructionsFile.name}</span>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Eller indsæt opgavebeskrivelsen direkte
                  </label>
                  <Textarea
                    placeholder="Indsæt opgavebeskrivelsen her..."
                    value={instructionsText}
                    onChange={(e) => setInstructionsText(e.target.value)}
                    className="min-h-[400px]"
                  />
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Din Opgave</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Upload din opgave</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={handleAssignmentFileChange}
                      className="hidden"
                      id="assignment-upload"
                    />
                    <label
                      htmlFor="assignment-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileText className="w-12 h-12 text-primary mb-2" />
                      <span className="text-sm text-gray-600">
                        Klik for at uploade eller træk filen hertil (.doc, .docx, .pdf)
                      </span>
                      {assignmentFile && (
                        <span className="mt-2 text-sm text-primary">{assignmentFile.name}</span>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Eller indsæt din opgavetekst direkte
                  </label>
                  <Textarea
                    placeholder="Indsæt din opgavetekst her..."
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                    className="min-h-[400px]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 text-center pt-6 border-t border-gray-200">
              <p className="mt-4 text-sm text-gray-500">
                * Tilføj opgavebeskrivelsen for en mere præcis vurdering
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Upload className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nem upload</h3>
            <p className="text-gray-600">
              Upload din opgave i DOC, DOCX eller PDF format med få klik
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Star className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hurtig vurdering</h3>
            <p className="text-gray-600">
              Få en cirka-karakter og konstruktiv feedback på få sekunder
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <AlertCircle className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Vejledende feedback</h3>
            <p className="text-gray-600">
              Få indsigt i styrker og forbedringsmuligheder i din opgave
            </p>
          </Card>
        </div>

        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Om os</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Kontakt
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Juridisk</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Privatlivspolitik
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
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
    </div>
  );
};

export default Index;
