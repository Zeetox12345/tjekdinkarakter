
import { File, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { truncateText, formatDate } from "@/utils/evaluation-utils";

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

interface EvaluationListProps {
  evaluations: Evaluation[];
  onDelete: (id: string) => void;
  onActualGradeUpdate: (id: string, grade: string) => void;
}

const GRADES = ["12", "10", "7", "4", "02", "00", "-3"];

export function EvaluationList({ 
  evaluations, 
  onDelete, 
  onActualGradeUpdate 
}: EvaluationListProps) {
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
                onValueChange={(value) => onActualGradeUpdate(evaluation.id, value)}
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
                onClick={() => onDelete(evaluation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
