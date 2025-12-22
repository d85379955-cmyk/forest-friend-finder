import { Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryWarning, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatteryStatusProps {
  level: number;
  isCharging: boolean;
  survivalModeActive: boolean;
}

export const BatteryStatus = ({ level, isCharging, survivalModeActive }: BatteryStatusProps) => {
  const getBatteryIcon = () => {
    if (level <= 10) return <BatteryWarning className="w-5 h-5" />;
    if (level <= 25) return <BatteryLow className="w-5 h-5" />;
    if (level <= 60) return <BatteryMedium className="w-5 h-5" />;
    return <BatteryFull className="w-5 h-5" />;
  };

  const getBatteryColor = () => {
    if (level <= 10) return "text-destructive";
    if (level <= 25) return "text-warning";
    return "text-success";
  };

  const getEstimatedTime = () => {
    if (isCharging) return "Charging...";
    const baseHours = (level / 100) * 24;
    const survivalMultiplier = survivalModeActive ? 2.5 : 1;
    const hours = Math.round(baseHours * survivalMultiplier);
    return `~${hours}h remaining`;
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 shadow-card transition-all",
      level <= 10 ? "border-destructive/30 bg-destructive/5" : 
      level <= 25 ? "border-warning/30 bg-warning/5" : 
      "border-border bg-card"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-secondary", getBatteryColor())}>
            {getBatteryIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-display font-bold", getBatteryColor())}>
                {level}%
              </span>
              {isCharging && <Zap className="w-4 h-4 text-warning animate-pulse" />}
            </div>
            <p className="text-xs text-muted-foreground">{getEstimatedTime()}</p>
          </div>
        </div>

        {survivalModeActive && (
          <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
            <span className="text-xs font-medium text-primary">Survival Mode</span>
          </div>
        )}
      </div>

      {/* Battery bar */}
      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            level <= 10 ? "bg-destructive" :
            level <= 25 ? "bg-warning" :
            "bg-success",
            level <= 25 && "battery-pulse"
          )}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
};
