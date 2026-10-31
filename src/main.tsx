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
import { registerSW } from 'virtual:pwa-register';

// Новая версия сайта применяется сама: офлайн-копия обновляется и страница перезагружается.
// Без этого браузер показывал старую версию до второго захода (старые надписи, «зависший» перевод).
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

const container = document.getElementById('root');
if (!container) throw new Error('Не найден корневой элемент #root');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        {/* История знает об аккаунте: вошёл — синхронизируется с сервером. */}
        <AccountProvider>
          <HistoryProvider>
            <App />
          </HistoryProvider>
        </AccountProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
