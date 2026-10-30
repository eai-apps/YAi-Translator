/** Быстрое переключение языка интерфейса. */
import { useTranslation } from 'react-i18next';
import type { UiLanguage } from '../../../shared/types';
import { cn } from '../../lib/cn';
import { useSettings } from '../../hooks/useSettings';

const LABELS: Record<UiLanguage, string> = { ru: 'RU', de: 'DE', en: 'EN' };
const LANGUAGES: UiLanguage[] = ['ru', 'de', 'en'];

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { uiLanguage, setUiLanguage } = useSettings();

  return (
    <div
      role="group"
      aria-label={t('profile.interfaceLanguage')}
      className={cn('inline-flex gap-0.5 rounded-xl border border-line bg-card p-0.5')}
    >
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => setUiLanguage(language)}
          aria-pressed={uiLanguage === language}
          className={cn(
            'rounded-lg px-2 py-1 text-[11px] font-semibold tracking-wide transition-colors',
            compact ? 'h-7' : 'h-8 px-3 text-xs',
            uiLanguage === language ? 'bg-accentSoft text-accent' : 'text-muted hover:text-ink',
          )}
        >
          {LABELS[language]}
        </button>
      ))}
    </div>
  );
}
