import { useCallback } from "react";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export const useNativeNotifications = () => {
  const isNative = Capacitor.isNativePlatform();

  const requestPermissions = useCallback(async () => {
    if (!isNative) {
      // Web fallback
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }, [isNative]);

  const scheduleNotification = useCallback(async (options: {
    title: string;
    body: string;
    id?: number;
    ongoing?: boolean;
  }) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    if (!isNative) {
      // Web notification fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: '/favicon.ico',
          requireInteraction: options.ongoing,
        });
      }
      return;
    }

    try {
      const scheduleOptions: ScheduleOptions = {
        notifications: [{
          id: options.id || Date.now(),
          title: options.title,
          body: options.body,
          ongoing: options.ongoing,
          autoCancel: !options.ongoing,
        }]
      };

      await LocalNotifications.schedule(scheduleOptions);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }, [isNative, requestPermissions]);

  const cancelNotification = useCallback(async (id: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }, [isNative]);

  const sosNotification = useCallback(async (latitude?: number | null, longitude?: number | null) => {
    const body = latitude && longitude
      ? `Emergency SOS Active! Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : 'Emergency SOS Active! Attempting to get location...';

    await scheduleNotification({
      title: '🆘 SOS EMERGENCY',
      body,
      id: 999, // Fixed ID for SOS notification
      ongoing: true,
    });
  }, [scheduleNotification]);

  const cancelSosNotification = useCallback(async () => {
    await cancelNotification(999);
  }, [cancelNotification]);

  return {
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    sosNotification,
    cancelSosNotification,
    isNative,
  };
};
