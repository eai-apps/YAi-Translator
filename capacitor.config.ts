import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Конфигурация Capacitor для YAi Translator.
 * Поддерживает Android (включая Android TV) и iOS.
 */
const config: CapacitorConfig = {
  appId: 'app.yai.translator',
  appName: 'YAi Translator',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0e1117',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
