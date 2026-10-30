/** Выбор языков и кнопка обмена. */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { LANGUAGES } from '../../../shared/languages';
import { IconSwap } from '../layout/icons';

interface LanguageBarProps {
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  onSourceChange: (language: SourceLanguage) => void;
  onTargetChange: (language: LanguageCode) => void;
  onSwap: () => void;
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function LanguageBar({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
}: LanguageBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-2 shadow-card sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{t('translate.sourceLanguage')}</span>
        <select
          value={sourceLang}
          onChange={(event) => onSourceChange(event.target.value as SourceLanguage)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl bg-transparent pl-3 pr-9 text-sm font-medium text-ink focus:bg-soft"
        >
          <option value="auto">{t('languages.auto')}</option>
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.nativeName}
            </option>
          ))}
        </select>
        <Chevron />
      </label>

      <button
        type="button"
        onClick={onSwap}
        aria-label={t('translate.swap')}
        title={t('translate.swap')}
        className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-muted transition-colors hover:bg-soft hover:text-accent"
      >
        <IconSwap className="h-5 w-5" />
      </button>

      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{t('translate.targetLanguage')}</span>
        <select
          value={targetLang}
          onChange={(event) => onTargetChange(event.target.value as LanguageCode)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl bg-transparent pl-3 pr-9 text-sm font-medium text-ink focus:bg-soft"
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.nativeName}
            </option>
          ))}
        </select>
        <Chevron />
      </label>
    </div>
  );
}
