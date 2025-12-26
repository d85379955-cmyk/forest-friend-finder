import { useNavigate } from "react-router-dom";
import { TreePine, Settings, Shield, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  sosActive: boolean;
}

export const Header = ({ sosActive }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${sosActive ? "bg-destructive/20" : "bg-primary/20"}`}>
            <TreePine className={`w-6 h-6 ${sosActive ? "text-destructive" : "text-primary"}`} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight">Rescue Beacon</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sosActive ? "bg-destructive animate-pulse" : "bg-success"}`} />
              <span className="text-xs text-muted-foreground">
                {sosActive ? "SOS ACTIVE" : "Monitoring"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <div className="flex items-center gap-2 px-2 py-1 bg-secondary/50 rounded-lg">
              <User className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                {user?.email?.split('@')[0]}
              </span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleAuthClick}>
            {isAuthenticated ? (
              <LogOut className="w-4 h-4 text-muted-foreground" />
            ) : (
              <LogIn className="w-4 h-4 text-primary" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
