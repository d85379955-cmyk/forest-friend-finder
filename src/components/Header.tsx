import { TreePine, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  sosActive: boolean;
}

export const Header = ({ sosActive }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${sosActive ? "bg-destructive/20" : "bg-primary/20"}`}>
            <TreePine className={`w-6 h-6 ${sosActive ? "text-destructive" : "text-primary"}`} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight">Forest Guardian</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sosActive ? "bg-destructive animate-pulse" : "bg-success"}`} />
              <span className="text-xs text-muted-foreground">
                {sosActive ? "SOS ACTIVE" : "Monitoring"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="glass" size="icon" className="h-9 w-9">
            <Shield className="w-4 h-4" />
          </Button>
          <Button variant="glass" size="icon" className="h-9 w-9">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
