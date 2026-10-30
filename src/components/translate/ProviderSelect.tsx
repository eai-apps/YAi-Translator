/** Выпадающий список: какой обычный переводчик использовать («Авто» — по очереди). */
import { useTranslation } from 'react-i18next';
import { CLASSIC_PROVIDERS } from '../../../shared/types';
import type { ProviderChoice } from '../../hooks/useTranslator';
import { providerLabel } from '../../lib/errors';

interface ProviderSelectProps {
  value: ProviderChoice;
  onChange: (next: ProviderChoice) => void;
}

export function ProviderSelect({ value, onChange }: ProviderSelectProps) {
  const { t } = useTranslation();
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <span>{t('translate.engine')}</span>
      <select
        className="h-8 rounded-lg border border-line bg-card px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        value={value}
        onChange={(event) => onChange(event.target.value as ProviderChoice)}
      >
        <option value="auto">{t('translate.engineAuto')}</option>
        {CLASSIC_PROVIDERS.map((id) => (
          <option key={id} value={id}>
            {providerLabel(id)}
          </option>
        ))}
      </select>
    </label>
  );
}
