import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface SOSButtonProps {
  onActivate: () => void;
  isActive: boolean;
}

export const SOSButton = ({ onActivate, isActive }: SOSButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const handlePressStart = () => {
    setIsPressed(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        onActivate();
        setIsPressed(false);
        setHoldProgress(0);
      }
    }, 30);

    const handleRelease = () => {
      clearInterval(interval);
      setIsPressed(false);
      setHoldProgress(0);
      document.removeEventListener("mouseup", handleRelease);
      document.removeEventListener("touchend", handleRelease);
    };

    document.addEventListener("mouseup", handleRelease);
    document.addEventListener("touchend", handleRelease);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring animation */}
      {(isActive || isPressed) && (
        <>
          <div className="absolute w-48 h-48 rounded-full border-4 border-destructive/30 sos-ring" />
          <div className="absolute w-56 h-56 rounded-full border-2 border-destructive/20 sos-ring" style={{ animationDelay: "0.5s" }} />
        </>
      )}
      
      {/* Progress ring */}
      {isPressed && (
        <svg className="absolute w-44 h-44 -rotate-90">
          <circle
            cx="88"
            cy="88"
            r="80"
            fill="none"
            stroke="hsl(var(--destructive) / 0.3)"
            strokeWidth="8"
          />
          <circle
            cx="88"
            cy="88"
            r="80"
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="8"
            strokeDasharray={502}
            strokeDashoffset={502 - (502 * holdProgress) / 100}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>
      )}

      <Button
        variant="sos"
        size="sos"
        className={`relative z-10 ${isActive ? "sos-pulse" : ""}`}
        onMouseDown={handlePressStart}
        onTouchStart={handlePressStart}
      >
        <div className="flex flex-col items-center gap-2">
          <AlertTriangle className="w-12 h-12" />
          <span className="font-display font-black tracking-wider">
            {isActive ? "ACTIVE" : "SOS"}
          </span>
        </div>
      </Button>

      {!isActive && (
        <p className="absolute -bottom-8 text-xs text-muted-foreground">
          Hold for 1.5 seconds to activate
        </p>
      )}
    </div>
  );
};
