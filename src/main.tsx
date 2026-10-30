/** Точка входа: i18next, тема, настройки и история вокруг приложения. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import './styles/index.css';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { SettingsProvider } from './hooks/useSettings';
import { HistoryProvider } from './hooks/useHistory';

const container = document.getElementById('root');
if (!container) throw new Error('Не найден корневой элемент #root');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <HistoryProvider>
          <App />
        </HistoryProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
