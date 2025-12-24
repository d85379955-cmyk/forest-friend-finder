import { useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: "personal" | "police" | "forest";
}

interface GPSData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

interface AutoSMSOptions {
  sosActive: boolean;
  isOnline: boolean;
  contacts: Contact[];
  gpsData: GPSData;
  onSmsSent?: (contact: Contact) => void;
  onSmsError?: (contact: Contact, error: string) => void;
}

export const useAutoSMS = ({
  sosActive,
  isOnline,
  contacts,
  gpsData,
  onSmsSent,
  onSmsError,
}: AutoSMSOptions) => {
  const hasSentRef = useRef(false);
  const lastSendAttemptRef = useRef<number>(0);

  // Generate emergency message
  const generateSOSMessage = useCallback((): string => {
    const timestamp = new Date().toLocaleString();
    const lat = gpsData.latitude?.toFixed(6) || "Unknown";
    const lng = gpsData.longitude?.toFixed(6) || "Unknown";
    const accuracy = gpsData.accuracy ? `±${Math.round(gpsData.accuracy)}m` : "Unknown";
    
    const googleMapsLink = gpsData.latitude && gpsData.longitude
      ? `https://maps.google.com/?q=${gpsData.latitude},${gpsData.longitude}`
      : "Location unavailable";

    return `🚨 FOREST GUARDIAN SOS ALERT 🚨

EMERGENCY! I need immediate rescue assistance.

📍 LOCATION:
Latitude: ${lat}
Longitude: ${lng}
Accuracy: ${accuracy}

🗺️ MAP LINK:
${googleMapsLink}

⏰ Time: ${timestamp}

This is an automated emergency message from Forest Guardian app.`;
  }, [gpsData]);

  // Send SMS via native platform
  const sendNativeSMS = useCallback(async (phone: string, message: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // For web, open SMS link
      const encodedMessage = encodeURIComponent(message);
      window.open(`sms:${phone}?body=${encodedMessage}`, "_blank");
      return true;
    }

    try {
      // Use intent-based SMS for Android
      const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
      return true;
    } catch (error) {
      console.error("SMS send error:", error);
      return false;
    }
  }, []);

  // Bulk send to all contacts
  const sendToAllContacts = useCallback(async () => {
    if (!sosActive || hasSentRef.current) return;
    
    const now = Date.now();
    // Prevent sending more than once per 60 seconds
    if (now - lastSendAttemptRef.current < 60000) return;
    
    lastSendAttemptRef.current = now;
    const message = generateSOSMessage();

    console.log("📤 Auto-SMS: Sending SOS to all contacts...");

    for (const contact of contacts) {
      try {
        const success = await sendNativeSMS(contact.phone, message);
        if (success) {
          console.log(`✅ SMS sent to ${contact.name}`);
          onSmsSent?.(contact);
        } else {
          console.log(`❌ SMS failed for ${contact.name}`);
          onSmsError?.(contact, "Failed to send");
        }
      } catch (error) {
        console.error(`SMS error for ${contact.name}:`, error);
        onSmsError?.(contact, String(error));
      }
    }

    hasSentRef.current = true;
  }, [sosActive, contacts, generateSOSMessage, sendNativeSMS, onSmsSent, onSmsError]);

  // Reset when SOS is deactivated
  useEffect(() => {
    if (!sosActive) {
      hasSentRef.current = false;
      lastSendAttemptRef.current = 0;
    }
  }, [sosActive]);

  // Auto-send when network becomes available during SOS
  useEffect(() => {
    if (sosActive && isOnline && !hasSentRef.current && contacts.length > 0) {
      // Small delay to ensure network is stable
      const timeout = setTimeout(() => {
        sendToAllContacts();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [sosActive, isOnline, contacts.length, sendToAllContacts]);

  return {
    sendToAllContacts,
    hasSent: hasSentRef.current,
    generateSOSMessage,
  };
};
