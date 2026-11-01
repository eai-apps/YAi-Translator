import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Конфигурация Capacitor для YAi Translator.
 * Поддерживает Android (включая Android TV) и iOS.
 *
 * Edge-to-edge (Android 15+ / targetSdk 36):
 *   MainActivity.applySystemBarInsets() отодвигает весь экран от статус-бара, кнопок навигации
 *   и клавиатуры (padding). CSS env(safe-area-inset-*) в приложении при этом = 0.
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
    SystemBars: {
      // Отступы от статус-бара и кнопок навигации делает MainActivity (padding контейнера),
      // иначе в 0.14.0 нижнее меню оказывалось под кнопками «◀ ● ■».
      insetsHandling: 'disable',
    },
    CapacitorUpdater: {
      // Только ручной режим (src/lib/liveUpdate.ts): без облака Capgo и без автоматических запросов к нему.
      autoUpdate: false,
      statsUrl: '',
      channelUrl: '',
      updateUrl: '',
    },
    Keyboard: {
      // Отступ под клавиатуру делает MainActivity.applySystemBarInsets() (нативно, надёжно).
      resize: 'none',
      style: 'DEFAULT',
      resizeOnFullScreen: false,
    },
  },
};

export default config;
