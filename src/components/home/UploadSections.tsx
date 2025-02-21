
import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface UploadSectionsProps {
  instructionsFile: File | null;
  assignmentFile: File | null;
  instructionsText: string;
  assignmentText: string;
  onInstructionsFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAssignmentFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInstructionsTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAssignmentTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onDrop: (e: React.DragEvent, type: 'instructions' | 'assignment') => void;
}

export const UploadSections = ({
  instructionsFile,
  assignmentFile,
  instructionsText,
  assignmentText,
  onInstructionsFileChange,
  onAssignmentFileChange,
  onInstructionsTextChange,
  onAssignmentTextChange,
  onDrop
}: UploadSectionsProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Card className="p-6 bg-white/50 backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Opgavebeskrivelse</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Upload opgavebeskrivelsen</label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${instructionsFile ? 'border-primary' : 'border-gray-300'}
                hover:border-primary cursor-pointer`}
              onDragOver={handleDragOver}
              onDrop={(e) => onDrop(e, 'instructions')}
            >
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={onInstructionsFileChange}
                className="hidden"
                id="instructions-upload"
              />
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
            <Textarea
              placeholder="Indsæt opgavebeskrivelsen her..."
              value={instructionsText}
              onChange={onInstructionsTextChange}
              className="min-h-[400px]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Din Opgave</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Upload din opgave</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${assignmentFile ? 'border-primary' : 'border-gray-300'}
                hover:border-primary cursor-pointer`}
              onDragOver={handleDragOver}
              onDrop={(e) => onDrop(e, 'assignment')}
            >
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={onAssignmentFileChange}
                className="hidden"
                id="assignment-upload"
              />
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
            <Textarea
              placeholder="Indsæt din opgavetekst her..."
              value={assignmentText}
              onChange={onAssignmentTextChange}
              className="min-h-[400px]"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
