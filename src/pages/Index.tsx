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
import { useNativeGPS } from "@/hooks/useNativeGPS";
import { useNativeNetwork } from "@/hooks/useNativeNetwork";
import { useBattery } from "@/hooks/useBattery";
import { useNativeHaptics } from "@/hooks/useNativeHaptics";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

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
  
  const { value: contacts, setValue: setContacts, isLoading } = useLocalStorage<Contact[]>(
    "emergency_contacts",
    defaultContacts
  );

  const gpsData = useNativeGPS(true);
  const networkStatus = useNativeNetwork();
  const batteryStatus = useBattery();
  const haptics = useNativeHaptics();
  const notifications = useNativeNotifications();

  const isNative = Capacitor.isNativePlatform();

  // Auto-activate survival mode on low battery
  useEffect(() => {
    if (batteryStatus.level <= 20 && !survivalMode) {
      setSurvivalMode(true);
      haptics.notification();
      toast.warning("Battery Survival Mode Activated", {
        description: "Reducing power usage to extend battery life",
      });
    }
  }, [batteryStatus.level, survivalMode, haptics]);

  // Auto-trigger SOS when network becomes available
  useEffect(() => {
    if (sosActive && networkStatus.isOnline) {
      toast.success("📶 Signal Detected!", {
        description: "Attempting to send SOS messages...",
        duration: 5000,
      });
      haptics.notification();
    }
  }, [sosActive, networkStatus.isOnline, haptics]);

  // Handle SOS activation
  const handleSOSActivate = async () => {
    setSosActive(true);
    
    // Strong haptic feedback
    await haptics.vibrate(500);
    
    // Show persistent notification
    await notifications.sosNotification(gpsData.latitude, gpsData.longitude);
    
    toast.error("🚨 SOS ACTIVATED", {
      description: isNative 
        ? "Emergency mode engaged. Monitoring for signal..." 
        : "Emergency mode engaged. For full functionality, use the native app.",
      duration: 5000,
    });
  };

  // Handle SOS deactivation
  const handleSOSDeactivate = async () => {
    setSosActive(false);
    
    // Cancel SOS notification
    await notifications.cancelSosNotification();
    
    await haptics.notification();
    
    toast.success("SOS Deactivated", {
      description: "You have confirmed you are safe",
    });
  };

  // Add contact handler
  const handleAddContact = (contact: Omit<Contact, "id">) => {
    const newContact = { ...contact, id: Date.now().toString() };
    setContacts([...contacts, newContact]);
  };

  // Remove contact handler
  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    toast("Contact removed");
  };

  // Calculate signal strength based on connection type
  const getSignalStrength = () => {
    if (!networkStatus.isOnline) return 0;
    const type = networkStatus.connectionType;
    if (type === "wifi") return 4;
    if (type === "4g") return 3;
    if (type === "3g") return 2;
    if (type === "2g") return 1;
    return 2;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header sosActive={sosActive} />

      <main className="pb-24">
        {/* Platform indicator */}
        {isNative && (
          <div className="mx-4 mt-2 bg-safe/20 border border-safe/30 rounded-lg px-3 py-1.5 text-xs text-safe text-center">
            ✓ Native Mode Active - Full hardware access enabled
          </div>
        )}

        {/* SOS Section */}
        <section className="py-12 px-4 flex flex-col items-center">
          <SOSButton onActivate={handleSOSActivate} isActive={sosActive} />
        </section>

        {/* Quick Actions */}
        <section className="px-4 mb-6">
          <QuickActions
            onNavigateToMap={() => toast("Offline maps coming soon")}
            onNavigateToContacts={() => {
              document.getElementById("contacts-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </section>

        {/* Status Grid */}
        <section className="px-4 space-y-4">
          {/* Battery Status */}
          <BatteryStatus
            level={batteryStatus.level}
            isCharging={batteryStatus.isCharging}
            survivalModeActive={survivalMode}
          />

          {/* GPS Display */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <GPSDisplay
              latitude={gpsData.latitude}
              longitude={gpsData.longitude}
              accuracy={gpsData.accuracy}
              timestamp={gpsData.timestamp}
              heading={gpsData.heading}
            />
            {gpsData.isNative && (
              <p className="text-xs text-muted-foreground mt-2">
                Using native GPS for better accuracy
              </p>
            )}
          </div>

          {/* Signal Status */}
          <SignalStatus
            networkStatus={networkStatus.isOnline ? "online" : "offline"}
            signalStrength={getSignalStrength()}
            bluetoothEnabled={true}
            connectionType={networkStatus.connectionType}
          />

          {/* Survival Tools */}
          <SurvivalTools />

          {/* Emergency Contacts */}
          <div id="contacts-section">
            <EmergencyContacts
              contacts={contacts}
              onAddContact={handleAddContact}
              onRemoveContact={handleRemoveContact}
            />
          </div>
        </section>

        {/* Offline indicator */}
        {!networkStatus.isOnline && (
          <div className="fixed bottom-4 left-4 right-4 bg-warning/20 border border-warning/30 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-sm text-warning text-center font-medium">
              📡 Offline Mode - Data saved locally
            </p>
          </div>
        )}
      </main>

      {/* SOS Active Overlay */}
      {sosActive && (
        <SOSActiveOverlay
          latitude={gpsData.latitude}
          longitude={gpsData.longitude}
          onDeactivate={handleSOSDeactivate}
          contactsCount={contacts.length}
        />
      )}
    </div>
  );
};

export default Index;
