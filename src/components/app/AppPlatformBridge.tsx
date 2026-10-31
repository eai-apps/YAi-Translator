import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ANDROID_VERSION_CODE, storeBuild } from '../../config';
import { useTheme } from '../../hooks/useTheme';
import { AppUpdateModal, type AppUpdateInfo } from './AppUpdateModal';

/**
 * Мост между нативной платформой (Capacitor Android / TV) и React-приложением:
 * - Скрытие сплэш-экрана после старта;
 * - Окрашивание системного статус-бара в тон выбранной темы;
 * - Обработка системной кнопки «Назад» Android / пульта TV;
 * - Проверка обновлений APK без магазина через version.json.
 */
export const AppPlatformBridge: React.FC = () => {
  const isAndroid = storeBuild() === 'android';
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);

  // Актуальные ссылки для обработчика кнопки «Назад»
  const locationRef = useRef(location);
  locationRef.current = location;
  const updateInfoRef = useRef(updateInfo);
  updateInfoRef.current = updateInfo;

  // 1. Скрытие сплэш-экрана при загрузке приложения
  useEffect(() => {
    if (!isAndroid) return;
    SplashScreen.hide().catch(() => undefined);
  }, [isAndroid]);

  // 2. Синхронизация стиля статус-бара с темой оформления
  useEffect(() => {
    if (!isAndroid) return;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    }).catch(() => undefined);

    StatusBar.setBackgroundColor({
      color: isDark ? '#0e1117' : '#f6f7fb',
    }).catch(() => undefined);
  }, [isAndroid, theme]);

  // 3. Обработка системной кнопки «Назад» (телефон и пульт Android TV)
  useEffect(() => {
    if (!isAndroid) return;

    const listenerPromise = CapApp.addListener('backButton', () => {
      // А) Если открыто модальное окно обновления — закрываем его (если не обязательное)
      if (updateInfoRef.current) {
        if (!updateInfoRef.current.required) {
          setUpdateInfo(null);
        }
        return;
      }

      // Б) Если на экране есть открытое модальное окно или меню — закрываем его через Escape
      const openDialog = document.querySelector('[role="dialog"]');
      if (openDialog) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      // В) Если пользователь не на главной странице — переходим назад в истории
      if (locationRef.current.pathname !== '/') {
        navigate(-1);
        return;
      }

      // Г) На главной странице — сворачиваем приложение
      CapApp.minimizeApp().catch(() => undefined);
    });

    return () => {
      listenerPromise.then((handle) => handle.remove()).catch(() => undefined);
    };
  }, [isAndroid, navigate]);

  // 4. Проверка обновлений APK через version.json на сервере
  useEffect(() => {
    if (!isAndroid) return;

    const checkUpdate = async () => {
      try {
        const res = await fetch(`https://yai-translator.pages.dev/version.json?_t=${Date.now()}`);
        if (!res.ok) return;
        const data = (await res.json()) as AppUpdateInfo;
        if (data && typeof data.versionCode === 'number' && data.versionCode > ANDROID_VERSION_CODE) {
          setUpdateInfo(data);
        }
      } catch (_err) {
        // При отсутствии интернета работаем тихо
      }
    };

    checkUpdate();
  }, [isAndroid]);

  if (!isAndroid || !updateInfo) {
    return null;
  }

  return <AppUpdateModal info={updateInfo} onDismiss={() => setUpdateInfo(null)} />;
};
