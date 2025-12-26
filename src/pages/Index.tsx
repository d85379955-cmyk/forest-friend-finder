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
import { Cloud, Radio, MapPin, Activity, Wrench, Users, ChevronRight, Battery, Wifi, WifiOff } from "lucide-react";

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
    onSmsError: (contact, error) => toast.error(`Failed to send to ${contact.name}`),
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

  const menuItems = [
    { icon: Cloud, label: "Weather Alerts", desc: "Storm detection", path: "/weather", color: "text-accent", bg: "bg-accent/20" },
    { icon: Radio, label: "System Status", desc: "Network & power", path: "/status", color: "text-primary", bg: "bg-primary/20" },
    { icon: MapPin, label: "Location", desc: "GPS tracking", path: "/location", color: "text-primary", bg: "bg-primary/20" },
    { icon: Activity, label: "Safety", desc: "Fall & path detection", path: "/safety", color: "text-success", bg: "bg-success/20" },
    { icon: Wrench, label: "Tools", desc: "Survival utilities", path: "/tools", color: "text-warning", bg: "bg-warning/20" },
    { icon: Users, label: "Contacts", desc: "Emergency contacts", path: "/contacts", color: "text-destructive", bg: "bg-destructive/20" },
  ];

  return (
    <div className="min-h-screen bg-background hexagon-bg">
      <Header sosActive={sosActive} />

      <main className="pb-24">
        {isNative && (
          <div className="mx-4 mt-2 bg-success/10 border border-success/30 rounded-lg px-3 py-1.5 text-xs text-success text-center">
            ✓ Native Mode Active
          </div>
        )}

        {/* Status Bar */}
        <div className="mx-4 mt-4 flex items-center justify-between bg-card/50 border border-border rounded-xl px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Battery className={`w-4 h-4 ${batteryStatus.level <= 20 ? 'text-destructive' : 'text-success'}`} />
              <span className="text-xs text-muted-foreground">{batteryStatus.level}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              {networkStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-warning" />
              )}
              <span className="text-xs text-muted-foreground">
                {networkStatus.isOnline ? networkStatus.connectionType : 'Offline'}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {gpsData.latitude?.toFixed(4)}, {gpsData.longitude?.toFixed(4)}
          </div>
        </div>

        {/* SOS Section */}
        <section className="py-8 px-4 flex flex-col items-center">
          <SOSButton onActivate={handleSOSActivate} isActive={sosActive} />
        </section>

        {sosActive && (
          <div className="mx-4 mb-4">
            <SMSStatus hasSent={smsSent} isOnline={networkStatus.isOnline} sosActive={sosActive} contactsCount={contacts.length} />
          </div>
        )}

        {/* Navigation Menu */}
        <section className="px-4 space-y-2">
          <h2 className="font-display font-bold text-lg text-foreground mb-3">Features</h2>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl hover:bg-card transition-colors"
            >
              <div className={`p-2.5 rounded-xl ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-display font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </section>

        {!networkStatus.isOnline && (
          <div className="fixed bottom-4 left-4 right-4 bg-warning/20 border border-warning/30 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-sm text-warning text-center font-medium">📡 Offline Mode - All features active</p>
          </div>
        )}
      </main>

      {sosActive && <SOSActiveOverlay latitude={gpsData.latitude} longitude={gpsData.longitude} onDeactivate={handleSOSDeactivate} contactsCount={contacts.length} />}
    </div>
  );
};

export default Index;
