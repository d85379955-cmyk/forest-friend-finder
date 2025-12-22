import { Map, Users, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onNavigateToMap: () => void;
  onNavigateToContacts: () => void;
}

export const QuickActions = ({ onNavigateToMap, onNavigateToContacts }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Button
        variant="glass"
        className="flex flex-col items-center gap-2 h-auto py-4"
        onClick={onNavigateToMap}
      >
        <Map className="w-5 h-5 text-primary" />
        <span className="text-xs">Map</span>
      </Button>

      <Button
        variant="glass"
        className="flex flex-col items-center gap-2 h-auto py-4"
        onClick={onNavigateToContacts}
      >
        <Users className="w-5 h-5 text-primary" />
        <span className="text-xs">Contacts</span>
      </Button>

      <Button
        variant="glass"
        className="flex flex-col items-center gap-2 h-auto py-4"
      >
        <Activity className="w-5 h-5 text-primary" />
        <span className="text-xs">Health</span>
      </Button>

      <Button
        variant="glass"
        className="flex flex-col items-center gap-2 h-auto py-4"
      >
        <FileText className="w-5 h-5 text-primary" />
        <span className="text-xs">Logs</span>
      </Button>
    </div>
  );
};
