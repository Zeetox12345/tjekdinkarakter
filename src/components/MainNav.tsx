
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";
import { FileText } from "lucide-react";

export function MainNav({ user }: { user: User | null }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Fejl ved log ud",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Du er nu logget ud",
        description: "Vi håber at se dig igen snart!",
      });
      navigate("/");
    }
  };

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link to="/" className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          TjekDinKarakter<span className="text-blue-600">.dk</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              <Button
                variant={location.pathname === "/history" ? "default" : "ghost"}
                onClick={() => navigate("/history")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Tidligere vurderinger
              </Button>
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    Log ud
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Log ind
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
