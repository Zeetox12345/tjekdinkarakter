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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white/50 to-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(88,28,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(123,97,255,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mt-8"
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
