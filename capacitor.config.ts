import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Конфигурация Capacitor для YAi Translator.
 * Поддерживает Android (включая Android TV) и iOS.
 *
 * Edge-to-edge (Android 15+ / targetSdk 36):
 *   StatusBar.overlaysWebView = true → WebView рисуется под статус-баром и навигацией.
 *   Компенсация отступов — через CSS env(safe-area-inset-*) во всех панелях.
 *   WindowCompat.setDecorFitsSystemWindows(false) в MainActivity.java.
 */
const config: CapacitorConfig = {
  appId: 'app.yai.translator',
  appName: 'YAi Translator',
  // Встроенная сборка dist/ (не server.url): запуск мгновенный, работает офлайн.
  // API-запросы идут на https://yai-translator.pages.dev (VITE_API_BASE при сборке).
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      // Фон совпадает с тёмной темой (по умолчанию).
      backgroundColor: '#0e1117',
      showSpinner: false,
    },
    StatusBar: {
      // true → WebView рисуется под статус-баром (edge-to-edge).
      // CSS компенсирует: env(safe-area-inset-top) в TopBar/AppShell.
      overlaysWebView: true,
      // Стиль иконок статус-бара устанавливается в AppPlatformBridge.tsx по теме.
      style: 'DEFAULT',
    },
    CapacitorUpdater: {
      // Только ручной режим (src/lib/liveUpdate.ts): без облака Capgo и без автоматических запросов к нему.
      autoUpdate: false,
      statsUrl: '',
      channelUrl: '',
      updateUrl: '',
    },
    Keyboard: {
      // Экран сжимается при появлении клавиатуры (не перекрывает поле ввода).
      resize: 'body',
      style: 'DEFAULT',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
