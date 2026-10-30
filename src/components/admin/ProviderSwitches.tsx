/**
 * Тумблеры «включён / выключен» для каждого переводчика и ИИ.
 * Выключенный сервис не используется ни в переводе, ни в «Как переводят другие».
 * Сохраняется сразу при нажатии.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { isAiProvider, providerLabel } from '../../lib/errors';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

const ORDER = ['gemini', 'groq', 'workersai', 'deepl', 'lara', 'microsoft', 'google', 'm2m100', 'mymemory'];

export function ProviderSwitches({ onError }: { onError: (message: string | null) => void }) {
  const { t } = useTranslation();
  const [disabled, setDisabled] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminSettings()
      .then((data) => setDisabled(data.disabledProviders ?? []))
      .catch(() => onError(t('admin.loadError')));
  }, [onError, t]);

  const toggle = async (id: string) => {
    if (!disabled) return;
    const next = disabled.includes(id) ? disabled.filter((item) => item !== id) : [...disabled, id];
    setBusy(id);
    try {
      const saved = await api.adminSaveSettings({ disabledProviders: next });
      setDisabled(saved.disabledProviders ?? next);
    } catch {
      onError(t('admin.loadError'));
    } finally {
      setBusy(null);
    }
  };

  if (!disabled) return null;

  return (
    <Card className="p-4">
      <SectionTitle>{t('admin.switches.title')}</SectionTitle>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.switches.hint')}</p>
      <ul className="mt-2 divide-y divide-line">
        {ORDER.map((id) => {
          const enabled = !disabled.includes(id);
          return (
            <li key={id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm">
                {providerLabel(id)}
                <span className="ml-2 rounded-full bg-soft px-1.5 py-0.5 text-[10px] text-muted">
                  {isAiProvider(id) ? t('admin.switches.ai') : t('admin.switches.translator')}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={providerLabel(id)}
                disabled={busy === id}
                onClick={() => void toggle(id)}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                  enabled ? 'bg-success' : 'bg-line',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    enabled ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
