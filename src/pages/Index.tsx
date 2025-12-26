import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SOSButton } from "@/components/SOSButton";
import { SOSActiveOverlay } from "@/components/SOSActiveOverlay";
import { SMSStatus } from "@/components/SMSStatus";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";
import { useBattery } from "@/hooks/useBattery";
import { useNativeHaptics } from "@/hooks/useNativeHaptics";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAutoSMS } from "@/hooks/useAutoSMS";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Battery, Wifi, WifiOff, MapPin, Navigation, Radio } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: "personal" | "police" | "forest";
}

const defaultContacts: Contact[] = [
  { id: "1", name: "Emergency Services", phone: "112", type: "police" },
  { id: "2", name: "Forest Rescue", phone: "1800-XXX-XXXX", type: "forest" },
];

const Index = () => {
  const navigate = useNavigate();
  const [sosActive, setSosActive] = useState(false);
  const [survivalMode, setSurvivalMode] = useState(false);
  
  const { value: contacts } = useLocalStorage<Contact[]>("emergency_contacts", defaultContacts);

  const gpsData = useNativeGPS(true);
  const networkStatus = useNativeNetwork();
  const batteryStatus = useBattery();
  const haptics = useNativeHaptics();
  const notifications = useNativeNotifications();

  const { hasSent: smsSent } = useAutoSMS({
    sosActive,
    isOnline: networkStatus.isOnline,
    contacts,
    gpsData: { latitude: gpsData.latitude, longitude: gpsData.longitude, accuracy: gpsData.accuracy },
    onSmsSent: (contact) => toast.success(`📤 SOS sent to ${contact.name}`),
    onSmsError: (contact) => toast.error(`Failed to send to ${contact.name}`),
  });

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (batteryStatus.level <= 20 && !survivalMode) {
      setSurvivalMode(true);
      haptics.notification();
      toast.warning("Battery Survival Mode Activated");
    }
  }, [batteryStatus.level, survivalMode, haptics]);

  const handleSOSActivate = async () => {
    setSosActive(true);
    await haptics.vibrate(500);
    await notifications.sosNotification(gpsData.latitude, gpsData.longitude);
    toast.error("🚨 SOS ACTIVATED", { duration: 5000 });
  };

  const handleSOSDeactivate = async () => {
    setSosActive(false);
    await notifications.cancelSosNotification();
    await haptics.notification();
    toast.success("SOS Deactivated");
  };

  return (
    <div className="min-h-screen bg-background hexagon-bg pb-24">
      <Header sosActive={sosActive} />

      <main>
        {isNative && (
          <div className="mx-4 mt-2 bg-success/10 border border-success/30 rounded-lg px-3 py-1.5 text-xs text-success text-center">
            ✓ Native Mode Active
          </div>
        )}

        {/* Quick Status Cards */}
        <div className="grid grid-cols-3 gap-2 mx-4 mt-4">
          <div className="bg-card/50 border border-border rounded-xl p-3 text-center">
            <Battery className={`w-5 h-5 mx-auto ${batteryStatus.level <= 20 ? 'text-destructive' : 'text-success'}`} />
            <p className="text-lg font-display font-bold text-foreground mt-1">{batteryStatus.level}%</p>
            <p className="text-[10px] text-muted-foreground">Battery</p>
          </div>
          <div className="bg-card/50 border border-border rounded-xl p-3 text-center">
            {networkStatus.isOnline ? (
              <Wifi className="w-5 h-5 mx-auto text-success" />
            ) : (
              <WifiOff className="w-5 h-5 mx-auto text-warning" />
            )}
            <p className="text-lg font-display font-bold text-foreground mt-1 capitalize">
              {networkStatus.isOnline ? networkStatus.connectionType : 'Off'}
            </p>
            <p className="text-[10px] text-muted-foreground">Network</p>
          </div>
          <button 
            onClick={() => navigate('/status')}
            className="bg-card/50 border border-border rounded-xl p-3 text-center hover:bg-card transition-colors"
          >
            <Radio className="w-5 h-5 mx-auto text-primary" />
            <p className="text-lg font-display font-bold text-foreground mt-1">Mesh</p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </button>
        </div>

        {/* SOS Section */}
        <section className="py-10 px-4 flex flex-col items-center">
          <SOSButton onActivate={handleSOSActivate} isActive={sosActive} />
          <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
            Hold for 3 seconds to activate emergency mode
          </p>
        </section>

        {sosActive && (
          <div className="mx-4 mb-4">
            <SMSStatus hasSent={smsSent} isOnline={networkStatus.isOnline} sosActive={sosActive} contactsCount={contacts.length} />
          </div>
        )}

        {/* Location Card */}
        <button 
          onClick={() => navigate('/location')}
          className="mx-4 w-[calc(100%-2rem)] bg-card/50 border border-border rounded-xl p-4 hover:bg-card transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Current Location</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {gpsData.latitude?.toFixed(5)}, {gpsData.longitude?.toFixed(5)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Navigation className="w-3 h-3" />
              {gpsData.heading ? `${Math.round(gpsData.heading)}°` : '--'}
            </div>
          </div>
        </button>

        {/* Swipe Hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            ← Swipe to navigate between pages →
          </p>
        </div>

        {!networkStatus.isOnline && (
          <div className="fixed bottom-20 left-4 right-4 bg-warning/20 border border-warning/30 rounded-xl p-3 backdrop-blur-sm z-40">
            <p className="text-sm text-warning text-center font-medium">📡 Offline Mode - All features active</p>
          </div>
        )}
      </main>

      {sosActive && <SOSActiveOverlay latitude={gpsData.latitude} longitude={gpsData.longitude} onDeactivate={handleSOSDeactivate} contactsCount={contacts.length} />}
    </div>
  );
};

export default Index;
