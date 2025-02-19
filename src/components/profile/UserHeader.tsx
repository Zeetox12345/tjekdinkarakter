
import { User } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/utils/evaluation-utils";

interface UserHeaderProps {
  email: string;
  createdAt: string;
}

export function UserHeader({ email, createdAt }: UserHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{email}</h1>
            <p className="text-sm text-gray-500">
              Medlem siden {formatDate(createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
