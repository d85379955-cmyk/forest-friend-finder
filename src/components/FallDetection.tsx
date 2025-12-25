import React, { useState } from "react";
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  ShieldOff,
  Timer,
  X,
  Settings,
  Zap,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useFallDetection } from "@/hooks/useFallDetection";

interface FallDetectionProps {
  onSOSTrigger: () => void;
}

export const FallDetection: React.FC<FallDetectionProps> = ({ onSOSTrigger }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [detectionEnabled, setDetectionEnabled] = useState(false);

  const {
    isEnabled,
    fallDetected,
    inactivityDetected,
    lastMovement,
    impactForce,
    countdownActive,
    countdownSeconds,
    config,
    enableDetection,
    disableDetection,
    cancelAlert,
    updateConfig,
  } = useFallDetection(
    () => {
      console.log("🚨 Fall detection triggered SOS");
      onSOSTrigger();
    },
    () => {
      console.log("🚨 Inactivity detection triggered SOS");
      onSOSTrigger();
    },
    detectionEnabled
  );

  const toggleDetection = async () => {
    if (isEnabled) {
      disableDetection();
      setDetectionEnabled(false);
    } else {
      const success = await enableDetection();
      setDetectionEnabled(success);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleTimeString();
  };

  const getTimeSinceMovement = () => {
    if (!lastMovement) return "Unknown";
    const seconds = Math.floor((Date.now() - lastMovement.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Countdown overlay
  if (countdownActive) {
    return (
      <div className="fixed inset-0 z-[100] bg-destructive/95 flex flex-col items-center justify-center p-6 animate-pulse">
        <div className="text-center space-y-6">
          <AlertTriangle className="w-24 h-24 text-white mx-auto animate-bounce" />
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {fallDetected ? "FALL DETECTED!" : "NO MOVEMENT DETECTED!"}
            </h2>
            <p className="text-white/80 text-lg">
              {fallDetected 
                ? `Impact force: ${impactForce.toFixed(1)}G`
                : "Prolonged inactivity detected"}
            </p>
          </div>

          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray={`${(countdownSeconds / config.countdownSeconds) * 283} 283`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white">{countdownSeconds}</span>
            </div>
          </div>

          <p className="text-xl text-white">
            SOS will trigger in {countdownSeconds} seconds
          </p>

          <Button
            variant="outline"
            size="lg"
            onClick={cancelAlert}
            className="bg-white text-destructive hover:bg-white/90 border-0 text-xl px-12 py-6"
          >
            <X className="w-6 h-6 mr-2" />
            I'M OKAY - CANCEL
          </Button>

          <p className="text-white/60 text-sm">
            Tap the button if you're safe to cancel emergency alert
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 shadow-card ${
      isEnabled 
        ? "border-primary bg-primary/10" 
        : "border-border bg-card"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isEnabled ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <h3 className="font-semibold text-foreground">Fall Detection</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            OFFLINE
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant={isEnabled ? "destructive" : "default"}
            size="sm"
            onClick={toggleDetection}
            className="gap-1"
          >
            {isEnabled ? (
              <>
                <ShieldOff className="w-3 h-3" />
                Disable
              </>
            ) : (
              <>
                <Shield className="w-3 h-3" />
                Enable
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        {isEnabled ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <Zap className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Impact Threshold</p>
              <p className="text-sm font-medium text-foreground">{config.impactThreshold}G</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Last Movement</p>
              <p className="text-sm font-medium text-foreground">{getTimeSinceMovement()}</p>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Enable fall detection to automatically trigger SOS when a fall or prolonged inactivity is detected
            </p>
          </div>
        )}

        {/* Detection info */}
        {isEnabled && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
            <p>• Monitors for sudden impacts (falls, trips)</p>
            <p>• Alerts after {config.inactivityMinutes} min of no movement</p>
            <p>• {config.countdownSeconds}s countdown to cancel false alarms</p>
          </div>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <h4 className="text-sm font-medium text-foreground">Detection Settings</h4>
          
          {/* Impact threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impact Sensitivity</span>
              <span className="text-foreground">{config.impactThreshold}G</span>
            </div>
            <Slider
              value={[config.impactThreshold]}
              min={1.5}
              max={4}
              step={0.5}
              onValueChange={([value]) => updateConfig({ impactThreshold: value })}
            />
            <p className="text-xs text-muted-foreground">
              Lower = more sensitive (may trigger false alarms)
            </p>
          </div>

          {/* Inactivity timeout */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Inactivity Alert</span>
              <span className="text-foreground">{config.inactivityMinutes} min</span>
            </div>
            <Slider
              value={[config.inactivityMinutes]}
              min={5}
              max={60}
              step={5}
              onValueChange={([value]) => updateConfig({ inactivityMinutes: value })}
            />
          </div>

          {/* Countdown duration */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cancel Countdown</span>
              <span className="text-foreground">{config.countdownSeconds}s</span>
            </div>
            <Slider
              value={[config.countdownSeconds]}
              min={10}
              max={60}
              step={5}
              onValueChange={([value]) => updateConfig({ countdownSeconds: value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
