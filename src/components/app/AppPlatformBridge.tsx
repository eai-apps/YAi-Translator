import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { storeBuild } from '../../config';
import { APP_UPDATE_EVENT, checkAppUpdate } from '../../lib/appUpdate';
import { checkAndDownloadLiveUpdate } from '../../lib/liveUpdate';
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

  // 1. Скрытие сплэш-экрана и проверка обновления веб-бандла при запуске
  useEffect(() => {
    if (!isAndroid) return;
    SplashScreen.hide().catch(() => undefined);
    void checkAndDownloadLiveUpdate();
  }, [isAndroid]);

  // 2. Синхронизация стиля статус-бара с темой оформления
  // overlaysWebView: true (capacitor.config.ts) → WebView под статус-баром (edge-to-edge).
  // Здесь устанавливаем только цвет иконок (Style.Dark/Light), фон — прозрачный.
  useEffect(() => {
    if (!isAndroid) return;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Стиль иконок: светлые на тёмном фоне и наоборот.
    StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    }).catch(() => undefined);

    // Фон прозрачный: цвет страницы просвечивает (edge-to-edge).
    StatusBar.setBackgroundColor({
      color: isDark ? '#00000000' : '#00000000',
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
      // Окна (Modal) и меню (DropdownMenu) слушают keydown на document, поэтому Escape шлём туда.
      const openLayer = document.querySelector('[role="dialog"], [role="menu"]');
      if (openLayer) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      // В) Если пользователь не на главной странице — переходим назад в истории
      if (locationRef.current.pathname !== '/') {
        navigate(-1);
        return;
      }

      // Г) На главной странице: если в истории браузера есть предыдущий перевод — идём к нему
      const historyStep = ((window.history.state as { step?: number } | null)?.step ?? 0);
      if (historyStep > 0) {
        window.history.back();
        return;
      }

      // Д) Если предыдущего перевода нет — сворачиваем приложение
      CapApp.minimizeApp().catch(() => undefined);
    });

    return () => {
      listenerPromise.then((handle) => handle.remove()).catch(() => undefined);
    };
  }, [isAndroid, navigate]);

  // 4. Проверка обновлений APK при запуске (src/lib/appUpdate.ts) и по кнопке в профиле (событие).
  useEffect(() => {
    if (!isAndroid) return;
    void checkAppUpdate().then((check) => {
      if (check?.hasUpdate && check.latest) setUpdateInfo(check.latest);
    });
    const onRequest = (event: Event) => {
      const info = (event as CustomEvent<AppUpdateInfo>).detail;
      if (info) setUpdateInfo(info);
    };
    window.addEventListener(APP_UPDATE_EVENT, onRequest);
    return () => window.removeEventListener(APP_UPDATE_EVENT, onRequest);
  }, [isAndroid]);

  // 5. Текст из меню выделения Android (PROCESS_TEXT) или «Поделиться» (SEND) — см. MainActivity.java.
  // Java кладёт текст в window.__YAI_PENDING_SHARED_TEXT__ и шлёт событие «yaiSharedText»:
  // событие ловим, если приложение уже открыто; переменную читаем при старте.
  useEffect(() => {
    if (!isAndroid) return;
    const holder = window as unknown as { __YAI_PENDING_SHARED_TEXT__?: string | null };

    const handleText = (rawText: string | null | undefined) => {
      holder.__YAI_PENDING_SHARED_TEXT__ = null;
      const clean = (rawText ?? '').trim();
      if (!clean) return;
      // Экран перевода следит за адресом (useTranslationUrlSync) и сразу переводит ?q=.
      navigate(`/?q=${encodeURIComponent(clean)}`);
    };

    if (holder.__YAI_PENDING_SHARED_TEXT__) handleText(holder.__YAI_PENDING_SHARED_TEXT__);

    const onSharedText = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string }>).detail;
      const loose = event as unknown as { text?: string };
      handleText(detail?.text ?? loose.text ?? holder.__YAI_PENDING_SHARED_TEXT__);
    };

    window.addEventListener('yaiSharedText', onSharedText);
    return () => window.removeEventListener('yaiSharedText', onSharedText);
  }, [isAndroid, navigate]);

  if (!isAndroid || !updateInfo) {
    return null;
  }

  return <AppUpdateModal info={updateInfo} onDismiss={() => setUpdateInfo(null)} />;
};
