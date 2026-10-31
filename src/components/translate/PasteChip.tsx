/**
 * Чипс быстрой вставки из буфера обмена для пустого поля ввода перевода.
 */
import { useTranslation } from 'react-i18next';

export function PasteChip({ onPaste }: { onPaste: (text: string) => void }) {
  const { t } = useTranslation();

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) onPaste(clip.trim());
    } catch {
      // Буфер обмена недоступен
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handlePaste()}
      className="absolute right-1 top-2 flex items-center gap-1 rounded-lg border border-line bg-soft px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
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
