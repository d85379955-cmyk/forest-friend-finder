import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatteryStatus } from "@/components/BatteryStatus";
import { SignalStatus } from "@/components/SignalStatus";
import { BluetoothMesh } from "@/components/BluetoothMesh";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";
import { useBattery } from "@/hooks/useBattery";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { useState } from "react";

export default function Status() {
  const navigate = useNavigate();
  const gpsData = useNativeGPS(true);
  const networkStatus = useNativeNetwork();
  const batteryStatus = useBattery();
  const { value: survivalMode } = useLocalStorage("survival_mode", false);

  const getSignalStrength = () => {
    if (!networkStatus.isOnline) return 0;
    const type = networkStatus.connectionType;
    if (type === "wifi") return 4;
    if (type === "4g") return 3;
    if (type === "3g") return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-background hexagon-bg">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">System Status</h1>
              <p className="text-xs text-muted-foreground">Network & power monitoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <BatteryStatus
          level={batteryStatus.level}
          isCharging={batteryStatus.isCharging}
          survivalModeActive={survivalMode}
        />

        <SignalStatus
          networkStatus={networkStatus.isOnline ? "online" : "offline"}
          signalStrength={getSignalStrength()}
          bluetoothEnabled={true}
          connectionType={networkStatus.connectionType}
        />

        <BluetoothMesh
          sosActive={false}
          gpsData={{ latitude: gpsData.latitude, longitude: gpsData.longitude }}
          onRelaySuccess={() => toast.success("Message relayed!")}
        />

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">About Mesh Network</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>📡 <strong className="text-foreground">Bluetooth Mesh:</strong> Relay SOS messages through nearby devices when there's no cellular signal.</p>
            <p>🔋 <strong className="text-foreground">Survival Mode:</strong> Automatically activates below 20% battery to extend device life.</p>
            <p>📶 <strong className="text-foreground">Auto-Send:</strong> Queued messages automatically send when network is detected.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
