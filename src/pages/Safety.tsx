import { Activity } from "lucide-react";
import { PathDetection } from "@/components/PathDetection";
import { FallDetection } from "@/components/FallDetection";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { toast } from "sonner";

export default function Safety() {
  const gpsData = useNativeGPS(true);

  const handleSOSTrigger = () => {
    toast.error("🚨 SOS Triggered from Safety Monitor!", { duration: 5000 });
  };

  return (
    <div className="min-h-screen bg-background hexagon-bg pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="p-2 rounded-xl bg-success/20">
            <Activity className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Safety Monitoring</h1>
            <p className="text-xs text-muted-foreground">AI path & fall detection</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <PathDetection
          latitude={gpsData.latitude}
          longitude={gpsData.longitude}
          accuracy={gpsData.accuracy}
          heading={gpsData.heading}
          onSOSTrigger={handleSOSTrigger}
        />

        <FallDetection onSOSTrigger={handleSOSTrigger} />

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Safety Features</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>🧭 <strong className="text-foreground">Path Detection:</strong> AI monitors your movement patterns to detect if you're lost or going in circles.</p>
            <p>📉 <strong className="text-foreground">Fall Detection:</strong> Monitors device accelerometer for sudden impacts indicating a fall.</p>
            <p>⏱️ <strong className="text-foreground">Inactivity Alert:</strong> Triggers warning if no movement detected for extended period.</p>
            <p>🔙 <strong className="text-foreground">Backtrack:</strong> Get directions back to your starting point.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
