import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GPSDisplay } from "@/components/GPSDisplay";
import { OfflineMap } from "@/components/OfflineMap";
import { MapTileDownloader } from "@/components/MapTileDownloader";
import { BackgroundLocationStatus } from "@/components/BackgroundLocationStatus";
import { useNativeGPS } from "@/hooks/useNativeGPS";

export default function Location() {
  const navigate = useNavigate();
  const gpsData = useNativeGPS(true);
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background hexagon-bg pb-24">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Location Tracking</h1>
              <p className="text-xs text-muted-foreground">GPS & navigation data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* GPS Display */}
        <div className="rounded-xl border border-border bg-card p-4">
          <GPSDisplay
            latitude={gpsData.latitude}
            longitude={gpsData.longitude}
            accuracy={gpsData.accuracy}
            timestamp={gpsData.timestamp}
            heading={gpsData.heading}
          />
        </div>

        {/* Open Map Button */}
        <Button
          onClick={() => setMapOpen(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Map className="w-4 h-4 mr-2" />
          Open Offline Map
        </Button>

        {/* Background Location Tracking */}
        <BackgroundLocationStatus />

        {/* Offline Map Tile Downloader */}
        <MapTileDownloader />

        {/* Feature Info */}
        <div className="bg-card/50 border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">GPS Features</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>📍 <strong className="text-foreground">Live Tracking:</strong> Continuous GPS updates with accuracy monitoring.</p>
            <p>🧭 <strong className="text-foreground">Compass Heading:</strong> Shows your direction of travel.</p>
            <p>🗺️ <strong className="text-foreground">Offline Maps:</strong> Download map tiles for offline navigation.</p>
            <p>📌 <strong className="text-foreground">Waypoints:</strong> Mark and save important locations offline.</p>
            <p>🔄 <strong className="text-foreground">Background Tracking:</strong> Continues tracking even when app is closed.</p>
          </div>
        </div>
      </main>

      <OfflineMap
        latitude={gpsData.latitude}
        longitude={gpsData.longitude}
        heading={gpsData.heading}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        sosActive={false}
      />
    </div>
  );
}
