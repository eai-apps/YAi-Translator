/**
 * Секция «Тексты Что нового» в админке (этап 20):
 * управление показом окна новых функций для пользователей при обновлении сайта или приложения.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

interface AdminWhatsNewSectionProps {
  onError: (msg: string | null) => void;
  onSaved: () => void;
}

export function AdminWhatsNewSection({ onError, onSaved }: AdminWhatsNewSectionProps) {
  const { t } = useTranslation();
  const [whatsNew, setWhatsNew] = useState({
    enabled: false,
    version: '',
    ru: '',
    de: '',
    en: '',
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminSettings()
      .then((data) => {
        if (data.whatsNew) {
          setWhatsNew({
            enabled: Boolean(data.whatsNew.enabled),
            version: data.whatsNew.version || '',
            ru: data.whatsNew.ru || '',
            de: data.whatsNew.de || '',
            en: data.whatsNew.en || '',
          });
        }
      })
      .catch(() => onError(t('admin.loadError')));
  }, [onError, t]);

  const save = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await api.adminSaveSettings({ whatsNew });
      setNotice(t('admin.settings.saved'));
      onSaved();
    } catch {
      onError(t('admin.loadError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4">
      <SectionTitle>{t('admin.settings.whatsNewTitle')}</SectionTitle>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.settings.whatsNewHint')}</p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={whatsNew.enabled}
            onChange={(e) => setWhatsNew((prev) => ({ ...prev, enabled: e.target.checked }))}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          {t('admin.settings.whatsNewEnabled')}
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{t('admin.settings.whatsNewVersion')}:</span>
          <input
            type="text"
            value={whatsNew.version}
            onChange={(e) => setWhatsNew((prev) => ({ ...prev, version: e.target.value.slice(0, 30) }))}
            placeholder="0.22.0"
            className="h-9 w-28 rounded-lg border border-line bg-card px-2.5 text-xs text-ink"
          />
        </div>
      </div>

      {(['ru', 'de', 'en'] as const).map((lang) => (
        <label key={lang} className="mt-3 block text-xs text-muted">
          <span>
            {lang === 'ru'
              ? t('admin.settings.whatsNewRu')
              : lang === 'de'
                ? t('admin.settings.whatsNewDe')
                : t('admin.settings.whatsNewEn')}
          </span>
          <textarea
            value={whatsNew[lang]}
            onChange={(e) =>
              setWhatsNew((prev) => ({ ...prev, [lang]: e.target.value.slice(0, 4000) }))
            }
            rows={3}
            dir="auto"
            placeholder="• Новые возможности..."
            className="mt-1 w-full resize-none rounded-xl border border-line bg-card px-3 py-2 text-xs text-ink"
          />
        </label>
      ))}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" loading={busy} onClick={() => void save()}>
          {t('admin.settings.save')}
        </Button>
        {notice ? <span className="text-sm text-ink">{notice}</span> : null}
      </div>
    </Card>
  );
}
