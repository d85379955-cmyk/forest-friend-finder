import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useLocalStorage } from "./useLocalStorage";
import type { 
  BackgroundGeolocationPlugin, 
  Location, 
  CallbackError 
} from "@capacitor-community/background-geolocation";

// Register the plugin for native platforms
const BackgroundGeolocation = Capacitor.isNativePlatform() 
  ? registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation")
  : null;

interface LocationRecord {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  batteryLevel?: number;
  isMoving?: boolean;
}

interface BackgroundLocationState {
  isTracking: boolean;
  isAvailable: boolean;
  error: string | null;
  lastLocation: LocationRecord | null;
  totalDistance: number;
}

// Haversine formula for distance calculation
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useBackgroundLocation = () => {
  const isNative = Capacitor.isNativePlatform();
  
  const [state, setState] = useState<BackgroundLocationState>({
    isTracking: false,
    isAvailable: isNative && BackgroundGeolocation !== null,
    error: null,
    lastLocation: null,
    totalDistance: 0,
  });

  const { value: locationHistory, setValue: setLocationHistory } = useLocalStorage<LocationRecord[]>(
    "background_location_history",
    []
  );

  const { value: trackingEnabled, setValue: setTrackingEnabled } = useLocalStorage<boolean>(
    "background_tracking_enabled",
    false
  );

  const watcherIdRef = useRef<string | null>(null);

  // Start background location tracking
  const startTracking = useCallback(async () => {
    if (!BackgroundGeolocation) {
      setState((prev) => ({
        ...prev,
        error: "Background location not available on this platform",
      }));
      return false;
    }

    try {
      watcherIdRef.current = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Forest Guardian is tracking your location for safety",
          backgroundTitle: "Location Tracking Active",
          requestPermissions: true,
          stale: false,
          distanceFilter: 10, // Minimum distance (meters) between updates
        },
        (location?: Location, error?: CallbackError) => {
          if (error) {
            if (error.code === "NOT_AUTHORIZED") {
              setState((prev) => ({
                ...prev,
                error: "Location permission denied",
                isTracking: false,
              }));
            }
            return;
          }

          if (!location) return;

          const newRecord: LocationRecord = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: location.altitude,
            speed: location.speed,
            heading: location.bearing,
            timestamp: Date.now(),
            isMoving: (location.speed ?? 0) > 0.5,
          };

          // Calculate distance from last location
          setState((prev) => {
            let newDistance = prev.totalDistance;
            if (prev.lastLocation) {
              const dist = calculateDistance(
                prev.lastLocation.latitude,
                prev.lastLocation.longitude,
                newRecord.latitude,
                newRecord.longitude
              );
              if (dist > 5 && dist < 1000) {
                // Filter out GPS jumps
                newDistance += dist;
              }
            }

            return {
              ...prev,
              lastLocation: newRecord,
              totalDistance: newDistance,
            };
          });

          // Add to history (keep last 1000 records)
          setLocationHistory((prev) => {
            const updated = [...prev, newRecord];
            return updated.slice(-1000);
          });
        }
      );

      setState((prev) => ({ ...prev, isTracking: true, error: null }));
      setTrackingEnabled(true);
      return true;
    } catch (error) {
      console.error("Failed to start background location:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to start location tracking",
      }));
      return false;
    }
  }, [setLocationHistory, setTrackingEnabled]);

  // Stop background location tracking
  const stopTracking = useCallback(async () => {
    if (!BackgroundGeolocation || !watcherIdRef.current) return;

    try {
      await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
      watcherIdRef.current = null;
      setState((prev) => ({ ...prev, isTracking: false }));
      setTrackingEnabled(false);
    } catch (error) {
      console.error("Failed to stop background location:", error);
    }
  }, [setTrackingEnabled]);

  // Toggle tracking
  const toggleTracking = useCallback(async () => {
    if (state.isTracking) {
      await stopTracking();
    } else {
      await startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

  // Get location history for a time range
  const getHistoryForRange = useCallback(
    (startTime: number, endTime: number = Date.now()) => {
      return locationHistory.filter(
        (loc) => loc.timestamp >= startTime && loc.timestamp <= endTime
      );
    },
    [locationHistory]
  );

  // Clear location history
  const clearHistory = useCallback(() => {
    setLocationHistory([]);
    setState((prev) => ({ ...prev, totalDistance: 0 }));
  }, [setLocationHistory]);

  // Get rescue trail data (formatted for emergency services)
  const getRescueTrailData = useCallback(() => {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentHistory = locationHistory.filter(
      (loc) => loc.timestamp >= last24Hours
    );

    if (recentHistory.length === 0) return null;

    return {
      startPoint: recentHistory[0],
      endPoint: recentHistory[recentHistory.length - 1],
      totalPoints: recentHistory.length,
      trail: recentHistory.map((loc) => ({
        lat: loc.latitude.toFixed(6),
        lng: loc.longitude.toFixed(6),
        time: new Date(loc.timestamp).toISOString(),
        accuracy: Math.round(loc.accuracy),
      })),
      totalDistanceMeters: Math.round(state.totalDistance),
    };
  }, [locationHistory, state.totalDistance]);

  // Auto-resume tracking if it was enabled
  useEffect(() => {
    if (trackingEnabled && state.isAvailable && !state.isTracking) {
      startTracking();
    }
  }, [trackingEnabled, state.isAvailable, state.isTracking, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watcherIdRef.current && BackgroundGeolocation) {
        BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
      }
    };
  }, []);

  return {
    ...state,
    locationHistory,
    startTracking,
    stopTracking,
    toggleTracking,
    getHistoryForRange,
    clearHistory,
    getRescueTrailData,
    isNative,
  };
};
