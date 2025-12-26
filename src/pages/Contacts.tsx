import { Users } from "lucide-react";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

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

export default function Contacts() {
  const { value: contacts, setValue: setContacts } = useLocalStorage<Contact[]>(
    "emergency_contacts",
    defaultContacts
  );

  const handleAddContact = (contact: Omit<Contact, "id">) => {
    setContacts([...contacts, { ...contact, id: Date.now().toString() }]);
    toast.success("Contact added");
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    toast.success("Contact removed");
  };

  return (
    <div className="min-h-screen bg-background hexagon-bg pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="p-2 rounded-xl bg-destructive/20">
            <Users className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Emergency Contacts</h1>
            <p className="text-xs text-muted-foreground">Quick access to help</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <EmergencyContacts
          contacts={contacts}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
        />

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Contact Tips</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>📞 <strong className="text-foreground">Emergency Services:</strong> Always keep 112/911 as first contact.</p>
            <p>🌲 <strong className="text-foreground">Forest Rescue:</strong> Add local ranger station numbers.</p>
            <p>👨‍👩‍👧 <strong className="text-foreground">Personal Contacts:</strong> Add family members who should be notified.</p>
            <p>📤 <strong className="text-foreground">Auto-SMS:</strong> All contacts receive your GPS location when SOS is triggered.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
