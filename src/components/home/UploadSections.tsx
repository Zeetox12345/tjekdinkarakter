import { Upload, FileType, ArrowUpFromLine } from "lucide-react";
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

  const UploadIcon = ({ className }: { className?: string }) => (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-primary/10 rounded-full scale-[0.8] group-hover:scale-[1.1] transition-transform" />
      <FileType className="w-6 h-6 text-primary/70 relative z-10 group-hover:text-primary transition-colors" />
      <ArrowUpFromLine className="w-4 h-4 text-primary/60 absolute -right-1 -bottom-1 z-20 group-hover:text-primary transition-colors" />
    </div>
  );

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
            Opgavebeskrivelse
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 tracking-wide uppercase">
              Upload opgavebeskrivelsen
            </label>
            <div 
              className={`border border-dashed rounded-lg p-6 text-center transition-all hover:bg-gray-50/80
                ${instructionsFile ? 'border-primary/70 bg-primary/5' : 'border-gray-200'}
                cursor-pointer group relative overflow-hidden`}
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
              <label htmlFor="instructions-upload" className="cursor-pointer flex flex-col items-center relative z-10">
                <UploadIcon className="mb-3" />
                <span className="text-xs text-gray-500 group-hover:text-primary/70 transition-colors">
                  Træk filen hertil eller klik for at uploade
                </span>
                {instructionsFile && (
                  <span className="mt-1 text-xs font-medium bg-gradient-to-r from-primary/60 to-primary bg-clip-text text-transparent">
                    {instructionsFile.name}
                  </span>
                )}
              </label>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 tracking-wide uppercase">
              Eller indsæt opgavebeskrivelsen direkte
            </label>
            <Textarea
              placeholder="Indsæt opgavebeskrivelsen her..."
              value={instructionsText}
              onChange={onInstructionsTextChange}
              className="h-[200px] resize-none text-sm transition-colors focus:border-primary/40 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
            Din Opgave
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 tracking-wide uppercase">
              Upload din opgave
            </label>
            <div
              className={`border border-dashed rounded-lg p-6 text-center transition-all hover:bg-gray-50/80
                ${assignmentFile ? 'border-primary/70 bg-primary/5' : 'border-gray-200'}
                cursor-pointer group relative overflow-hidden`}
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
              <label htmlFor="assignment-upload" className="cursor-pointer flex flex-col items-center relative z-10">
                <UploadIcon className="mb-3" />
                <span className="text-xs text-gray-500 group-hover:text-primary/70 transition-colors">
                  Træk filen hertil eller klik for at uploade
                </span>
                {assignmentFile && (
                  <span className="mt-1 text-xs font-medium bg-gradient-to-r from-primary/60 to-primary bg-clip-text text-transparent">
                    {assignmentFile.name}
                  </span>
                )}
              </label>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 tracking-wide uppercase">
              Eller indsæt din opgavetekst direkte
            </label>
            <Textarea
              placeholder="Indsæt din opgavetekst her..."
              value={assignmentText}
              onChange={onAssignmentTextChange}
              className="h-[200px] resize-none text-sm transition-colors focus:border-primary/40 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
