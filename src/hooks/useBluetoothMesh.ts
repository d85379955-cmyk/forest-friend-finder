import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";

export interface NearbyDevice {
  id: string;
  name: string;
  distance: "near" | "medium" | "far";
  hasSignal: boolean;
  sosActive: boolean;
  lastSeen: number;
  rssi?: number;
}

export interface SOSRelay {
  originDeviceId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  relayedAt: number;
  contactsToNotify: string[];
}

interface BluetoothMeshState {
  isAvailable: boolean;
  isScanning: boolean;
  isAdvertising: boolean;
  nearbyDevices: NearbyDevice[];
  pendingRelays: SOSRelay[];
  relayedCount: number;
  lastScanTime: number | null;
}

export const useBluetoothMesh = (sosActive: boolean = false, gpsData?: { latitude: number; longitude: number }) => {
  const [state, setState] = useState<BluetoothMeshState>({
    isAvailable: false,
    isScanning: false,
    isAdvertising: false,
    nearbyDevices: [],
    pendingRelays: [],
    relayedCount: 0,
    lastScanTime: null,
  });

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Check Bluetooth availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (isNative) {
        // In native mode, Bluetooth would be checked via a Capacitor plugin
        // For now, we assume it's available on native platforms
        setState(prev => ({ ...prev, isAvailable: true }));
      } else {
        // Check Web Bluetooth API availability
        const available = 'bluetooth' in navigator;
        setState(prev => ({ ...prev, isAvailable: available }));
      }
    };

    checkAvailability();
  }, [isNative]);

  // Simulate device discovery (in production, use actual Bluetooth scanning)
  const simulateDeviceDiscovery = useCallback(() => {
    // Simulate finding nearby devices with Forest Guardian app
    const simulatedDevices: NearbyDevice[] = [];
    
    // Random chance to find devices
    const deviceCount = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < deviceCount; i++) {
      const rssi = -40 - Math.floor(Math.random() * 60);
      simulatedDevices.push({
        id: `device_${Date.now()}_${i}`,
        name: `Guardian-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        distance: rssi > -50 ? "near" : rssi > -70 ? "medium" : "far",
        hasSignal: Math.random() > 0.6,
        sosActive: Math.random() > 0.9,
        lastSeen: Date.now(),
        rssi,
      });
    }

    return simulatedDevices;
  }, []);

  // Start scanning for nearby devices
  const startScanning = useCallback(async () => {
    if (!state.isAvailable) return;

    setState(prev => ({ ...prev, isScanning: true }));

    // Continuous scanning simulation
    scanIntervalRef.current = setInterval(() => {
      const newDevices = simulateDeviceDiscovery();
      
      setState(prev => {
        // Merge with existing devices, removing stale ones (older than 30 seconds)
        const now = Date.now();
        const existingDevices = prev.nearbyDevices.filter(
          d => now - d.lastSeen < 30000
        );
        
        // Add new devices, avoiding duplicates
        const mergedDevices = [...existingDevices];
        newDevices.forEach(newDevice => {
          const existingIndex = mergedDevices.findIndex(d => d.id === newDevice.id);
          if (existingIndex === -1) {
            mergedDevices.push(newDevice);
          } else {
            mergedDevices[existingIndex] = newDevice;
          }
        });

        return {
          ...prev,
          nearbyDevices: mergedDevices,
          lastScanTime: now,
        };
      });
    }, 5000);
  }, [state.isAvailable, simulateDeviceDiscovery]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  // Start advertising this device (make discoverable)
  const startAdvertising = useCallback(async () => {
    if (!state.isAvailable) return;
    
    // In production, this would use BLE advertising
    setState(prev => ({ ...prev, isAdvertising: true }));
  }, [state.isAvailable]);

  // Stop advertising
  const stopAdvertising = useCallback(() => {
    setState(prev => ({ ...prev, isAdvertising: false }));
  }, []);

  // Broadcast SOS to nearby devices
  const broadcastSOS = useCallback(async () => {
    if (!gpsData) return;

    const sosData: SOSRelay = {
      originDeviceId: `self_${Date.now()}`,
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      timestamp: Date.now(),
      relayedAt: 0,
      contactsToNotify: [],
    };

    // In production, this would broadcast via BLE
    setState(prev => ({
      ...prev,
      pendingRelays: [...prev.pendingRelays, sosData],
    }));

    return sosData;
  }, [gpsData]);

  // Relay an SOS from another device
  const relaySOS = useCallback(async (relay: SOSRelay) => {
    // In production, this would send the SOS via available network
    // when signal is detected
    
    setState(prev => ({
      ...prev,
      pendingRelays: prev.pendingRelays.filter(r => r.originDeviceId !== relay.originDeviceId),
      relayedCount: prev.relayedCount + 1,
    }));

    return true;
  }, []);

  // Auto-start scanning and advertising when SOS is active
  useEffect(() => {
    if (sosActive) {
      startScanning();
      startAdvertising();
    } else {
      stopScanning();
      stopAdvertising();
    }

    return () => {
      stopScanning();
      stopAdvertising();
    };
  }, [sosActive, startScanning, startAdvertising, stopScanning, stopAdvertising]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Get devices that can relay SOS (have signal)
  const getRelayCapableDevices = useCallback(() => {
    return state.nearbyDevices.filter(d => d.hasSignal);
  }, [state.nearbyDevices]);

  // Get devices in distress (SOS active)
  const getDistressedDevices = useCallback(() => {
    return state.nearbyDevices.filter(d => d.sosActive);
  }, [state.nearbyDevices]);

  return {
    ...state,
    startScanning,
    stopScanning,
    startAdvertising,
    stopAdvertising,
    broadcastSOS,
    relaySOS,
    getRelayCapableDevices,
    getDistressedDevices,
    isNative,
  };
};
