import { useState, useEffect, useCallback, useRef } from "react";
import { Geolocation, Position, PositionOptions } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

interface GPSData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date | null;
  error: string | null;
  isNative: boolean;
}

export const useNativeGPS = (enabled: boolean = true) => {
  const [gpsData, setGpsData] = useState<GPSData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    isNative: Capacitor.isNativePlatform(),
  });

  const watchIdRef = useRef<string | null>(null);

  const updatePosition = useCallback((position: Position) => {
    setGpsData({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp),
      error: null,
      isNative: Capacitor.isNativePlatform(),
    });
  }, []);

  const handleError = useCallback((error: any) => {
    let errorMessage = "Unknown error";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code) {
      switch (error.code) {
        case 1:
          errorMessage = "Location permission denied";
          break;
        case 2:
          errorMessage = "Location unavailable";
          break;
        case 3:
          errorMessage = "Location request timed out";
          break;
      }
    }
    setGpsData(prev => ({ ...prev, error: errorMessage }));
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Geolocation.requestPermissions();
        return permissions.location === 'granted';
      } catch (error) {
        console.error('Permission request failed:', error);
        return false;
      }
    }
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const startWatching = async () => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setGpsData(prev => ({ ...prev, error: "Location permission denied" }));
        return;
      }

      try {
        // Get initial position
        const position = await Geolocation.getCurrentPosition(options);
        updatePosition(position);

        // Start watching
        watchIdRef.current = await Geolocation.watchPosition(
          { ...options, maximumAge: 5000 },
          (position, err) => {
            if (err) {
              handleError(err);
            } else if (position) {
              updatePosition(position);
            }
          }
        );
      } catch (error) {
        handleError(error);
      }
    };

    startWatching();

    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }
    };
  }, [enabled, updatePosition, handleError, requestPermissions]);

  return gpsData;
};
