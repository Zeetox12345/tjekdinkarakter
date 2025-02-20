
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserHeader } from "@/components/profile/UserHeader";
import { DailyUsage } from "@/components/profile/DailyUsage";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2" />
            Tilbage til forsiden
          </Button>

          {user && (
            <>
              <UserHeader 
                email={user.email || ""} 
                createdAt={user.created_at} 
              />
              <DailyUsage userId={user.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
