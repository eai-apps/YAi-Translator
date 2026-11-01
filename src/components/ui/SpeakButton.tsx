/** Кнопка озвучки: повторное нажатие останавливает речь. */
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { cn } from '../../lib/cn';
import { IconVolume } from '../layout/icons';

interface SpeakButtonProps {
  text: string;
  language: LanguageCode;
  id: string;
  speech: SpeechController;
  audioUrl?: string;
  label?: string;
  className?: string;
}

export function SpeakButton({ text, language, id, speech, audioUrl, label, className }: SpeakButtonProps) {
  const { t } = useTranslation();
  const active = speech.speakingId === id;
  const title = active ? t('common.stop') : label ?? t('common.listen');

  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      aria-pressed={active}
      disabled={!text.trim()}
      onClick={() => speech.speak(text, language, id, audioUrl)}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
        active
          ? 'border-accent bg-accentSoft text-accent'
          : 'border-line bg-card text-muted hover:bg-soft hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    >
      <IconVolume className="h-[18px] w-[18px]" />
    </button>
  );
}
