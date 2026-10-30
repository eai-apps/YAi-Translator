/**
 * Баннер-объявление админа: текст на ru/de/en вверху сайта, закрывается крестиком.
 * Закрытый текст запоминается в localStorage, чтобы не показывать его снова.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteSettingsResponse } from '../../../shared/types';
import { api } from '../../api/client';
import { STORAGE_KEYS } from '../../config';
import { readStorage, writeStorage } from '../../lib/storage';
import { IconClose } from './icons';

export function AnnouncementBanner() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SiteSettingsResponse | null>(null);
  const [closed, setClosed] = useState(() => readStorage<string>(STORAGE_KEYS.bannerClosed, ''));

  useEffect(() => {
    const controller = new AbortController();
    api
      .siteSettings(controller.signal)
      .then((data) => setSettings(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const lang = i18n.language === 'de' || i18n.language === 'en' ? i18n.language : 'ru';
  const text = settings?.banner ? (settings.banner[lang] || settings.banner.en || settings.banner.ru).trim() : '';
  if (!text || text === closed) return null;

  return (
    <div className="border-b border-line bg-accentSoft">
      <div className="mx-auto flex w-full max-w-6xl items-start gap-2 px-4 py-2 text-sm text-accent sm:px-6 lg:px-10">
        <p className="min-w-0 flex-1 leading-relaxed">{text}</p>
        <button
          type="button"
          onClick={() => {
            writeStorage(STORAGE_KEYS.bannerClosed, text);
            setClosed(text);
          }}
          aria-label={t('common.close')}
          className="-mr-1 -mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-card/60"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
