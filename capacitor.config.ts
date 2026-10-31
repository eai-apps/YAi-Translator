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
    // Экраны грузятся прямо с сайта: каждое обновление сайта сразу есть в приложении, без нового APK.
    // Новый APK нужен только при изменении нативной части (плагины, манифест) — см. public/version.json.
    url: 'https://yai-translator.pages.dev',
    androidScheme: 'https',
    // Нет интернета — показываем встроенную страницу public/offline.html.
    errorPath: 'offline.html',
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
