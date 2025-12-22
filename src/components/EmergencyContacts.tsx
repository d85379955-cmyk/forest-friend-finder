import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plus, Trash2, User, Shield, TreePine } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: "personal" | "police" | "forest";
}

interface EmergencyContactsProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, "id">) => void;
  onRemoveContact: (id: string) => void;
}

export const EmergencyContacts = ({ contacts, onAddContact, onRemoveContact }: EmergencyContactsProps) => {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newType, setNewType] = useState<Contact["type"]>("personal");

  const handleAdd = () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    onAddContact({ name: newName, phone: newPhone, type: newType });
    setNewName("");
    setNewPhone("");
    setShowForm(false);
    toast.success("Contact added");
  };

  const getTypeIcon = (type: Contact["type"]) => {
    switch (type) {
      case "police": return <Shield className="w-4 h-4 text-primary" />;
      case "forest": return <TreePine className="w-4 h-4 text-success" />;
      default: return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: Contact["type"]) => {
    switch (type) {
      case "police": return "Police";
      case "forest": return "Forest Dept";
      default: return "Personal";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg">Emergency Contacts</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-3 slide-up">
          <Input
            placeholder="Contact name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-background"
          />
          <Input
            placeholder="Phone number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            type="tel"
            className="bg-background"
          />
          <div className="flex gap-2">
            {(["personal", "police", "forest"] as const).map((type) => (
              <Button
                key={type}
                variant={newType === type ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setNewType(type)}
              >
                {getTypeIcon(type)}
                <span className="ml-1 text-xs">{getTypeLabel(type)}</span>
              </Button>
            ))}
          </div>
          <Button onClick={handleAdd} className="w-full" size="sm">
            Add Contact
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No emergency contacts yet
          </p>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
            >
              <div className="flex items-center gap-3">
                {getTypeIcon(contact.type)}
                <div>
                  <p className="text-sm font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveContact(contact.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
