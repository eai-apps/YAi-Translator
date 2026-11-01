/**
 * Нижняя панель действий поля ввода (озвучка, выбор переводчика, вставка, фото, микрофон).
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import type { ProviderChoice } from '../../hooks/useTranslator';
import { IconButton } from '../ui/IconButton';
import { Spinner } from '../ui/Spinner';
import { IconCamera, IconMic, IconVolume } from '../layout/icons';
import { cn } from '../../lib/cn';
import { ProviderPill } from './ProviderPill';
import { PasteChip } from './PasteChip';

interface SourceActionsProps {
  text: string;
  speech: SpeechController;
  speechLanguage: LanguageCode;
  providerChoice: ProviderChoice;
  onProviderChange: (next: ProviderChoice) => void;
  aiLoading: boolean;
  onAskAi: (aiModel?: string) => void;
  onChange: (value: string) => void;
  ocrLoading: boolean;
  ocrProgress: number;
  onPhotoClick: () => void;
  voiceRecording: boolean;
  voiceSeconds: number;
  voiceTranscribing: boolean;
  onVoiceClick: () => void;
  enterToTranslate: boolean;
  maxLength: number;
}

export function SourceActions(props: SourceActionsProps) {
  const { t } = useTranslation();
  const hasText = props.text.trim().length > 0;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
      {hasText ? (
        <IconButton
          label={t('translate.speakSource')}
          icon={<IconVolume className="h-[18px] w-[18px]" />}
          onClick={() => props.speech.speak(props.text, props.speechLanguage, 'source')}
          active={props.speech.speakingId === 'source'}
        />
      ) : null}

      <ProviderPill
        value={props.providerChoice}
        onChange={props.onProviderChange}
        aiLoading={props.aiLoading}
        onAskAi={props.onAskAi}
        hasText={hasText}
      />

      <div className="ml-auto flex items-center gap-1.5">
        {!hasText ? <PasteChip onPaste={props.onChange} /> : null}

        <button
          type="button"
          aria-label={t('translate.photo')}
          title={t('translate.photo')}
          onClick={props.onPhotoClick}
          disabled={props.ocrLoading}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line px-2.5 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink disabled:opacity-50"
        >
          {props.ocrLoading ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-accent">
              <Spinner className="h-3.5 w-3.5" />
              <span>{props.ocrProgress}%</span>
            </span>
          ) : (
            <IconCamera className="h-[18px] w-[18px]" />
          )}
        </button>

        <button
          type="button"
          aria-label={props.voiceRecording || props.speech.listening ? t('common.stop') : t('translate.voice')}
          title={props.voiceRecording || props.speech.listening ? t('common.stop') : t('translate.voice')}
          onClick={props.onVoiceClick}
          className={cn(
            'flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line px-2.5 text-xs font-medium transition-colors',
            (props.voiceRecording || props.speech.listening)
              ? 'border-danger bg-danger text-white'
              : 'text-muted hover:bg-soft hover:text-ink',
          )}
        >
          {props.voiceTranscribing ? (
            <Spinner className="h-4 w-4" />
          ) : props.voiceRecording ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="tabular-nums font-mono">{props.voiceSeconds}s</span>
            </>
          ) : (
            <IconMic className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      <span className="w-full text-right text-[11px] tabular-nums text-muted">
        {props.enterToTranslate ? `${t('translate.enterHint')} · ` : ''}
        {t('translate.chars', { used: props.text.length, max: props.maxLength })}
      </span>
    </div>
  );
}
