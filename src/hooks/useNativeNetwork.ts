import { useState, useEffect, useCallback } from "react";
import { Network, ConnectionStatus, ConnectionType } from "@capacitor/network";
import { Capacitor } from "@capacitor/core";

interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType | string;
  isNative: boolean;
}

export const useNativeNetwork = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: "unknown",
    isNative: Capacitor.isNativePlatform(),
  });

  const updateStatus = useCallback((connectionStatus: ConnectionStatus) => {
    setStatus({
      isOnline: connectionStatus.connected,
      connectionType: connectionStatus.connectionType,
      isNative: Capacitor.isNativePlatform(),
    });
  }, []);

  useEffect(() => {
    const initNetwork = async () => {
      try {
        const currentStatus = await Network.getStatus();
        updateStatus(currentStatus);
      } catch (error) {
        // Fallback to navigator.onLine for web
        setStatus({
          isOnline: navigator.onLine,
          connectionType: "unknown",
          isNative: false,
        });
      }
    };

    initNetwork();

    // Listen for network changes
    const listener = Network.addListener("networkStatusChange", updateStatus);

    // Fallback listeners for web
    const handleOnline = () => {
      if (!Capacitor.isNativePlatform()) {
        setStatus(prev => ({ ...prev, isOnline: true }));
      }
    };

    const handleOffline = () => {
      if (!Capacitor.isNativePlatform()) {
        setStatus(prev => ({ ...prev, isOnline: false }));
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      listener.then(l => l.remove());
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateStatus]);

  return status;
};
