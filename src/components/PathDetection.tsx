import React from "react";
import { 
  AlertTriangle, 
  Navigation2, 
  CircleDot, 
  Play, 
  Square, 
  RotateCcw,
  Compass,
  MapPin,
  Timer,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathDetection } from "@/hooks/usePathDetection";

interface PathDetectionProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  onSOSTrigger?: () => void;
}

export const PathDetection: React.FC<PathDetectionProps> = ({
  latitude,
  longitude,
  accuracy,
  heading,
  onSOSTrigger,
}) => {
  const {
    analysis,
    isRecording,
    pathPoints,
    originalPathPoints,
    startRecording,
    stopRecording,
    markSafePath,
    getBacktrackDirections,
    clearPath,
  } = usePathDetection(latitude, longitude, accuracy);

  const backtrack = getBacktrackDirections();

  const getWarningColor = () => {
    switch (analysis.warning) {
      case "critical":
        return "border-destructive bg-destructive/20";
      case "high":
        return "border-warning bg-warning/20";
      case "medium":
        return "border-accent bg-accent/10";
      case "low":
        return "border-primary/50 bg-primary/10";
      default:
        return "border-border bg-card";
    }
  };

  const getWarningIcon = () => {
    switch (analysis.warning) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return <Navigation2 className="w-5 h-5 text-primary" />;
    }
  };

  const getBearingDirection = (bearing: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <div className={`rounded-xl border p-4 shadow-card ${getWarningColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getWarningIcon()}
          <h3 className="font-semibold text-foreground">AI Path Detection</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            OFFLINE
          </span>
        </div>
        
        {/* Recording controls */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <Button
              variant="outline"
              size="sm"
              onClick={startRecording}
              className="gap-1"
            >
              <Play className="w-3 h-3" />
              Start
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="gap-1"
            >
              <Square className="w-3 h-3" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Path Confidence</span>
          <span className="text-sm font-medium text-foreground">
            {analysis.confidence}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              analysis.confidence > 70
                ? "bg-destructive"
                : analysis.confidence > 50
                ? "bg-warning"
                : analysis.confidence > 30
                ? "bg-accent"
                : "bg-primary"
            }`}
            style={{ width: `${analysis.confidence}%` }}
          />
        </div>
      </div>

      {/* Analysis result */}
      <div className="space-y-3">
        {/* Reason */}
        <div className="flex items-start gap-2">
          <CircleDot className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{analysis.reason}</p>
            <p className="text-xs text-muted-foreground">{analysis.suggestedAction}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <MapPin className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Points</p>
            <p className="text-sm font-medium text-foreground">{pathPoints}</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Deviation</p>
            <p className="text-sm font-medium text-foreground">
              {formatDistance(analysis.distanceFromPath)}
            </p>
          </div>
          <div className="text-center">
            <Timer className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Stationary</p>
            <p className="text-sm font-medium text-foreground">
              {analysis.stationaryTime > 0 
                ? `${Math.round(analysis.stationaryTime)}m` 
                : "—"}
            </p>
          </div>
        </div>

        {/* Circling warning */}
        {analysis.circlingDetected && (
          <div className="bg-warning/20 border border-warning/30 rounded-lg p-3 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-warning animate-spin" />
            <p className="text-sm text-warning font-medium">
              Circular movement detected - common sign of disorientation
            </p>
          </div>
        )}

        {/* Backtrack directions */}
        {analysis.backtrackAvailable && analysis.isLost && backtrack.targetPoint && (
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Return to Last Safe Position
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {getBearingDirection(backtrack.bearing)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(backtrack.bearing)}°
                  </p>
                </div>
                <div
                  className="w-10 h-10 border-2 border-primary rounded-full flex items-center justify-center"
                  style={{
                    transform: `rotate(${backtrack.bearing - (heading || 0)}deg)`,
                  }}
                >
                  <Navigation2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {formatDistance(backtrack.distance)}
                </p>
                <p className="text-xs text-muted-foreground">to safe point</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {isRecording && pathPoints > 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markSafePath}
              className="flex-1 gap-1"
            >
              <MapPin className="w-3 h-3" />
              Mark Safe Path
            </Button>
          )}
          
          {analysis.warning === "critical" && onSOSTrigger && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onSOSTrigger}
              className="flex-1 gap-1 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              Activate SOS
            </Button>
          )}

          {pathPoints > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPath}
              className="gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
