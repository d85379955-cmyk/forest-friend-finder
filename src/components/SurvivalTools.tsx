import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flashlight, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

export const SurvivalTools = () => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [sirenOn, setSirenOn] = useState(false);
  const [sosPattern, setSosPattern] = useState(false);

  const toggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
    toast(flashlightOn ? "Flashlight OFF" : "Flashlight ON", {
      icon: flashlightOn ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
    });
  };

  const toggleSosPattern = () => {
    setSosPattern(!sosPattern);
    toast(sosPattern ? "SOS Pattern OFF" : "SOS Light Pattern Active", {
      description: sosPattern ? undefined : "Blinking ... --- ...",
    });
  };

  const toggleSiren = () => {
    setSirenOn(!sirenOn);
    toast(sirenOn ? "Siren OFF" : "Emergency Siren Active", {
      icon: sirenOn ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="font-display font-bold text-lg mb-4">Survival Tools</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant={flashlightOn ? "safe" : "glass"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={toggleFlashlight}
        >
          <Flashlight className={`w-6 h-6 ${flashlightOn ? "" : "text-muted-foreground"}`} />
          <span className="text-xs font-medium">Light</span>
        </Button>

        <Button
          variant={sosPattern ? "warning" : "glass"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={toggleSosPattern}
        >
          <div className={`flex gap-1 ${sosPattern ? "animate-pulse" : ""}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
          </div>
          <span className="text-xs font-medium">SOS Light</span>
        </Button>

        <Button
          variant={sirenOn ? "destructive" : "glass"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={toggleSiren}
        >
          {sirenOn ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">Siren</span>
        </Button>
      </div>
    </div>
  );
};
