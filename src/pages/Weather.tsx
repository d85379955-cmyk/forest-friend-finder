import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";
import { toast } from "sonner";

export default function Weather() {
  const navigate = useNavigate();
  const gpsData = useNativeGPS(true);
  const networkStatus = useNativeNetwork();

  return (
    <div className="min-h-screen bg-background hexagon-bg">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20">
              <Cloud className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Weather Alerts</h1>
              <p className="text-xs text-muted-foreground">Barometric storm detection</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
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
    </div>
  );
}
