import { useCallback } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export const useNativeHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative) {
      // Fallback: try navigator.vibrate for web
      if ('vibrate' in navigator) {
        const duration = style === ImpactStyle.Light ? 10 : style === ImpactStyle.Medium ? 20 : 30;
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptic impact failed:', error);
    }
  }, [isNative]);

  const notification = useCallback(async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) {
      if ('vibrate' in navigator) {
        const pattern = type === NotificationType.Error ? [100, 50, 100] : 
                       type === NotificationType.Warning ? [50, 50, 50] : [50];
        navigator.vibrate(pattern);
      }
      return;
    }

    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.error('Haptic notification failed:', error);
    }
  }, [isNative]);

  const vibrate = useCallback(async (duration: number = 300) => {
    if (!isNative) {
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Haptic vibrate failed:', error);
    }
  }, [isNative]);

  const sosPattern = useCallback(async () => {
    // SOS pattern: short short short, long long long, short short short
    const pattern = [
      100, 100, 100, 100, 100, 300, // S: ...
      300, 100, 300, 100, 300, 300, // O: ---
      100, 100, 100, 100, 100, 500, // S: ...
    ];

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return {
    impact,
    notification,
    vibrate,
    sosPattern,
    isNative,
  };
};
