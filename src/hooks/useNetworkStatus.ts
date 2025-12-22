import { useState, useEffect } from "react";

interface NetworkStatus {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    effectiveType: null,
    downlink: null,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
      });
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", updateNetworkStatus);
    }

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      if (connection) {
        connection.removeEventListener("change", updateNetworkStatus);
      }
    };
  }, []);

  return status;
};
