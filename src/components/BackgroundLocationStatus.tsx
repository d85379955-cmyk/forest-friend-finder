import React from "react";
import { 
  Navigation, 
  Power, 
  MapPin, 
  Clock, 
  Route,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const BackgroundLocationStatus: React.FC = () => {
  const {
    isTracking,
    isAvailable,
    error,
    lastLocation,
    totalDistance,
    locationHistory,
    toggleTracking,
    clearHistory,
    getRescueTrailData,
    isNative,
  } = useBackgroundLocation();

  const handleToggle = async () => {
    if (isTracking) {
      await toggleTracking();
      toast.info("Background location stopped");
    } else {
      await toggleTracking();
      toast.success("Background location tracking started");
    }
  };

  const handleCopyRescueData = () => {
    const data = getRescueTrailData();
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("Rescue trail data copied to clipboard");
    } else {
      toast.error("No location data available");
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  if (!isNative) {
    return (
      <div className="bg-card/50 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Smartphone className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Background Location</p>
            <p className="text-xs">Available on native app only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className={`w-5 h-5 ${isTracking ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <h3 className="font-semibold text-foreground">Background Tracking</h3>
        </div>
        <div className="flex items-center gap-2">
          {isTracking && (
            <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          )}
          <Switch
            checked={isTracking}
            onCheckedChange={handleToggle}
            disabled={!isAvailable}
          />
        </div>
      </div>

      {/* Status Message */}
      {!isAvailable && (
        <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 rounded-lg p-2">
          <AlertCircle className="w-4 h-4" />
          <span>Background location not available</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {isTracking && !error && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg p-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Tracking location even when app is closed</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-secondary/50 rounded-lg p-3">
          <MapPin className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">
            {locationHistory.length}
          </p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-3">
          <Route className="w-4 h-4 mx-auto mb-1 text-accent" />
          <p className="text-lg font-bold text-foreground">
            {formatDistance(totalDistance)}
          </p>
          <p className="text-xs text-muted-foreground">Distance</p>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-3">
          <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">
            {lastLocation
              ? formatDistanceToNow(lastLocation.timestamp, { addSuffix: true })
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Last Update</p>
        </div>
      </div>

      {/* Last Location Details */}
      {lastLocation && (
        <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">Last Position</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Lat: </span>
              <span className="font-mono text-foreground">
                {lastLocation.latitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Lng: </span>
              <span className="font-mono text-foreground">
                {lastLocation.longitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Accuracy: </span>
              <span className="font-mono text-foreground">
                ±{Math.round(lastLocation.accuracy)}m
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Speed: </span>
              <span className="font-mono text-foreground">
                {lastLocation.speed
                  ? `${(lastLocation.speed * 3.6).toFixed(1)} km/h`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCopyRescueData}
          disabled={locationHistory.length === 0}
          className="flex-1 text-sm"
        >
          Copy Rescue Trail
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => {
            clearHistory();
            toast.success("Location history cleared");
          }}
          disabled={locationHistory.length === 0}
          className="text-sm text-destructive"
        >
          Clear
        </Button>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Background tracking continues when the app is closed to create a rescue trail
      </p>
    </div>
  );
};
