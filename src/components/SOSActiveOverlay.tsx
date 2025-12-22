import { AlertTriangle, MapPin, Phone, Radio, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SOSActiveOverlayProps {
  latitude: number | null;
  longitude: number | null;
  onDeactivate: () => void;
  contactsCount: number;
}

export const SOSActiveOverlay = ({ latitude, longitude, onDeactivate, contactsCount }: SOSActiveOverlayProps) => {
  const [confirmExit, setConfirmExit] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const handleExitHold = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        onDeactivate();
        setConfirmExit(false);
        setHoldProgress(0);
      }
    }, 30);

    const handleRelease = () => {
      clearInterval(interval);
      setHoldProgress(0);
      document.removeEventListener("mouseup", handleRelease);
      document.removeEventListener("touchend", handleRelease);
    };

    document.addEventListener("mouseup", handleRelease);
    document.addEventListener("touchend", handleRelease);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="bg-destructive/20 border-b border-destructive/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive animate-pulse" />
            <div>
              <h1 className="font-display font-bold text-lg text-destructive">SOS ACTIVE</h1>
              <p className="text-xs text-destructive/80">Emergency mode engaged</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/20"
            onClick={() => setConfirmExit(true)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Pulsing SOS indicator */}
        <div className="flex justify-center py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/30 rounded-full sos-ring" />
            <div className="absolute inset-0 bg-destructive/20 rounded-full sos-ring" style={{ animationDelay: "0.7s" }} />
            <div className="w-32 h-32 rounded-full bg-gradient-sos flex items-center justify-center sos-pulse shadow-glow-sos">
              <span className="font-display font-black text-3xl text-destructive-foreground">SOS</span>
            </div>
          </div>
        </div>

        {/* Status cards */}
        <div className="space-y-3">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location Broadcasting</p>
                <p className="text-xs text-muted-foreground">
                  {latitude && longitude
                    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    : "Acquiring GPS..."}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </div>
          </div>

          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-warning signal-scan" />
              <div className="flex-1">
                <p className="text-sm font-medium">Scanning for Signal</p>
                <p className="text-xs text-muted-foreground">
                  Will auto-send SOS when connected
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">
                  {contactsCount} contacts will be notified
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/50">
          <h3 className="font-display font-bold text-sm mb-2">Stay Calm</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Your location is being tracked continuously</li>
            <li>• SOS will be sent automatically when signal is detected</li>
            <li>• Use survival tools to signal rescuers</li>
            <li>• Stay in one place if possible</li>
          </ul>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {confirmExit && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/20">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-display font-bold text-lg">Deactivate SOS?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Hold the button for 3 seconds to confirm you are safe and deactivate the emergency mode.
            </p>
            
            <div className="relative mb-4">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-75"
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setConfirmExit(false);
                  setHoldProgress(0);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="safe"
                className="flex-1"
                onMouseDown={handleExitHold}
                onTouchStart={handleExitHold}
              >
                I'm Safe
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
