/**
 * Кнопка быстрой вставки из буфера обмена (этап 12):
 * - Располагается под полем ввода рядом с микрофоном, не перекрывая текст подсказки.
 * - В приложении использует нативный буфер через @capacitor/clipboard.
 */
import { useTranslation } from 'react-i18next';
import { readClipboardText } from '../../lib/nativeClipboard';
import { hapticImpact } from '../../lib/haptics';

interface PasteChipProps {
  onPaste: (text: string) => void;
  className?: string;
}

export function PasteChip({ onPaste, className }: PasteChipProps) {
  const { t } = useTranslation();

  const handlePaste = async () => {
    void hapticImpact();
    const clip = await readClipboardText();
    if (clip.trim()) {
      onPaste(clip.trim());
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handlePaste()}
      className={
        className ??
        'flex h-9 items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink active:scale-95 focus-visible:ring-2 focus-visible:ring-accent'
      }
      title={t('translate.pasteFromClipboard')}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      </svg>
      <span>{t('translate.pasteChip')}</span>
    </button>
  );
}
