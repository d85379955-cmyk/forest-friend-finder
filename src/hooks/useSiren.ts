import { useState, useRef, useCallback, useEffect } from "react";

export const useSiren = () => {
  const [isPlaying, setSiren] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSiren = useCallback(() => {
    if (isPlaying) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;

      // Create gain node for volume control
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = 0.5;
      gainNodeRef.current.connect(ctx.destination);

      // Create oscillator for siren sound
      oscillatorRef.current = ctx.createOscillator();
      oscillatorRef.current.type = 'sawtooth';
      oscillatorRef.current.frequency.value = 800;
      oscillatorRef.current.connect(gainNodeRef.current);
      oscillatorRef.current.start();

      setSiren(true);

      // Modulate frequency for siren effect
      let goingUp = true;
      intervalRef.current = setInterval(() => {
        if (!oscillatorRef.current) return;
        
        const currentFreq = oscillatorRef.current.frequency.value;
        
        if (goingUp) {
          oscillatorRef.current.frequency.value = Math.min(currentFreq + 20, 1200);
          if (currentFreq >= 1200) goingUp = false;
        } else {
          oscillatorRef.current.frequency.value = Math.max(currentFreq - 20, 600);
          if (currentFreq <= 600) goingUp = true;
        }
      }, 50);
    } catch (error) {
      console.error('Failed to start siren:', error);
    }
  }, [isPlaying]);

  const stopSiren = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {
        // Already stopped
      }
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setSiren(false);
  }, []);

  const toggleSiren = useCallback(() => {
    if (isPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  }, [isPlaying, startSiren, stopSiren]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, [stopSiren]);

  return {
    isPlaying,
    startSiren,
    stopSiren,
    toggleSiren,
  };
};
