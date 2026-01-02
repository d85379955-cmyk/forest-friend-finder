import React, { useState, useEffect } from "react";
import { 
  Download, 
  Map, 
  Trash2, 
  HardDrive, 
  CheckCircle2,
  Loader2,
  WifiOff,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOfflineMapTiles } from "@/hooks/useOfflineMapTiles";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { toast } from "sonner";

export const MapTileDownloader: React.FC = () => {
  const { latitude, longitude } = useNativeGPS();
  const {
    cacheStatus,
    downloadAreaTiles,
    clearCache,
    getCacheSize,
    isNative,
  } = useOfflineMapTiles();

  const [cacheSize, setCacheSize] = useState<number>(0);
  const [downloadRadius, setDownloadRadius] = useState<number>(5);

  useEffect(() => {
    const updateSize = async () => {
      const size = await getCacheSize();
      setCacheSize(size);
    };
    updateSize();
  }, [getCacheSize, cacheStatus.cachedTiles]);

  const handleDownload = async () => {
    if (!latitude || !longitude) {
      toast.error("GPS location required to download map tiles");
      return;
    }

    toast.info(`Downloading ${downloadRadius}km radius map tiles...`);
    await downloadAreaTiles(latitude, longitude, downloadRadius, 10, 15);
    toast.success("Map tiles downloaded for offline use!");
  };

  const handleClear = async () => {
    await clearCache();
    setCacheSize(0);
    toast.success("Map cache cleared");
  };

  if (!isNative) {
    return (
      <div className="bg-card/50 rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Offline Maps</p>
            <p className="text-xs">Available on native app only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Offline Map Tiles</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <HardDrive className="w-3 h-3" />
          <span>{cacheSize.toFixed(1)} MB</span>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-2xl font-bold text-foreground">
            {cacheStatus.cachedTiles}
          </p>
          <p className="text-xs text-muted-foreground">Cached Tiles</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-2xl font-bold text-foreground">
            {cacheStatus.lastSync
              ? new Date(cacheStatus.lastSync).toLocaleDateString()
              : "Never"}
          </p>
          <p className="text-xs text-muted-foreground">Last Sync</p>
        </div>
      </div>

      {/* Current Location */}
      {latitude && longitude && (
        <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-foreground">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
      )}

      {/* Download Progress */}
      {cacheStatus.isDownloading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Downloading...</span>
            <span className="text-foreground font-medium">
              {Math.round(cacheStatus.progress)}%
            </span>
          </div>
          <Progress value={cacheStatus.progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {cacheStatus.cachedTiles} / {cacheStatus.totalTiles} tiles
          </p>
        </div>
      )}

      {/* Radius Selection */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Download Radius</label>
        <div className="flex gap-2">
          {[3, 5, 10, 15].map((radius) => (
            <Button
              key={radius}
              variant={downloadRadius === radius ? "default" : "outline"}
              size="sm"
              onClick={() => setDownloadRadius(radius)}
              className="flex-1"
            >
              {radius}km
            </Button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          disabled={cacheStatus.isDownloading || !latitude || !longitude}
          className="flex-1 gap-2"
        >
          {cacheStatus.isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Area
        </Button>
        
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={cacheStatus.isDownloading || cacheStatus.cachedTiles === 0}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Error */}
      {cacheStatus.error && (
        <p className="text-sm text-destructive text-center">
          {cacheStatus.error}
        </p>
      )}

      {/* Success indicator */}
      {!cacheStatus.isDownloading && cacheStatus.cachedTiles > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span>Maps available offline</span>
        </div>
      )}
    </div>
  );
};
