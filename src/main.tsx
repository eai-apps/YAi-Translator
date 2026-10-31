/** Точка входа: i18next, тема, настройки, аккаунт и история вокруг приложения. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import './styles/index.css';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { SettingsProvider } from './hooks/useSettings';
import { AccountProvider } from './hooks/useAccount';
import { HistoryProvider } from './hooks/useHistory';
import { TranslateSettingsProvider } from './hooks/useTranslateSettings';
import { registerSW } from 'virtual:pwa-register';
import { storeBuild } from './config';

// Новая версия сайта применяется сама: офлайн-копия обновляется и страница перезагружается.
// В нативном приложении (Capacitor) service worker не используется: ассеты встроены в APK.
if (storeBuild() === 'web') {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => void registration.update().catch(() => undefined);
      // Проверяем обновления при возвращении на вкладку и раз в час.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.setInterval(check, 60 * 60 * 1000);
    },
  });
}

const container = document.getElementById('root');
if (!container) throw new Error('Не найден корневой элемент #root');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        {/* История знает об аккаунте: вошёл — синхронизируется с сервером. */}
        <AccountProvider>
          {/* Настройки перевода (этап 8): история спрашивает их при записи, экран перевода — при вводе. */}
          <TranslateSettingsProvider>
            <HistoryProvider>
              <App />
            </HistoryProvider>
          </TranslateSettingsProvider>
        </AccountProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
