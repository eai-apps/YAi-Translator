/**
 * Выпадающий список переводчиков. Показываются только подключённые и включённые на сайте,
 * а Gemini и Groq — только если у человека есть свой личный ключ (общие ключи сайта тут не тратятся).
 */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CLASSIC_PROVIDERS } from '../../../shared/types';
import type { ProviderChoice } from '../../hooks/useTranslator';
import { PERSONAL_AI_CHOICES } from '../../hooks/useTranslator';
import { useAccount } from '../../hooks/useAccount';
import { useSiteProviders } from '../../hooks/useSiteProviders';
import { keyStateFor } from '../../lib/accountKeys';
import { providerLabel } from '../../lib/errors';

interface ProviderSelectProps {
  value: ProviderChoice;
  onChange: (next: ProviderChoice) => void;
}

export function ProviderSelect({ value, onChange }: ProviderSelectProps) {
  const { t } = useTranslation();
  const site = useSiteProviders();
  const { account } = useAccount();

  const options = useMemo<ProviderChoice[]>(() => {
    const classic = site ? CLASSIC_PROVIDERS.filter((id) => site[id]) : [];
    const personal = PERSONAL_AI_CHOICES.filter(
      (id) => (site ? site[id] !== false : true) && keyStateFor(id, account?.keys[id] ?? null).mask !== null,
    );
    return [...classic, ...personal];
  }, [site, account]);

  // Выбранный раньше переводчик выключили или ключ удалили — возвращаемся к «Авто».
  useEffect(() => {
    if (value !== 'auto' && site && !options.includes(value)) onChange('auto');
  }, [value, site, options, onChange]);

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <span>{t('translate.engine')}</span>
      <select
        className="h-8 rounded-lg border border-line bg-card px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        value={options.includes(value) ? value : 'auto'}
        onChange={(event) => onChange(event.target.value as ProviderChoice)}
      >
        <option value="auto">{t('translate.engineAuto')}</option>
        {options.map((id) => (
          <option key={id} value={id}>
            {PERSONAL_AI_CHOICES.includes(id as (typeof PERSONAL_AI_CHOICES)[number])
              ? t('translate.enginePersonal', { name: providerLabel(id) })
              : providerLabel(id)}
          </option>
        ))}
      </select>
    </label>
  );
}
