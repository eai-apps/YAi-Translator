/** Кнопка «Копировать» с коротким подтверждением. */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyText } from '../../lib/clipboard';
import { IconCopy, IconCheck } from '../layout/icons';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-sm font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
    >
      {copied ? <IconCheck className="h-4 w-4 text-success" /> : <IconCopy className="h-4 w-4" />}
      <span>{copied ? t('common.copied') : label ?? t('common.copy')}</span>
    </button>
  );
}
