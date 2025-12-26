import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SOSButton } from "@/components/SOSButton";
import { GPSDisplay } from "@/components/GPSDisplay";
import { SignalStatus } from "@/components/SignalStatus";
import { SurvivalTools } from "@/components/SurvivalTools";
import { BatteryStatus } from "@/components/BatteryStatus";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { QuickActions } from "@/components/QuickActions";
import { SOSActiveOverlay } from "@/components/SOSActiveOverlay";
import { BluetoothMesh } from "@/components/BluetoothMesh";
import { SMSStatus } from "@/components/SMSStatus";
import { OfflineMap } from "@/components/OfflineMap";
import { PathDetection } from "@/components/PathDetection";
import { FallDetection } from "@/components/FallDetection";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { FeatureSection } from "@/components/FeatureSection";
import { SectionHeader } from "@/components/SectionHeader";
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";
import { useBattery } from "@/hooks/useBattery";
import { useNativeHaptics } from "@/hooks/useNativeHaptics";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAutoSMS } from "@/hooks/useAutoSMS";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { MapPin, Radio, Shield, Wrench, Users, Navigation, Cloud, Activity } from "lucide-react";

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
  const [sosActive, setSosActive] = useState(false);
  const [survivalMode, setSurvivalMode] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  
  const { value: contacts, setValue: setContacts, isLoading } = useLocalStorage<Contact[]>(
    "emergency_contacts",
    defaultContacts
  );

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

  const handleAddContact = (contact: Omit<Contact, "id">) => {
    setContacts([...contacts, { ...contact, id: Date.now().toString() }]);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const getSignalStrength = () => {
    if (!networkStatus.isOnline) return 0;
    const type = networkStatus.connectionType;
    if (type === "wifi") return 4;
    if (type === "4g") return 3;
    if (type === "3g") return 2;
    return 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background hexagon-bg">
      <Header sosActive={sosActive} />

      <main className="pb-24 space-y-6">
        {isNative && (
          <div className="mx-4 mt-2 bg-success/10 border border-success/30 rounded-lg px-3 py-1.5 text-xs text-success text-center">
            ✓ Native Mode Active
          </div>
        )}

        {/* SOS Section */}
        <section className="py-8 px-4 flex flex-col items-center">
          <SOSButton onActivate={handleSOSActivate} isActive={sosActive} />
        </section>

        <div className="section-divider" />

        {/* Quick Actions */}
        <FeatureSection>
          <QuickActions onNavigateToMap={() => setMapOpen(true)} onNavigateToContacts={() => document.getElementById("contacts-section")?.scrollIntoView({ behavior: "smooth" })} />
        </FeatureSection>

        {sosActive && (
          <FeatureSection variant="warning">
            <SMSStatus hasSent={smsSent} isOnline={networkStatus.isOnline} sosActive={sosActive} contactsCount={contacts.length} />
          </FeatureSection>
        )}

        {/* Weather Section */}
        <FeatureSection variant="highlight">
          <SectionHeader icon={Cloud} title="Weather Alerts" subtitle="Barometric storm detection" iconColor="text-accent" />
          <WeatherAlerts latitude={gpsData.latitude} longitude={gpsData.longitude} isOnline={networkStatus.isOnline} onStormAlert={() => toast.warning("⚠️ Storm approaching!")} />
        </FeatureSection>

        {/* Status Section */}
        <FeatureSection>
          <SectionHeader icon={Radio} title="System Status" subtitle="Network & power monitoring" />
          <div className="space-y-3">
            <BatteryStatus level={batteryStatus.level} isCharging={batteryStatus.isCharging} survivalModeActive={survivalMode} />
            <SignalStatus networkStatus={networkStatus.isOnline ? "online" : "offline"} signalStrength={getSignalStrength()} bluetoothEnabled={true} connectionType={networkStatus.connectionType} />
            <BluetoothMesh sosActive={sosActive} gpsData={{ latitude: gpsData.latitude, longitude: gpsData.longitude }} onRelaySuccess={() => toast.success("SOS relayed!")} />
          </div>
        </FeatureSection>

        {/* Location Section */}
        <FeatureSection>
          <SectionHeader icon={MapPin} title="Location Tracking" subtitle="GPS & navigation data" iconColor="text-primary" />
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <GPSDisplay latitude={gpsData.latitude} longitude={gpsData.longitude} accuracy={gpsData.accuracy} timestamp={gpsData.timestamp} heading={gpsData.heading} />
          </div>
        </FeatureSection>

        {/* Safety Section */}
        <FeatureSection variant="success">
          <SectionHeader icon={Activity} title="Safety Monitoring" subtitle="AI path & fall detection" iconColor="text-success" />
          <div className="space-y-3">
            <PathDetection latitude={gpsData.latitude} longitude={gpsData.longitude} accuracy={gpsData.accuracy} heading={gpsData.heading} onSOSTrigger={handleSOSActivate} />
            <FallDetection onSOSTrigger={handleSOSActivate} />
          </div>
        </FeatureSection>

        {/* Tools Section */}
        <FeatureSection>
          <SectionHeader icon={Wrench} title="Survival Tools" subtitle="Essential utilities" />
          <SurvivalTools />
        </FeatureSection>

        {/* Contacts Section */}
        <FeatureSection>
          <div id="contacts-section">
            <SectionHeader icon={Users} title="Emergency Contacts" subtitle="Quick access to help" iconColor="text-warning" />
            <EmergencyContacts contacts={contacts} onAddContact={handleAddContact} onRemoveContact={handleRemoveContact} />
          </div>
        </FeatureSection>

        {!networkStatus.isOnline && (
          <div className="fixed bottom-4 left-4 right-4 bg-warning/20 border border-warning/30 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-sm text-warning text-center font-medium">📡 Offline Mode - All features active</p>
          </div>
        )}
      </main>

      <OfflineMap latitude={gpsData.latitude} longitude={gpsData.longitude} heading={gpsData.heading} isOpen={mapOpen} onClose={() => setMapOpen(false)} sosActive={sosActive} />

      {sosActive && <SOSActiveOverlay latitude={gpsData.latitude} longitude={gpsData.longitude} onDeactivate={handleSOSDeactivate} contactsCount={contacts.length} />}
    </div>
  );
};

export default Index;
