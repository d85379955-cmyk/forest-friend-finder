import { useState } from "react";
import { Cloud } from "lucide-react";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";
import { useNativeHaptics } from "@/hooks/useNativeHaptics";
import { NotificationType } from "@capacitor/haptics";
import { toast } from "sonner";

export default function Weather() {
  const gpsData = useNativeGPS(true);
  const networkStatus = useNativeNetwork();
  const { notification } = useNativeHaptics();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
    notification(NotificationType.Success);
    toast.success("Weather refreshed");
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background hexagon-bg pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="p-2 rounded-xl bg-accent/20">
            <Cloud className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Weather Alerts</h1>
            <p className="text-xs text-muted-foreground">Barometric storm detection</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4" key={refreshKey}>
        <WeatherAlerts
          latitude={gpsData.latitude}
          longitude={gpsData.longitude}
          isOnline={networkStatus.isOnline}
          onStormAlert={() => toast.warning("⚠️ Storm approaching! Seek shelter.")}
        />

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">How It Works</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>📊 <strong className="text-foreground">Offline Detection:</strong> Uses your device's barometric pressure sensor to detect weather changes without internet.</p>
            <p>📉 <strong className="text-foreground">Storm Warning:</strong> A rapid pressure drop (3+ hPa/hour) indicates approaching storms.</p>
            <p>🌐 <strong className="text-foreground">Online Forecast:</strong> When connected, shows detailed weather data from Open-Meteo API.</p>
            <p>⛰️ <strong className="text-foreground">Altitude:</strong> Estimates your altitude based on atmospheric pressure.</p>
          </div>
        </div>
      </main>
    </PullToRefresh>
  );
}
