import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c80f6696dc8c431da3c1c7d425ab1a87',
  appName: 'Forest Guardian',
  webDir: 'dist',
  server: {
    url: 'https://c80f6696-dc8c-431d-a3c1-c7d425ab1a87.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#10B981',
      sound: 'beep.wav'
    },
    Geolocation: {
      enableHighAccuracy: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
