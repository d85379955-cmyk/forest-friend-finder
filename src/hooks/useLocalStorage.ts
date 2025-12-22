import { useState, useEffect, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        if (isNative) {
          const { value } = await Preferences.get({ key });
          if (value !== null) {
            setStoredValue(JSON.parse(value));
          }
        } else {
          const item = localStorage.getItem(key);
          if (item !== null) {
            setStoredValue(JSON.parse(item));
          }
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, isNative]);

  // Save value
  const setValue = useCallback(async (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const serialized = JSON.stringify(valueToStore);

      if (isNative) {
        await Preferences.set({ key, value: serialized });
      } else {
        localStorage.setItem(key, serialized);
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }, [key, storedValue, isNative]);

  // Remove value
  const removeValue = useCallback(async () => {
    try {
      if (isNative) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }, [key, initialValue, isNative]);

  return { value: storedValue, setValue, removeValue, isLoading };
};
