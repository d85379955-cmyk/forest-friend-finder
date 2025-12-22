import { Wifi, WifiOff, Signal, SignalZero, Bluetooth, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalStatusProps {
  networkStatus: "online" | "offline";
  signalStrength: number; // 0-4
  bluetoothEnabled: boolean;
  connectionType?: string;
}

export const SignalStatus = ({ networkStatus, signalStrength, bluetoothEnabled, connectionType }: SignalStatusProps) => {
  const isOnline = networkStatus === "online";
  
  const getConnectionLabel = () => {
    if (!connectionType || connectionType === "unknown") return "Network";
    return connectionType.toUpperCase();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${isOnline ? "bg-success/20" : "bg-destructive/20"}`}>
          <Radio className={`w-5 h-5 ${isOnline ? "text-success" : "text-destructive signal-scan"}`} />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Signal Monitor</h3>
          <p className="text-xs text-muted-foreground">
            {isOnline ? "Network detected - Ready to send" : "Scanning for signal..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Network Status */}
        <div className={cn(
          "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
          isOnline ? "border-success/30 bg-success/5" : "border-border bg-secondary/30"
        )}>
          {isOnline ? (
            <Wifi className="w-6 h-6 text-success" />
          ) : (
            <WifiOff className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">WiFi</span>
        </div>

        {/* Cellular Signal */}
        <div className={cn(
          "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
          signalStrength > 0 ? "border-success/30 bg-success/5" : "border-border bg-secondary/30"
        )}>
          {signalStrength > 0 ? (
            <Signal className="w-6 h-6 text-success" />
          ) : (
            <SignalZero className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">
            {signalStrength > 0 ? getConnectionLabel() : "No Signal"}
          </span>
        </div>

        {/* Bluetooth */}
        <div className={cn(
          "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
          bluetoothEnabled ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"
        )}>
          <Bluetooth className={`w-6 h-6 ${bluetoothEnabled ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-xs font-medium">
            {bluetoothEnabled ? "Active" : "Off"}
          </span>
        </div>
      </div>

      {!isOnline && (
        <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-xs text-warning flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            Monitoring for signal... SOS will auto-send when connected
          </p>
        </div>
      )}
    </div>
  );
};
