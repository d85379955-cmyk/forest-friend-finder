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
import { useGPS } from "@/hooks/useGPS";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useBattery } from "@/hooks/useBattery";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: "personal" | "police" | "forest";
}

const Index = () => {
  const [sosActive, setSosActive] = useState(false);
  const [survivalMode, setSurvivalMode] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Emergency Services", phone: "112", type: "police" },
    { id: "2", name: "Forest Rescue", phone: "1800-XXX-XXXX", type: "forest" },
  ]);

  const gpsData = useGPS(true);
  const networkStatus = useNetworkStatus();
  const batteryStatus = useBattery();

  // Auto-activate survival mode on low battery
  useEffect(() => {
    if (batteryStatus.level <= 20 && !survivalMode) {
      setSurvivalMode(true);
      toast.warning("Battery Survival Mode Activated", {
        description: "Reducing power usage to extend battery life",
      });
    }
  }, [batteryStatus.level, survivalMode]);

  // Handle SOS activation
  const handleSOSActivate = () => {
    setSosActive(true);
    toast.error("🚨 SOS ACTIVATED", {
      description: "Emergency mode engaged. Monitoring for signal...",
      duration: 5000,
    });
  };

  // Handle SOS deactivation
  const handleSOSDeactivate = () => {
    setSosActive(false);
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

  // Calculate signal strength (mock)
  const signalStrength = networkStatus.isOnline ? 3 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header sosActive={sosActive} />

      <main className="pb-24">
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
          </div>

          {/* Signal Status */}
          <SignalStatus
            networkStatus={networkStatus.isOnline ? "online" : "offline"}
            signalStrength={signalStrength}
            bluetoothEnabled={true}
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
