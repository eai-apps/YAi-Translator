/** История вопросов «Спросить у AI»: нажатие возвращает сохранённый ответ. */
import { useTranslation } from 'react-i18next';
import type { AskHistoryItem } from '../../hooks/useAskHistory';
import { Button } from '../ui/Button';
import { IconTrash } from '../layout/icons';

interface AskHistoryProps {
  items: AskHistoryItem[];
  activeQuestion: string | null;
  onSelect: (item: AskHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/** Дата и время для подписи: сегодня — только время, иначе дата и время. */
function formatTime(createdAt: number, locale: string): string {
  const date = new Date(createdAt);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return date.toLocaleString(locale, sameDay ? { timeStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' });
}

export function AskHistory({ items, activeQuestion, onSelect, onRemove, onClear }: AskHistoryProps) {
  const { t, i18n } = useTranslation();
  if (items.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted">{t('ask.historyTitle')}</h2>
        <Button size="sm" variant="ghost" onClick={onClear}>
          {t('ask.clearHistory')}
        </Button>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 py-2">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={
                activeQuestion === item.question
                  ? 'min-w-0 flex-1 rounded-lg text-left text-sm font-medium text-accent'
                  : 'min-w-0 flex-1 rounded-lg text-left text-sm hover:text-accent'
              }
            >
              <span className="block truncate">{item.question}</span>
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                {formatTime(item.createdAt, i18n.language)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={t('common.delete')}
              title={t('common.delete')}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-danger"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
