
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { DarkModeToggle } from "./DarkModeToggle";
import { UserNav } from "./UserNav";

interface MainNavProps {
  user: User | null;
}

export function MainNav({ user }: MainNavProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
        <Link to="/" className="font-bold text-xl">
          TjekDinKarakter.dk
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <DarkModeToggle />
          {user ? (
            <UserNav user={user} />
          ) : (
            <Button asChild>
              <Link to="/auth">Log ind</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
