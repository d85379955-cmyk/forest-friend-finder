import { useState, useEffect } from "react";

interface BatteryStatus {
  level: number;
  isCharging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

export const useBattery = () => {
  const [battery, setBattery] = useState<BatteryStatus>({
    level: 100,
    isCharging: false,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    const updateBattery = (batteryManager: any) => {
      setBattery({
        level: Math.round(batteryManager.level * 100),
        isCharging: batteryManager.charging,
        chargingTime: batteryManager.chargingTime,
        dischargingTime: batteryManager.dischargingTime,
      });
    };

    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((batteryManager: any) => {
        updateBattery(batteryManager);

        batteryManager.addEventListener("levelchange", () => updateBattery(batteryManager));
        batteryManager.addEventListener("chargingchange", () => updateBattery(batteryManager));
      });
    }
  }, []);

  return battery;
};
