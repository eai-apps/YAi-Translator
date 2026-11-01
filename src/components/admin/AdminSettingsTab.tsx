/** Вкладка «Настройки»: дневной лимит ИИ и баннер-объявление на ru/de/en. */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminSettings } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

interface SettingsTabProps {
  onError: (message: string | null) => void;
  /** После сохранения настроек нужно обновить «О приложении» и профиль. */
  onSaved: () => void;
}

export function AdminSettingsTab({ onError, onSaved }: SettingsTabProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [limitValue, setLimitValue] = useState('');
  const [useDefault, setUseDefault] = useState(false);
  const [guestAiLimit, setGuestAiLimit] = useState(5);
  const [registeredAiLimit, setRegisteredAiLimit] = useState(50);
  const [aiRequiresLogin, setAiRequiresLogin] = useState(false);
  const [wordCardAuto, setWordCardAuto] = useState(false);
  const [banner, setBanner] = useState({ enabled: false, ru: '', de: '', en: '' });
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.adminSettings();
      setSettings(data);
      setLimitValue(data.dailyLimit === null ? '' : String(data.dailyLimit));
      setUseDefault(data.dailyLimit === null);
      setGuestAiLimit(data.guestAiLimit ?? 5);
      setRegisteredAiLimit(data.registeredAiLimit ?? 50);
      setAiRequiresLogin(data.aiRequiresLogin ?? false);
      setWordCardAuto(data.wordCardAuto ?? false);
      setBanner(data.banner);
      setFeedbackEmail(data.feedbackEmail);
      onError(null);
    } catch {
      onError(t('admin.loadError'));
    }
  }, [onError, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setNotice(null);
    const parsed = Number(limitValue);
    if (!useDefault && (!Number.isFinite(parsed) || parsed < 1 || parsed > 10_000)) {
      setNotice(t('admin.settings.invalidLimit'));
      return;
    }
    setBusy(true);
    try {
      const saved = await api.adminSaveSettings({
        dailyLimit: useDefault ? null : parsed,
        banner,
        feedbackEmail: feedbackEmail.trim(),
        guestAiLimit,
        registeredAiLimit,
        aiRequiresLogin,
        wordCardAuto,
      });
      setSettings(saved);
      setNotice(t('admin.settings.saved'));
      onSaved();
    } catch {
      setNotice(t('admin.loadError'));
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionTitle>{t('admin.settings.limitLabel')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {t('admin.settings.limitHint', { value: settings.defaultDailyLimit })}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={1}
            max={10_000}
            value={limitValue}
            disabled={useDefault}
            onChange={(event) => setLimitValue(event.target.value)}
            placeholder={t('admin.settings.limitPlaceholder', { value: settings.defaultDailyLimit })}
            className="h-11 w-32 rounded-xl border border-line bg-card px-3 text-sm text-ink disabled:opacity-50"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useDefault}
              onChange={(event) => setUseDefault(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {t('admin.settings.limitUseDefault')}
          </label>
        </div>

        <div className="mt-4 border-t border-line pt-3 space-y-3">
          <p className="text-xs font-medium text-ink">{t('admin.settings.tierLimitsTitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">{t('admin.settings.guestLimit')}</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={guestAiLimit}
                onChange={(e) => setGuestAiLimit(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t('admin.settings.regLimit')}</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={registeredAiLimit}
                onChange={(e) => setRegisteredAiLimit(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={aiRequiresLogin}
              onChange={(e) => setAiRequiresLogin(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {t('admin.settings.aiRequiresLogin')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wordCardAuto}
              onChange={(e) => setWordCardAuto(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {t('admin.settings.wordCardAuto')}
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" loading={busy} onClick={() => void save()}>
            {t('admin.settings.save')}
          </Button>
          {notice ? <span className="text-sm text-ink">{notice}</span> : null}
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle>{t('admin.settings.bannerTitle')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.settings.bannerHint')}</p>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={banner.enabled}
            onChange={(event) => setBanner((previous) => ({ ...previous, enabled: event.target.checked }))}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          {t('admin.settings.bannerEnabled')}
        </label>

        {(['ru', 'de', 'en'] as const).map((lang) => (
          <label key={lang} className="mt-3 block text-xs text-muted">
            <span>
              {lang === 'ru'
                ? t('admin.settings.bannerRu')
                : lang === 'de'
                  ? t('admin.settings.bannerDe')
                  : t('admin.settings.bannerEn')}
            </span>
            <textarea
              value={banner[lang]}
              onChange={(event) =>
                setBanner((previous) => ({ ...previous, [lang]: event.target.value.slice(0, 280) }))
              }
              rows={2}
              dir="auto"
              className="mt-1 w-full resize-none rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink"
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

      {/* Почта для пункта «Обратная связь» в настройках (этап 8): пусто — пункт скрыт. */}
      <Card className="p-4">
        <SectionTitle>{t('admin.settings.feedbackTitle')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.settings.feedbackHint')}</p>
        <input
          type="email"
          value={feedbackEmail}
          onChange={(event) => setFeedbackEmail(event.target.value.slice(0, 120))}
          placeholder="name@example.com"
          dir="ltr"
          className="mt-2 h-11 w-full max-w-sm rounded-xl border border-line bg-card px-3 text-sm text-ink"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" loading={busy} onClick={() => void save()}>
            {t('admin.settings.save')}
          </Button>
          {notice ? <span className="text-sm text-ink">{notice}</span> : null}
        </div>
      </Card>
    </div>
  );
}
