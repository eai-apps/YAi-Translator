/**
 * Строка переключения языков «Язык ввода ⇄ Язык перевода» (этап 12):
 * - Сетка grid 1fr auto 1fr: обе половины строго одинаковой ширины, кнопка ⇄ строго по центру.
 * - Текст названий языков центрирован, обычный регистр (не капсом).
 * - Нажатие на язык открывает красивую шторку LanguagePicker снизу с поиском и недавними.
 * - Строка умлаутов аккуратно располагается снизу.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { IconSwap } from '../layout/icons';
import { LanguagePicker } from './LanguagePicker';
import { hapticImpact } from '../../lib/haptics';

export const UMLAUTS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

interface LanguageRowProps {
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  onSourceChange: (language: SourceLanguage) => void;
  onTargetChange: (language: LanguageCode) => void;
  onSwap: () => void;
  /** Вставить умлаут в позицию курсора. */
  onUmlaut?: (character: string) => void;
  /** Недавно использованные языки (для шторки). */
  recentLangs?: LanguageCode[];
}

export function LanguageRow({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
  onUmlaut,
  recentLangs,
}: LanguageRowProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState<'source' | 'target' | null>(null);

  const sourceName = sourceLang === 'auto' ? t('languages.auto') : t(`languages.${sourceLang}`);
  const targetName = t(`languages.${targetLang}`);

  const handleSwap = () => {
    void hapticImpact();
    onSwap();
  };

  const handleOpenSource = () => {
    void hapticImpact();
    setPickerOpen('source');
  };

  const handleOpenTarget = () => {
    void hapticImpact();
    setPickerOpen('target');
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* ── Сетка 1fr auto 1fr: кнопка ⇄ ровно по центру ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2 w-full">
        {/* Исходный язык */}
        <button
          type="button"
          onClick={handleOpenSource}
          className="flex h-10 w-full items-center justify-center truncate rounded-xl bg-soft/70 px-3 text-center text-sm sm:text-base font-semibold text-ink transition-colors hover:bg-soft active:bg-soft focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={t('translate.sourceLanguage')}
        >
          <span className="truncate">{sourceName}</span>
        </button>

        {/* Кнопка ⇄ по центру */}
        <button
          type="button"
          onClick={handleSwap}
          aria-label={t('translate.swap')}
          title={t('translate.swap')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-soft hover:text-accent active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <IconSwap className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Целевой язык */}
        <button
          type="button"
          onClick={handleOpenTarget}
          className="flex h-10 w-full items-center justify-center truncate rounded-xl bg-soft/70 px-3 text-center text-sm sm:text-base font-semibold text-ink transition-colors hover:bg-soft active:bg-soft focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={t('translate.targetLanguage')}
        >
          <span className="truncate">{targetName}</span>
        </button>
      </div>

      {/* Умлауты (если немецкий язык) */}
      {onUmlaut && (sourceLang === 'auto' || sourceLang === 'de') ? (
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 pt-0.5">
          {UMLAUTS.map((character) => (
            <button
              key={character}
              type="button"
              onClick={() => {
                void hapticImpact();
                onUmlaut(character);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-medium text-muted transition-colors hover:bg-accentSoft hover:text-accent active:bg-accentSoft"
            >
              {character}
            </button>
          ))}
        </div>
      ) : null}

      {/* Шторка выбора языка */}
      <LanguagePicker
        open={pickerOpen === 'source'}
        onClose={() => setPickerOpen(null)}
        value={sourceLang}
        onChange={(v) => onSourceChange(v as SourceLanguage)}
        isSource
        recent={recentLangs}
      />
      <LanguagePicker
        open={pickerOpen === 'target'}
        onClose={() => setPickerOpen(null)}
        value={targetLang}
        onChange={(v) => onTargetChange(v as LanguageCode)}
        recent={recentLangs}
      />
    </div>
  );
}
