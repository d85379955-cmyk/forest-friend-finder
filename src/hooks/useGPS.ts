import { useState, useEffect, useCallback } from "react";

interface GPSData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date | null;
  error: string | null;
}

export const useGPS = (enabled: boolean = true) => {
  const [gpsData, setGpsData] = useState<GPSData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setGpsData({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp),
      error: null,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "Unknown error";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
    }
    setGpsData(prev => ({ ...prev, error: errorMessage }));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (!navigator.geolocation) {
      setGpsData(prev => ({ ...prev, error: "Geolocation not supported" }));
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Watch for continuous updates
    const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, updatePosition, handleError]);

  return gpsData;
};
