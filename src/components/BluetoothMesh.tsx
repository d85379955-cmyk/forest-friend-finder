import { Bluetooth, Radio, Wifi, WifiOff, Users, AlertTriangle, CheckCircle, Signal } from "lucide-react";
import { useBluetoothMesh, NearbyDevice } from "@/hooks/useBluetoothMesh";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BluetoothMeshProps {
  sosActive: boolean;
  gpsData: { latitude: number; longitude: number };
  onRelaySuccess?: () => void;
}

const DeviceCard = ({ device }: { device: NearbyDevice }) => {
  const distanceColors = {
    near: "text-safe",
    medium: "text-warning",
    far: "text-muted-foreground",
  };

  const distanceLabels = {
    near: "< 10m",
    medium: "10-30m",
    far: "> 30m",
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all",
      device.sosActive 
        ? "bg-danger/10 border-danger/30 animate-pulse" 
        : "bg-card/50 border-border/50"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          device.sosActive ? "bg-danger/20" : "bg-primary/10"
        )}>
          {device.sosActive ? (
            <AlertTriangle className="w-5 h-5 text-danger" />
          ) : (
            <Radio className="w-5 h-5 text-primary" />
          )}
        </div>
        
        <div>
          <p className="font-medium text-foreground text-sm">{device.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-xs", distanceColors[device.distance])}>
              {distanceLabels[device.distance]}
            </span>
            {device.rssi && (
              <span className="text-xs text-muted-foreground">
                {device.rssi} dBm
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {device.hasSignal ? (
          <div className="flex items-center gap-1 text-safe">
            <Wifi className="w-4 h-4" />
            <span className="text-xs">Signal</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs">No signal</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BluetoothMesh = ({ sosActive, gpsData, onRelaySuccess }: BluetoothMeshProps) => {
  const mesh = useBluetoothMesh(sosActive, gpsData);

  const handleManualScan = async () => {
    if (mesh.isScanning) {
      mesh.stopScanning();
      toast("Scanning stopped");
    } else {
      mesh.startScanning();
      toast("Scanning for nearby devices...");
    }
  };

  const handleBroadcastSOS = async () => {
    const result = await mesh.broadcastSOS();
    if (result) {
      toast.success("SOS broadcast to nearby devices", {
        description: `${mesh.nearbyDevices.length} devices in range`,
      });
    }
  };

  const relayCapableDevices = mesh.getRelayCapableDevices();
  const distressedDevices = mesh.getDistressedDevices();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            mesh.isAvailable ? "bg-primary/10" : "bg-muted"
          )}>
            <Bluetooth className={cn(
              "w-5 h-5",
              mesh.isAvailable ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Rescue Mesh Network</h3>
            <p className="text-xs text-muted-foreground">
              {mesh.isAvailable ? "Bluetooth available" : "Bluetooth unavailable"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mesh.isScanning && (
            <div className="flex items-center gap-1 text-primary animate-pulse">
              <Signal className="w-4 h-4" />
              <span className="text-xs">Scanning</span>
            </div>
          )}
          {mesh.isAdvertising && (
            <div className="flex items-center gap-1 text-safe">
              <Radio className="w-4 h-4" />
              <span className="text-xs">Visible</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-foreground">{mesh.nearbyDevices.length}</p>
          <p className="text-xs text-muted-foreground">Nearby</p>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-safe mb-1">
            <Wifi className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-foreground">{relayCapableDevices.length}</p>
          <p className="text-xs text-muted-foreground">Can Relay</p>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-danger mb-1">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-foreground">{distressedDevices.length}</p>
          <p className="text-xs text-muted-foreground">In Distress</p>
        </div>
      </div>

      {/* Relay capable indicator */}
      {relayCapableDevices.length > 0 && sosActive && (
        <div className="bg-safe/10 border border-safe/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-safe" />
            <div>
              <p className="text-sm font-medium text-safe">Relay Available</p>
              <p className="text-xs text-safe/80">
                {relayCapableDevices.length} device(s) can relay your SOS when they get signal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Distressed devices alert */}
      {distressedDevices.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger animate-pulse" />
            <div>
              <p className="text-sm font-medium text-danger">Nearby SOS Detected!</p>
              <p className="text-xs text-danger/80">
                {distressedDevices.length} device(s) nearby need help
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Device List */}
      {mesh.nearbyDevices.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Nearby Devices</p>
          {mesh.nearbyDevices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}

      {/* No devices message */}
      {mesh.nearbyDevices.length === 0 && mesh.isScanning && (
        <div className="text-center py-6 text-muted-foreground">
          <Radio className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p className="text-sm">Searching for nearby Forest Guardian users...</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant={mesh.isScanning ? "secondary" : "outline"}
          size="sm"
          onClick={handleManualScan}
          className="flex-1"
        >
          <Signal className="w-4 h-4 mr-2" />
          {mesh.isScanning ? "Stop Scan" : "Scan Nearby"}
        </Button>
        
        {sosActive && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBroadcastSOS}
            className="flex-1"
          >
            <Radio className="w-4 h-4 mr-2" />
            Broadcast SOS
          </Button>
        )}
      </div>

      {/* Relay count */}
      {mesh.relayedCount > 0 && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          ✓ {mesh.relayedCount} SOS messages relayed to rescue services
        </p>
      )}
    </div>
  );
};
