/** Строка языков и умлауты внутри карточки перевода (этап 8). */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { groupedLanguages } from '../../../shared/languages';
import { IconSwap } from '../layout/icons';

/** Буквы немецкого алфавита, которых нет на обычной клавиатуре телефона. */
export const UMLAUTS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

interface LanguageRowProps {
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  onSourceChange: (language: SourceLanguage) => void;
  onTargetChange: (language: LanguageCode) => void;
  onSwap: () => void;
  /** Вставить умлаут в позицию курсора. */
  onUmlaut?: (character: string) => void;
}

export function LanguageRow({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
  onUmlaut,
}: LanguageRowProps) {
  const { t } = useTranslation();
  const groups = useMemo(() => groupedLanguages(), []);
  const selectClass =
    'h-8 max-w-[9.5rem] cursor-pointer appearance-none rounded-lg bg-transparent px-1.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:bg-soft hover:text-ink focus:bg-soft sm:max-w-[12rem] sm:text-sm';

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <div className="flex items-center gap-1">
        <label className="min-w-0">
          <span className="sr-only">{t('translate.sourceLanguage')}</span>
          <select
            value={sourceLang}
            onChange={(event) => onSourceChange(event.target.value as SourceLanguage)}
            className={selectClass}
          >
            <option value="auto">{t('languages.auto')}</option>
            {(['pinned', 'other'] as const).map((group) => (
              <optgroup key={group} label={t(`languages.${group}`)}>
                {groups[group].map((language) => (
                  <option key={language.code} value={language.code}>
                    {t(`languages.${language.code}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onSwap}
          aria-label={t('translate.swap')}
          title={t('translate.swap')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-accent"
        >
          <IconSwap className="h-4 w-4" />
        </button>

        <label className="min-w-0">
          <span className="sr-only">{t('translate.targetLanguage')}</span>
          <select
            value={targetLang}
            onChange={(event) => onTargetChange(event.target.value as LanguageCode)}
            className={selectClass}
          >
            {(['pinned', 'other'] as const).map((group) => (
              <optgroup key={group} label={t(`languages.${group}`)}>
                {groups[group].map((language) => (
                  <option key={language.code} value={language.code}>
                    {t(`languages.${language.code}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {onUmlaut && (sourceLang === 'auto' || sourceLang === 'de') ? (
        <div className="flex flex-wrap items-center gap-0.5">
          {UMLAUTS.map((character) => (
            <button
              key={character}
              type="button"
              onClick={() => onUmlaut(character)}
              className="h-7 w-7 rounded-lg text-sm font-medium text-muted transition-colors hover:bg-accentSoft hover:text-accent"
            >
              {character}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
