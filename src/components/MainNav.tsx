
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { User as UserIcon } from "lucide-react";

export function MainNav({ user }: { user: User | null }) {
  const { toast } = useToast();
  const navigate = useNavigate();
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
        <Link to="/" className="flex items-center">
          <span className="font-serif text-2xl tracking-tighter">
            tjekdinkarakter
            <span className="text-primary font-sans">.</span>
            <span className="text-xs align-top ml-0.5 tracking-tight">dk</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  {user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Min profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Log ud
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
