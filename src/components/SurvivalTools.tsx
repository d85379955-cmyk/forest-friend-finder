import { Button } from "@/components/ui/button";
import { Flashlight, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useNativeFlashlight } from "@/hooks/useNativeFlashlight";
import { useSiren } from "@/hooks/useSiren";
import { useNativeHaptics } from "@/hooks/useNativeHaptics";

export const SurvivalTools = () => {
  const flashlight = useNativeFlashlight();
  const siren = useSiren();
  const haptics = useNativeHaptics();

  const toggleFlashlight = async () => {
    const success = await flashlight.toggle();
    if (success || !flashlight.isAvailable) {
      await haptics.impact();
      toast(flashlight.isOn ? "Flashlight OFF" : "Flashlight ON", {
        icon: flashlight.isOn ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
      });
    } else {
      toast.error("Flashlight not available", {
        description: "Camera permission may be required",
      });
    }
  };

  const toggleSosPattern = async () => {
    await haptics.impact();
    if (flashlight.sosActive) {
      await flashlight.stopSosPattern();
      toast("SOS Pattern OFF");
    } else {
      await flashlight.startSosPattern();
      // Also start haptic SOS pattern
      haptics.sosPattern();
      toast("SOS Light Pattern Active", {
        description: "Blinking ... --- ...",
      });
    }
  };

  const toggleSiren = async () => {
    await haptics.impact();
    siren.toggleSiren();
    toast(siren.isPlaying ? "Siren OFF" : "Emergency Siren Active", {
      icon: siren.isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="font-display font-bold text-lg mb-4">Survival Tools</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant={flashlight.isOn ? "safe" : "glass"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={toggleFlashlight}
          disabled={!flashlight.isAvailable}
        >
          <Flashlight className={`w-6 h-6 ${flashlight.isOn ? "" : "text-muted-foreground"}`} />
          <span className="text-xs font-medium">Light</span>
        </Button>

        <Button
          variant={flashlight.sosActive ? "warning" : "glass"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={toggleSosPattern}
          disabled={!flashlight.isAvailable}
        >
          <div className={`flex gap-1 ${flashlight.sosActive ? "animate-pulse" : ""}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
          </div>
          <span className="text-xs font-medium">SOS Light</span>
        </Button>

        <Button
          variant={siren.isPlaying ? "destructive" : "glass"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={toggleSiren}
        >
          {siren.isPlaying ? (
            <Volume2 className="w-6 h-6 animate-pulse" />
          ) : (
            <VolumeX className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">Siren</span>
        </Button>
      </div>

      {!flashlight.isAvailable && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Flashlight requires camera permission on this device
        </p>
      )}
    </div>
  );
};
