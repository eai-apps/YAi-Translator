/**
 * Панель найденных ошибок правописания с вариантами замены и «Исправить всё» (этап 18, версия 0.20.0).
 * Подпись: «Проверка: LanguageTool (LGPL)».
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Correction } from '../../../shared/types';
import { Button } from '../ui/Button';
import { IconAlert, IconCheck, IconClose } from '../layout/icons';

interface SpellCheckBarProps {
  corrections: Correction[];
  correctedText: string;
  onApplyAll: (newText: string) => void;
  onApplyOne: (correction: Correction, replacement: string) => void;
  onDismiss: () => void;
}

export function SpellCheckBar({
  corrections,
  correctedText,
  onApplyAll,
  onApplyOne,
  onDismiss,
}: SpellCheckBarProps) {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!corrections || corrections.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/60 p-2.5 text-xs text-ink dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-400">
          <IconAlert className="h-4 w-4 shrink-0" />
          <span>
            {t('check.foundErrors', { count: corrections.length, defaultValue: `${corrections.length} опечаток/ошибок` })}
          </span>
          <span className="text-[11px] text-muted font-normal">
            · {t('check.sourceAttribution', 'Проверка: LanguageTool (LGPL)')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="primary"
            icon={<IconCheck className="h-3.5 w-3.5" />}
            onClick={() => onApplyAll(correctedText)}
          >
            {t('check.fixAll', 'Исправить всё')}
          </Button>
          <button
            type="button"
            aria-label={t('common.close', 'Закрыть')}
            onClick={onDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Список ошибок в виде чипсов с выпадающим меню замен */}
      <div className="flex flex-wrap gap-1.5">
        {corrections.map((corr, idx) => {
          const isOpen = activeIdx === idx;
          const repls = corr.replacements && corr.replacements.length > 0 ? corr.replacements : [corr.corrected];

          return (
            <div key={idx} className="relative">
              <button
                type="button"
                onClick={() => setActiveIdx(isOpen ? null : idx)}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                  isOpen
                    ? 'bg-rose-600 text-white'
                    : 'border border-rose-300 bg-card text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/40'
                }`}
              >
                <span className="line-through opacity-70">{corr.original}</span>
                <span>→</span>
                <span className="underline decoration-wavy underline-offset-2">{corr.corrected || '...'}</span>
                <span className="text-[10px] opacity-75">▾</span>
              </button>

              {isOpen ? (
                <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-line bg-card p-2.5 shadow-lg text-ink">
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {corr.original}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveIdx(null)}
                      className="text-muted hover:text-ink"
                    >
                      <IconClose className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted leading-snug mb-2">{corr.explanation}</p>
                  <p className="text-[10px] uppercase font-semibold text-muted mb-1">
                    {t('check.replacementsTitle', 'Варианты исправления:')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {repls.map((rep, rIdx) => (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => {
                          onApplyOne(corr, rep);
                          setActiveIdx(null);
                        }}
                        className="rounded-lg bg-soft px-2 py-1 text-xs font-medium text-ink hover:bg-accent hover:text-accentInk transition-colors"
                      >
                        {rep}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
