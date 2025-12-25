import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";

interface FallDetectionState {
  isEnabled: boolean;
  fallDetected: boolean;
  inactivityDetected: boolean;
  lastMovement: Date | null;
  impactForce: number;
  countdownActive: boolean;
  countdownSeconds: number;
}

interface FallDetectionConfig {
  impactThreshold: number; // G-force threshold for fall detection
  inactivityMinutes: number; // Minutes of no movement before alert
  countdownSeconds: number; // Seconds to cancel before SOS triggers
}

const DEFAULT_CONFIG: FallDetectionConfig = {
  impactThreshold: 2.5, // 2.5G is typical fall impact
  inactivityMinutes: 15, // 15 minutes of no movement
  countdownSeconds: 30, // 30 seconds to cancel
};

// Calculate total acceleration magnitude
const calculateAccelerationMagnitude = (x: number, y: number, z: number): number => {
  return Math.sqrt(x * x + y * y + z * z) / 9.81; // Convert to G-force
};

export const useFallDetection = (
  onFallDetected: () => void,
  onInactivityDetected: () => void,
  enabled: boolean = true
) => {
  const [state, setState] = useState<FallDetectionState>({
    isEnabled: false,
    fallDetected: false,
    inactivityDetected: false,
    lastMovement: null,
    impactForce: 0,
    countdownActive: false,
    countdownSeconds: 0,
  });

  const { value: config, setValue: setConfig } = useLocalStorage<FallDetectionConfig>(
    "fall_detection_config",
    DEFAULT_CONFIG
  );

  const lastAccelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const movementHistoryRef = useRef<number[]>([]);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallConfirmationRef = useRef<NodeJS.Timeout | null>(null);

  // Cancel the countdown and reset fall detection
  const cancelAlert = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (fallConfirmationRef.current) {
      clearTimeout(fallConfirmationRef.current);
      fallConfirmationRef.current = null;
    }
    setState(prev => ({
      ...prev,
      fallDetected: false,
      inactivityDetected: false,
      countdownActive: false,
      countdownSeconds: 0,
      impactForce: 0,
    }));
  }, []);

  // Start countdown before triggering SOS
  const startCountdown = useCallback((type: "fall" | "inactivity", force: number = 0) => {
    setState(prev => ({
      ...prev,
      fallDetected: type === "fall",
      inactivityDetected: type === "inactivity",
      countdownActive: true,
      countdownSeconds: config.countdownSeconds,
      impactForce: force,
    }));

    let secondsLeft = config.countdownSeconds;

    countdownTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setState(prev => ({ ...prev, countdownSeconds: secondsLeft }));

      if (secondsLeft <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        // Trigger the appropriate callback
        if (type === "fall") {
          onFallDetected();
        } else {
          onInactivityDetected();
        }
        setState(prev => ({
          ...prev,
          countdownActive: false,
          countdownSeconds: 0,
        }));
      }
    }, 1000);
  }, [config.countdownSeconds, onFallDetected, onInactivityDetected]);

  // Detect fall pattern: high impact followed by no movement
  const detectFall = useCallback((accelerationMagnitude: number) => {
    // Add to movement history
    movementHistoryRef.current.push(accelerationMagnitude);
    if (movementHistoryRef.current.length > 20) {
      movementHistoryRef.current.shift();
    }

    // Check for high impact
    if (accelerationMagnitude > config.impactThreshold) {
      console.log(`⚠️ High impact detected: ${accelerationMagnitude.toFixed(2)}G`);
      
      // Wait a moment to confirm fall (no movement after impact)
      fallConfirmationRef.current = setTimeout(() => {
        const recentMovement = movementHistoryRef.current.slice(-5);
        const avgMovement = recentMovement.reduce((a, b) => a + b, 0) / recentMovement.length;
        
        // If movement dropped significantly after impact (person is still)
        if (avgMovement < 1.2) { // Close to 1G (gravity only = no movement)
          console.log("🚨 Fall confirmed - person appears to be still");
          if (!state.countdownActive) {
            startCountdown("fall", accelerationMagnitude);
          }
        }
      }, 2000); // Wait 2 seconds to confirm
    }

    // Update last movement time if significant movement detected
    if (accelerationMagnitude > 1.3) { // More than just gravity
      setState(prev => ({ ...prev, lastMovement: new Date() }));
      
      // Reset inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      inactivityTimerRef.current = setTimeout(() => {
        console.log("⚠️ Prolonged inactivity detected");
        if (!state.countdownActive) {
          startCountdown("inactivity");
        }
      }, config.inactivityMinutes * 60 * 1000);
    }
  }, [config.impactThreshold, config.inactivityMinutes, state.countdownActive, startCountdown]);

  // Handle device motion events
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
      return;
    }

    const { x, y, z } = acceleration;
    const magnitude = calculateAccelerationMagnitude(x, y, z);

    // Calculate change from last reading
    if (lastAccelRef.current) {
      const deltaX = x - lastAccelRef.current.x;
      const deltaY = y - lastAccelRef.current.y;
      const deltaZ = z - lastAccelRef.current.z;
      const deltaMagnitude = calculateAccelerationMagnitude(deltaX, deltaY, deltaZ);
      
      detectFall(magnitude + deltaMagnitude);
    }

    lastAccelRef.current = { x, y, z };
  }, [detectFall]);

  // Request permission and start listening
  const enableDetection = useCallback(async () => {
    try {
      // Check if DeviceMotion is available
      if (!("DeviceMotionEvent" in window)) {
        console.warn("DeviceMotion not supported");
        return false;
      }

      // Request permission on iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== "granted") {
          console.warn("Motion permission denied");
          return false;
        }
      }

      window.addEventListener("devicemotion", handleMotion);
      setState(prev => ({ 
        ...prev, 
        isEnabled: true,
        lastMovement: new Date(),
      }));

      // Start inactivity timer
      inactivityTimerRef.current = setTimeout(() => {
        if (!state.countdownActive) {
          startCountdown("inactivity");
        }
      }, config.inactivityMinutes * 60 * 1000);

      console.log("✅ Fall detection enabled");
      return true;
    } catch (error) {
      console.error("Failed to enable fall detection:", error);
      return false;
    }
  }, [handleMotion, config.inactivityMinutes, state.countdownActive, startCountdown]);

  // Disable detection
  const disableDetection = useCallback(() => {
    window.removeEventListener("devicemotion", handleMotion);
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (fallConfirmationRef.current) {
      clearTimeout(fallConfirmationRef.current);
      fallConfirmationRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isEnabled: false,
      fallDetected: false,
      inactivityDetected: false,
      countdownActive: false,
      countdownSeconds: 0,
    }));

    console.log("❌ Fall detection disabled");
  }, [handleMotion]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<FallDetectionConfig>) => {
    setConfig({ ...config, ...newConfig });
  }, [config, setConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableDetection();
    };
  }, []);

  // Auto-enable if enabled prop is true
  useEffect(() => {
    if (enabled && !state.isEnabled) {
      enableDetection();
    } else if (!enabled && state.isEnabled) {
      disableDetection();
    }
  }, [enabled]);

  return {
    ...state,
    config,
    enableDetection,
    disableDetection,
    cancelAlert,
    updateConfig,
  };
};
