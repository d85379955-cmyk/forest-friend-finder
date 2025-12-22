import { MapPin, Navigation, Clock, Compass } from "lucide-react";
import { StatusCard } from "./StatusCard";

interface GPSDisplayProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: Date | null;
  heading: number | null;
}

export const GPSDisplay = ({ latitude, longitude, accuracy, timestamp, heading }: GPSDisplayProps) => {
  const formatCoordinate = (coord: number | null, type: "lat" | "lng") => {
    if (coord === null) return "Acquiring...";
    const direction = type === "lat" ? (coord >= 0 ? "N" : "S") : (coord >= 0 ? "E" : "W");
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatHeading = (deg: number | null) => {
    if (deg === null) return "—";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return `${deg.toFixed(0)}° ${directions[index]}`;
  };

  const isAcquiring = latitude === null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${isAcquiring ? "bg-warning/20" : "bg-success/20"}`}>
          <MapPin className={`w-5 h-5 ${isAcquiring ? "text-warning signal-scan" : "text-success"}`} />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">GPS Location</h3>
          <p className="text-xs text-muted-foreground">
            {isAcquiring ? "Acquiring satellite signal..." : "Position locked"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatusCard
          icon={<Navigation className="w-4 h-4" />}
          label="Latitude"
          value={formatCoordinate(latitude, "lat")}
          status={isAcquiring ? "warning" : "safe"}
        />
        <StatusCard
          icon={<Navigation className="w-4 h-4 rotate-90" />}
          label="Longitude"
          value={formatCoordinate(longitude, "lng")}
          status={isAcquiring ? "warning" : "safe"}
        />
        <StatusCard
          icon={<Compass className="w-4 h-4" />}
          label="Heading"
          value={formatHeading(heading)}
          status="neutral"
        />
        <StatusCard
          icon={<Clock className="w-4 h-4" />}
          label="Updated"
          value={formatTime(timestamp)}
          status="neutral"
        />
      </div>

      {accuracy !== null && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            Accuracy: <span className="text-foreground font-medium">±{accuracy.toFixed(0)}m</span>
          </p>
        </div>
      )}
    </div>
  );
};
