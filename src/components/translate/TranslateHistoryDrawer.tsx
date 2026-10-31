/**
 * Боковая панель / шторка истории переводов на главном экране.
 * Поиск, список с HistoryRow, открытие перевода, удаление и очистка с подтверждением.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, type HistoryItem } from '../../hooks/useHistory';
import { HistoryRow } from '../dictionary/HistoryRow';
import { Button } from '../ui/Button';
import { IconClose, IconSearch, IconTrash } from '../layout/icons';

interface TranslateHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}

export function TranslateHistoryDrawer({ open, onClose, onSelect }: TranslateHistoryDrawerProps) {
  const { t } = useTranslation();
  const { items, toggleFavorite, removeItem, clearHistory } = useHistory();
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Сброс подтверждения при закрытии
  useEffect(() => {
    if (!open) {
      setConfirmClear(false);
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.text.toLowerCase().includes(q) || it.translation.toLowerCase().includes(q),
    );
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Затемнение фона */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Панель (на мобильных на весь экран или шторка, на ПК — 420px справа) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('translate.historyTitle')}
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-line bg-card shadow-2xl animate-fade-in"
      >
        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{t('translate.historyTitle')}</h2>
            <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-muted font-mono">
              {items.length}
            </span>
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink transition-colors"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* Поиск */}
        <div className="p-3 sm:px-5">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('dictionary.searchPlaceholder')}
              className="h-10 w-full rounded-xl border border-line bg-soft pl-9 pr-3 text-sm text-ink outline-none transition focus:border-accent"
              autoFocus
            />
          </div>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 sm:px-5">
          {filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted">
              <p className="text-sm">{query ? t('dictionary.searchEmpty') : t('dictionary.historyEmpty')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onOpen={() => {
                    onSelect(item);
                    onClose();
                  }}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Подвал с кнопкой очистки */}
        {items.length > 0 ? (
          <div className="border-t border-line p-3 sm:px-5">
            {confirmClear ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{t('dictionary.clearConfirm')}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      clearHistory();
                      setConfirmClear(false);
                    }}
                  >
                    {t('dictionary.clearHistory')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-muted hover:text-danger"
                icon={<IconTrash className="h-4 w-4" />}
                onClick={() => setConfirmClear(true)}
              >
                {t('dictionary.clearHistory')}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
