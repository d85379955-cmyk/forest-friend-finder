import { useState, useCallback, useRef, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

// Flashlight functionality using torch API or native plugin
export const useNativeFlashlight = () => {
  const [isOn, setIsOn] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const sosIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if torch is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // On native, we'll assume flashlight is available
          setIsAvailable(true);
        } else {
          // On web, check for torch support via ImageCapture
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(d => d.kind === 'videoinput');
          setIsAvailable(hasCamera);
        }
      } catch {
        setIsAvailable(false);
      }
    };
    checkAvailability();
  }, []);

  const getTorchTrack = useCallback(async () => {
    if (trackRef.current) return trackRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        }
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      
      // Check if torch is supported
      const capabilities = track.getCapabilities() as any;
      if (!capabilities.torch) {
        console.warn('Torch not supported on this device');
        return null;
      }
      
      trackRef.current = track;
      return track;
    } catch (error) {
      console.error('Failed to get camera stream:', error);
      return null;
    }
  }, []);

  const turnOn = useCallback(async () => {
    try {
      const track = await getTorchTrack();
      if (track) {
        await track.applyConstraints({
          advanced: [{ torch: true } as any]
        });
        setIsOn(true);
        return true;
      }
    } catch (error) {
      console.error('Failed to turn on flashlight:', error);
    }
    return false;
  }, [getTorchTrack]);

  const turnOff = useCallback(async () => {
    try {
      if (trackRef.current) {
        await trackRef.current.applyConstraints({
          advanced: [{ torch: false } as any]
        });
        setIsOn(false);
        return true;
      }
    } catch (error) {
      console.error('Failed to turn off flashlight:', error);
    }
    return false;
  }, []);

  const toggle = useCallback(async () => {
    if (isOn) {
      return turnOff();
    } else {
      return turnOn();
    }
  }, [isOn, turnOn, turnOff]);

  // SOS Pattern: ... --- ... (short short short, long long long, short short short)
  const startSosPattern = useCallback(async () => {
    if (sosActive) return;
    setSosActive(true);

    const shortDuration = 200;
    const longDuration = 600;
    const pauseDuration = 200;
    const letterPause = 600;
    const wordPause = 1400;

    const pattern = [
      // S: ...
      shortDuration, pauseDuration,
      shortDuration, pauseDuration,
      shortDuration, letterPause,
      // O: ---
      longDuration, pauseDuration,
      longDuration, pauseDuration,
      longDuration, letterPause,
      // S: ...
      shortDuration, pauseDuration,
      shortDuration, pauseDuration,
      shortDuration, wordPause,
    ];

    let index = 0;
    let isBlinkOn = false;

    const blink = async () => {
      if (!sosActive && index !== 0) return;

      if (isBlinkOn) {
        await turnOff();
        isBlinkOn = false;
      } else {
        await turnOn();
        isBlinkOn = true;
      }

      const delay = pattern[index % pattern.length];
      index++;

      if (index >= pattern.length) {
        index = 0;
      }

      sosIntervalRef.current = setTimeout(blink, delay);
    };

    blink();
  }, [sosActive, turnOn, turnOff]);

  const stopSosPattern = useCallback(async () => {
    setSosActive(false);
    if (sosIntervalRef.current) {
      clearTimeout(sosIntervalRef.current);
      sosIntervalRef.current = null;
    }
    await turnOff();
  }, [turnOff]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sosIntervalRef.current) {
        clearTimeout(sosIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isOn,
    sosActive,
    isAvailable,
    toggle,
    turnOn,
    turnOff,
    startSosPattern,
    stopSosPattern,
  };
};
