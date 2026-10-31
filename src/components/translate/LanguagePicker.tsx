/**
 * Шторка выбора языка снизу (bottom sheet) — замена нативного <select> на Android.
 * Показывает «Определить язык» (только для исходного), «Недавние», закреплённые и все остальные.
 * Текущий язык отмечен галочкой. Строки крупные, без CAPS LOCK.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { LANGUAGES, PINNED_LANGUAGE_CODES } from '../../../shared/languages';
import { cn } from '../../lib/cn';
import { IconCheck, IconSearch, IconClose } from '../layout/icons';

interface LanguagePickerProps {
  /** Открыта ли шторка. */
  open: boolean;
  onClose: () => void;
  /** Выбранное значение (включая 'auto' для isSource). */
  value: SourceLanguage | LanguageCode;
  onChange: (value: SourceLanguage | LanguageCode) => void;
  /** Показывать ли опцию «Определить язык». */
  isSource?: boolean;
  /** Недавно использованные коды языков (первые 3 показываются отдельно). */
  recent?: LanguageCode[];
}

export function LanguagePicker({ open, onClose, value, onChange, isSource, recent }: LanguagePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Сброс поиска при открытии
  useEffect(() => {
    if (open) {
      setQuery('');
      // Небольшая задержка: шторка ещё анимируется
      const timer = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Все языки — отфильтрованные по запросу
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        t(`languages.${l.code}`).toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q),
    );
  }, [query, t]);

  const pinned = useMemo(
    () => filtered.filter((l) => PINNED_LANGUAGE_CODES.includes(l.code)),
    [filtered],
  );
  const other = useMemo(
    () => filtered.filter((l) => !PINNED_LANGUAGE_CODES.includes(l.code)),
    [filtered],
  );

  // Недавние (только если нет поиска)
  const recentLangs = useMemo(() => {
    if (query) return [];
    return (recent ?? [])
      .slice(0, 3)
      .map((code) => LANGUAGES.find((l) => l.code === code))
      .filter(Boolean) as typeof LANGUAGES;
  }, [recent, query]);

  const handleSelect = (lang: SourceLanguage | LanguageCode) => {
    onChange(lang);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Затемнение */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Шторка */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('translate.chooseLanguage')}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-card shadow-[0_-4px_30px_rgba(0,0,0,0.18)]',
          'animate-in slide-in-from-bottom duration-300',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Ручка */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* Заголовок и кнопка закрытия */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">{t('translate.chooseLanguage')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* Поле поиска */}
        <div className="relative mx-4 mb-3">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('translate.searchLanguage')}
            className="h-10 w-full rounded-xl bg-soft pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Список */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
          {/* «Определить язык» */}
          {isSource && !query && (
            <LangRow
              label={t('languages.auto')}
              note={t('translate.autoHint')}
              selected={value === 'auto'}
              onSelect={() => handleSelect('auto')}
            />
          )}

          {/* Недавние */}
          {recentLangs.length > 0 && (
            <>
              <SectionLabel label={t('translate.recentLanguages')} />
              {recentLangs.map((l) => (
                <LangRow
                  key={`r-${l.code}`}
                  label={t(`languages.${l.code}`)}
                  note={l.nativeName}
                  selected={value === l.code}
                  onSelect={() => handleSelect(l.code)}
                />
              ))}
            </>
          )}

          {/* Основные */}
          {pinned.length > 0 && (
            <>
              <SectionLabel label={t('languages.pinned')} />
              {pinned.map((l) => (
                <LangRow
                  key={l.code}
                  label={t(`languages.${l.code}`)}
                  note={l.nativeName}
                  selected={value === l.code}
                  onSelect={() => handleSelect(l.code)}
                />
              ))}
            </>
          )}

          {/* Остальные */}
          {other.length > 0 && (
            <>
              <SectionLabel label={t('languages.other')} />
              {other.map((l) => (
                <LangRow
                  key={l.code}
                  label={t(`languages.${l.code}`)}
                  note={l.nativeName}
                  selected={value === l.code}
                  onSelect={() => handleSelect(l.code)}
                />
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">{t('common.noResults')}</p>
          )}
        </div>
      </div>
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mt-2 mb-0.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
      {label}
    </p>
  );
}

function LangRow({
  label,
  note,
  selected,
  onSelect,
}: {
  label: string;
  note?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
        selected ? 'bg-accentSoft text-accent' : 'hover:bg-soft',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {note && note !== label && (
          <span className="block text-xs text-muted">{note}</span>
        )}
      </span>
      {selected && <IconCheck className="h-4 w-4 shrink-0 text-accent" />}
    </button>
  );
}
