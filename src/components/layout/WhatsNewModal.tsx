/**
 * Окно «Что нового» (этап 20):
 * всплывает при первом входе после обновления сайта или приложения,
 * либо когда администратор опубликовал объявление о новых функциях.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { APP_VERSION, STORAGE_KEYS } from '../../config';
import { readStorage, writeStorage } from '../../lib/storage';
import { Button } from '../ui/Button';
import { IconSparkles } from './icons';

interface WhatsNewData {
  version: string;
  text: string;
}

export function WhatsNewModal() {
  const { t } = useTranslation();
  const [data, setData] = useState<WhatsNewData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .siteSettings()
      .then((settings) => {
        if (cancelled) return;
        const seen = readStorage<string>(STORAGE_KEYS.seenVersion, '');

        if (settings.whatsNew && settings.whatsNew.text) {
          if (seen !== settings.whatsNew.version) {
            setData(settings.whatsNew);
            setOpen(true);
          }
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    if (data) {
      writeStorage(STORAGE_KEYS.seenVersion, data.version || APP_VERSION);
    }
    setOpen(false);
  };

  if (!open || !data) return null;

  const lines = data.text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-2xl">
        <div className="flex items-center gap-2.5 text-accent">
          <IconSparkles className="h-6 w-6 shrink-0" />
          <h2 id="whats-new-title" className="text-base font-semibold text-ink">
            {t('whatsNew.title', { version: data.version })}
          </h2>
        </div>

        <div className="mt-3 max-h-72 overflow-y-auto space-y-2 text-xs leading-relaxed text-ink pr-1">
          {lines.map((line, idx) => (
            <p key={idx} className="flex items-start gap-2">
              <span className="text-accent font-bold">•</span>
              <span>{line.replace(/^[•\-*]\s*/, '')}</span>
            </p>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="primary" size="sm" onClick={handleDismiss}>
            {t('whatsNew.dismiss')}
          </Button>
        </div>
      </div>
    </div>
  );
}
