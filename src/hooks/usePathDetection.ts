import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";

interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

interface PathAnalysis {
  isLost: boolean;
  confidence: number;
  warning: "none" | "low" | "medium" | "high" | "critical";
  reason: string;
  suggestedAction: string;
  distanceFromPath: number;
  circlingDetected: boolean;
  stationaryTime: number;
  backtrackAvailable: boolean;
}

interface PathState {
  originalPath: GPSPoint[];
  currentPath: GPSPoint[];
  lastKnownGoodPosition: GPSPoint | null;
  deviationStartTime: number | null;
}

// Haversine formula for distance calculation (works offline)
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

// Calculate bearing between two points
const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

// Detect circling behavior (common when lost)
const detectCircling = (points: GPSPoint[]): boolean => {
  if (points.length < 10) return false;
  
  const recentPoints = points.slice(-20);
  let totalAngleChange = 0;
  
  for (let i = 2; i < recentPoints.length; i++) {
    const bearing1 = calculateBearing(
      recentPoints[i - 2].latitude,
      recentPoints[i - 2].longitude,
      recentPoints[i - 1].latitude,
      recentPoints[i - 1].longitude
    );
    const bearing2 = calculateBearing(
      recentPoints[i - 1].latitude,
      recentPoints[i - 1].longitude,
      recentPoints[i].latitude,
      recentPoints[i].longitude
    );
    
    let angleDiff = Math.abs(bearing2 - bearing1);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    totalAngleChange += angleDiff;
  }
  
  // If total angle change > 540° (1.5 full circles), likely circling
  return totalAngleChange > 540;
};

// Find minimum distance from current position to original path
const findMinDistanceToPath = (
  current: GPSPoint,
  path: GPSPoint[]
): number => {
  if (path.length === 0) return 0;
  
  let minDistance = Infinity;
  
  for (const point of path) {
    const distance = calculateDistance(
      current.latitude,
      current.longitude,
      point.latitude,
      point.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  return minDistance;
};

// Calculate speed from points
const calculateSpeed = (points: GPSPoint[]): number => {
  if (points.length < 2) return 0;
  
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  
  const distance = calculateDistance(
    prev.latitude,
    prev.longitude,
    last.latitude,
    last.longitude
  );
  const timeDiff = (last.timestamp - prev.timestamp) / 1000; // seconds
  
  if (timeDiff <= 0) return 0;
  return distance / timeDiff; // m/s
};

export const usePathDetection = (
  latitude: number | null,
  longitude: number | null,
  accuracy: number | null,
  enabled: boolean = true
) => {
  const [analysis, setAnalysis] = useState<PathAnalysis>({
    isLost: false,
    confidence: 0,
    warning: "none",
    reason: "Tracking your path...",
    suggestedAction: "Continue your journey",
    distanceFromPath: 0,
    circlingDetected: false,
    stationaryTime: 0,
    backtrackAvailable: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const lastPositionRef = useRef<GPSPoint | null>(null);
  const stationaryStartRef = useRef<number | null>(null);

  const { value: pathState, setValue: setPathState } = useLocalStorage<PathState>(
    "path_detection_state",
    {
      originalPath: [],
      currentPath: [],
      lastKnownGoodPosition: null,
      deviationStartTime: null,
    }
  );

  // Start recording a new path (when starting a journey)
  const startRecording = useCallback(() => {
    setPathState({
      originalPath: [],
      currentPath: [],
      lastKnownGoodPosition: null,
      deviationStartTime: null,
    });
    setIsRecording(true);
    stationaryStartRef.current = null;
  }, [setPathState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  // Mark current path as the "safe" path to return to
  const markSafePath = useCallback(() => {
    if (pathState.currentPath.length > 0) {
      setPathState({
        ...pathState,
        originalPath: [...pathState.currentPath],
        lastKnownGoodPosition: pathState.currentPath[pathState.currentPath.length - 1],
        deviationStartTime: null,
      });
    }
  }, [pathState, setPathState]);

  // Get directions back to path
  const getBacktrackDirections = useCallback((): {
    bearing: number;
    distance: number;
    targetPoint: GPSPoint | null;
  } => {
    if (!latitude || !longitude || !pathState.lastKnownGoodPosition) {
      return { bearing: 0, distance: 0, targetPoint: null };
    }

    const target = pathState.lastKnownGoodPosition;
    const bearing = calculateBearing(latitude, longitude, target.latitude, target.longitude);
    const distance = calculateDistance(latitude, longitude, target.latitude, target.longitude);

    return { bearing, distance, targetPoint: target };
  }, [latitude, longitude, pathState.lastKnownGoodPosition]);

  // Main analysis effect
  useEffect(() => {
    if (!enabled || latitude === null || longitude === null) return;

    const currentPoint: GPSPoint = {
      latitude,
      longitude,
      timestamp: Date.now(),
      accuracy: accuracy || 100,
    };

    // Update current path
    const newCurrentPath = [...pathState.currentPath, currentPoint].slice(-500); // Keep last 500 points
    
    // Update original path if recording
    let newOriginalPath = pathState.originalPath;
    if (isRecording && pathState.originalPath.length === 0) {
      newOriginalPath = [...newOriginalPath, currentPoint];
    } else if (isRecording) {
      newOriginalPath = [...newOriginalPath, currentPoint].slice(-500);
    }

    // Check for stationary behavior
    let stationaryTime = 0;
    if (lastPositionRef.current) {
      const distanceMoved = calculateDistance(
        lastPositionRef.current.latitude,
        lastPositionRef.current.longitude,
        latitude,
        longitude
      );
      
      if (distanceMoved < 5) { // Less than 5 meters
        if (!stationaryStartRef.current) {
          stationaryStartRef.current = Date.now();
        }
        stationaryTime = (Date.now() - stationaryStartRef.current) / 1000 / 60; // minutes
      } else {
        stationaryStartRef.current = null;
      }
    }
    lastPositionRef.current = currentPoint;

    // Analyze path
    const circling = detectCircling(newCurrentPath);
    const distanceFromPath = newOriginalPath.length > 0 
      ? findMinDistanceToPath(currentPoint, newOriginalPath)
      : 0;
    const speed = calculateSpeed(newCurrentPath);
    
    // Calculate confidence and warning level
    let confidence = 0;
    let isLost = false;
    let warning: PathAnalysis["warning"] = "none";
    let reason = "On track";
    let suggestedAction = "Continue your journey";

    // Factor 1: Distance from original path
    if (distanceFromPath > 500) {
      confidence += 40;
    } else if (distanceFromPath > 200) {
      confidence += 25;
    } else if (distanceFromPath > 100) {
      confidence += 15;
    }

    // Factor 2: Circling behavior
    if (circling) {
      confidence += 35;
      reason = "Circular movement pattern detected";
      suggestedAction = "Stop, take a deep breath, and use compass to orient";
    }

    // Factor 3: Stationary for too long
    if (stationaryTime > 10) {
      confidence += 20;
      reason = `Stationary for ${Math.round(stationaryTime)} minutes`;
      suggestedAction = "If injured, activate SOS. Otherwise, try to move to higher ground";
    } else if (stationaryTime > 5) {
      confidence += 10;
    }

    // Factor 4: Erratic speed changes (panic movement)
    if (speed > 2 && newCurrentPath.length > 5) { // Running speed
      const recentSpeeds: number[] = [];
      for (let i = newCurrentPath.length - 5; i < newCurrentPath.length; i++) {
        if (i > 0) {
          const s = calculateSpeed(newCurrentPath.slice(0, i + 1));
          recentSpeeds.push(s);
        }
      }
      const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
      const speedVariance = recentSpeeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / recentSpeeds.length;
      
      if (speedVariance > 1) {
        confidence += 15;
        reason = "Erratic movement detected";
        suggestedAction = "Slow down and assess your surroundings";
      }
    }

    // Determine warning level
    if (confidence >= 70) {
      warning = "critical";
      isLost = true;
      suggestedAction = "STOP! You appear to be lost. Use backtrack feature or activate SOS.";
    } else if (confidence >= 50) {
      warning = "high";
      isLost = true;
      reason = reason || "Significant deviation from path";
      suggestedAction = suggestedAction || "Consider retracing your steps";
    } else if (confidence >= 30) {
      warning = "medium";
      reason = reason || "Minor path deviation detected";
      suggestedAction = suggestedAction || "Check your bearings";
    } else if (confidence >= 15) {
      warning = "low";
      reason = reason || "Slight deviation";
      suggestedAction = suggestedAction || "Stay aware of surroundings";
    } else {
      reason = "Path looks normal";
      suggestedAction = "Continue your journey safely";
    }

    // Update state
    setAnalysis({
      isLost,
      confidence: Math.min(confidence, 100),
      warning,
      reason,
      suggestedAction,
      distanceFromPath,
      circlingDetected: circling,
      stationaryTime,
      backtrackAvailable: newOriginalPath.length > 0,
    });

    // Update path state
    const newDeviationStartTime = 
      distanceFromPath > 100 && !pathState.deviationStartTime 
        ? Date.now() 
        : distanceFromPath < 50 
          ? null 
          : pathState.deviationStartTime;

    const newLastKnownGoodPosition = 
      distanceFromPath < 50 
        ? currentPoint 
        : pathState.lastKnownGoodPosition;

    setPathState({
      originalPath: newOriginalPath,
      currentPath: newCurrentPath,
      lastKnownGoodPosition: newLastKnownGoodPosition,
      deviationStartTime: newDeviationStartTime,
    });

  }, [latitude, longitude, accuracy, enabled, isRecording]);

  // Clear all path data
  const clearPath = useCallback(() => {
    setPathState({
      originalPath: [],
      currentPath: [],
      lastKnownGoodPosition: null,
      deviationStartTime: null,
    });
    setAnalysis({
      isLost: false,
      confidence: 0,
      warning: "none",
      reason: "Path cleared",
      suggestedAction: "Start a new journey",
      distanceFromPath: 0,
      circlingDetected: false,
      stationaryTime: 0,
      backtrackAvailable: false,
    });
  }, [setPathState]);

  return {
    analysis,
    isRecording,
    pathPoints: pathState.currentPath.length,
    originalPathPoints: pathState.originalPath.length,
    startRecording,
    stopRecording,
    markSafePath,
    getBacktrackDirections,
    clearPath,
  };
};
