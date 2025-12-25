import React, { useState, useEffect } from "react";
import { 
  Map, 
  X, 
  Compass, 
  Navigation2, 
  MapPin, 
  Mountain,
  Waves,
  Home,
  Trees,
  AlertTriangle,
  Crosshair,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface OfflineMapProps {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  isOpen: boolean;
  onClose: () => void;
  sosActive?: boolean;
}

interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  type: "start" | "checkpoint" | "water" | "shelter" | "danger";
  timestamp: number;
}

// Calculate distance using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate bearing between two points
const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const getBearingDirection = (bearing: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(bearing / 45) % 8];
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

export const OfflineMap: React.FC<OfflineMapProps> = ({
  latitude,
  longitude,
  heading,
  isOpen,
  onClose,
  sosActive = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [addingWaypoint, setAddingWaypoint] = useState<Waypoint["type"] | null>(null);
  
  const { value: waypoints, setValue: setWaypoints } = useLocalStorage<Waypoint[]>(
    "offline_waypoints",
    []
  );

  const { value: pathHistory, setValue: setPathHistory } = useLocalStorage<Array<{lat: number; lng: number; time: number}>>(
    "path_history",
    []
  );

  // Record path history
  useEffect(() => {
    if (latitude && longitude && isOpen) {
      const lastPoint = pathHistory[pathHistory.length - 1];
      if (!lastPoint || 
          calculateDistance(latitude, longitude, lastPoint.lat, lastPoint.lng) > 10) {
        setPathHistory([...pathHistory.slice(-200), { lat: latitude, lng: longitude, time: Date.now() }]);
      }
    }
  }, [latitude, longitude, isOpen]);

  const addWaypoint = (type: Waypoint["type"]) => {
    if (!latitude || !longitude) return;
    
    const names = {
      start: "Start Point",
      checkpoint: "Checkpoint",
      water: "Water Source",
      shelter: "Shelter",
      danger: "Danger Zone",
    };

    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude,
      longitude,
      name: `${names[type]} ${waypoints.filter(w => w.type === type).length + 1}`,
      type,
      timestamp: Date.now(),
    };

    setWaypoints([...waypoints, newWaypoint]);
    setAddingWaypoint(null);
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter(w => w.id !== id));
    setSelectedWaypoint(null);
  };

  const getWaypointIcon = (type: Waypoint["type"]) => {
    switch (type) {
      case "start": return <Home className="w-4 h-4" />;
      case "checkpoint": return <MapPin className="w-4 h-4" />;
      case "water": return <Waves className="w-4 h-4" />;
      case "shelter": return <Mountain className="w-4 h-4" />;
      case "danger": return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getWaypointColor = (type: Waypoint["type"]) => {
    switch (type) {
      case "start": return "text-primary bg-primary/20";
      case "checkpoint": return "text-accent bg-accent/20";
      case "water": return "text-blue-400 bg-blue-400/20";
      case "shelter": return "text-amber-400 bg-amber-400/20";
      case "danger": return "text-destructive bg-destructive/20";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Offline Navigation</h2>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              NO NETWORK REQUIRED
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Compass-Based Map View */}
      <div className="h-full pt-20 pb-48 flex flex-col items-center justify-center bg-gradient-to-b from-secondary to-background">
        {/* Main Compass */}
        <div className="relative">
          {/* Compass ring */}
          <div 
            className="w-72 h-72 rounded-full border-4 border-primary/30 relative"
            style={{ transform: `rotate(${-(heading || 0)}deg)` }}
          >
            {/* Cardinal directions */}
            {["N", "E", "S", "W"].map((dir, i) => (
              <div
                key={dir}
                className="absolute text-lg font-bold text-foreground"
                style={{
                  top: dir === "N" ? "8px" : dir === "S" ? "auto" : "50%",
                  bottom: dir === "S" ? "8px" : "auto",
                  left: dir === "W" ? "8px" : dir === "E" ? "auto" : "50%",
                  right: dir === "E" ? "8px" : "auto",
                  transform: dir === "N" || dir === "S" ? "translateX(-50%)" : "translateY(-50%)",
                }}
              >
                <span className={dir === "N" ? "text-destructive" : "text-muted-foreground"}>
                  {dir}
                </span>
              </div>
            ))}

            {/* Degree marks */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 bg-muted-foreground/50"
                style={{
                  height: i % 3 === 0 ? "12px" : "6px",
                  left: "50%",
                  top: "0",
                  transformOrigin: "bottom center",
                  transform: `translateX(-50%) rotate(${i * 10}deg) translateY(${i % 3 === 0 ? 0 : 3}px)`,
                }}
              />
            ))}

            {/* Waypoints on compass */}
            {waypoints.map((wp) => {
              if (!latitude || !longitude) return null;
              const bearing = calculateBearing(latitude, longitude, wp.latitude, wp.longitude);
              const distance = calculateDistance(latitude, longitude, wp.latitude, wp.longitude);
              const normalizedDistance = Math.min(distance / 1000, 1); // Max 1km radius
              const radius = 100 * normalizedDistance + 20;
              
              return (
                <button
                  key={wp.id}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all ${getWaypointColor(wp.type)} ${
                    selectedWaypoint?.id === wp.id ? "ring-2 ring-primary scale-110" : ""
                  }`}
                  style={{
                    left: `calc(50% + ${Math.sin((bearing * Math.PI) / 180) * radius}px)`,
                    top: `calc(50% - ${Math.cos((bearing * Math.PI) / 180) * radius}px)`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => setSelectedWaypoint(wp)}
                >
                  {getWaypointIcon(wp.type)}
                </button>
              );
            })}
          </div>

          {/* Center (your position) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`w-6 h-6 rounded-full bg-primary flex items-center justify-center ${
              sosActive ? "animate-ping" : ""
            }`}>
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </div>

          {/* North indicator (fixed) */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Navigation2 className="w-6 h-6 text-destructive" />
          </div>
        </div>

        {/* Heading display */}
        <div className="mt-6 text-center">
          <p className="text-4xl font-bold text-foreground">
            {heading !== null ? `${Math.round(heading)}°` : "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            Heading {heading !== null ? getBearingDirection(heading) : "Unknown"}
          </p>
        </div>
      </div>

      {/* Add Waypoint Buttons */}
      <div className="absolute bottom-48 left-4 right-4">
        <div className="flex gap-2 justify-center flex-wrap">
          {(["start", "checkpoint", "water", "shelter", "danger"] as const).map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addWaypoint(type)}
              className={`gap-1 capitalize ${getWaypointColor(type)}`}
              disabled={!latitude || !longitude}
            >
              {getWaypointIcon(type)}
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Waypoint Info */}
      {selectedWaypoint && latitude && longitude && (
        <div className="absolute bottom-52 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getWaypointColor(selectedWaypoint.type)}`}>
                {getWaypointIcon(selectedWaypoint.type)}
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedWaypoint.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedWaypoint.type}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeWaypoint(selectedWaypoint.id)}
              className="text-destructive"
            >
              Remove
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-primary">
                {getBearingDirection(calculateBearing(latitude, longitude, selectedWaypoint.latitude, selectedWaypoint.longitude))}
              </p>
              <p className="text-xs text-muted-foreground">Direction</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {Math.round(calculateBearing(latitude, longitude, selectedWaypoint.latitude, selectedWaypoint.longitude))}°
              </p>
              <p className="text-xs text-muted-foreground">Bearing</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {formatDistance(calculateDistance(latitude, longitude, selectedWaypoint.latitude, selectedWaypoint.longitude))}
              </p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
          </div>
        </div>
      )}

      {/* GPS Info Footer */}
      <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Current Position</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trees className="w-3 h-3" />
            <span>{waypoints.length} waypoints saved</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Latitude</p>
            <p className="text-sm font-mono text-foreground">
              {latitude?.toFixed(6) || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Longitude</p>
            <p className="text-sm font-mono text-foreground">
              {longitude?.toFixed(6) || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Path Points</p>
            <p className="text-sm font-mono text-foreground">
              {pathHistory.length}
            </p>
          </div>
        </div>

        {sosActive && (
          <div className="mt-3 bg-destructive/20 border border-destructive/30 rounded-lg p-2 text-center">
            <p className="text-sm text-destructive font-medium animate-pulse">
              🚨 SOS ACTIVE - Location being shared
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
