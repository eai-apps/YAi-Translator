/** Поле ввода: умлауты, голосовой ввод, озвучка, очистка и счётчик символов. */
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { IconClose, IconMic, IconVolume } from '../layout/icons';

const UMLAUTS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

interface SourcePanelProps {
  text: string;
  onChange: (value: string) => void;
  sourceLang: SourceLanguage;
  maxLength: number;
  speech: SpeechController;
}

export function SourcePanel({ text, onChange, sourceLang, maxLength, speech }: SourcePanelProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showUmlauts = sourceLang === 'auto' || sourceLang === 'de';

  // Вставляем букву в позицию курсора, а не в конец текста.
  const insertCharacter = (character: string) => {
    const element = textareaRef.current;
    if (!element) {
      onChange(text + character);
      return;
    }
    const start = element.selectionStart ?? text.length;
    const end = element.selectionEnd ?? start;
    onChange(text.slice(0, start) + character + text.slice(end));
    requestAnimationFrame(() => {
      element.focus();
      const position = start + character.length;
      element.setSelectionRange(position, position);
    });
  };

  const handleVoice = () => {
    speech.listen(sourceLang, (transcript) => {
      onChange(text.trim() ? `${text.trim()} ${transcript}` : transcript);
    });
  };

  const speechLanguage: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;
  const voiceError =
    speech.error === 'denied'
      ? t('translate.voiceDenied')
      : speech.error === 'unsupported'
        ? t('translate.voiceUnsupported')
        : speech.error
          ? t('translate.voiceDenied')
          : null;

  return (
    <Card className="flex flex-col p-3 sm:p-4">
      {showUmlauts ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-line pb-2">
          {UMLAUTS.map((character) => (
            <button
              key={character}
              type="button"
              onClick={() => insertCharacter(character)}
              className="h-7 w-7 rounded-lg bg-soft text-sm font-medium text-ink transition-colors hover:bg-accentSoft hover:text-accent"
            >
              {character}
            </button>
          ))}
        </div>
      ) : null}

      <label className="flex flex-1 flex-col">
        <span className="sr-only">{t('translate.placeholder')}</span>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={t('translate.placeholder')}
          rows={6}
          spellCheck
          className="min-h-[150px] w-full flex-1 resize-none bg-transparent px-1 py-3 text-base leading-relaxed text-ink outline-none placeholder:text-muted sm:min-h-[210px] sm:text-lg"
        />
      </label>

      {speech.listening ? (
        <p className="px-1 pb-1 text-xs font-medium text-danger" role="status">
          {t('translate.voiceListening')}
        </p>
      ) : null}
      {voiceError ? (
        <p className="px-1 pb-1 text-xs text-danger" role="alert">
          {voiceError}
        </p>
      ) : null}

      <div className="flex items-center gap-1.5 border-t border-line pt-2">
        <IconButton
          label={speech.listening ? t('common.stop') : t('translate.voice')}
          icon={<IconMic className="h-[18px] w-[18px]" />}
          active={speech.listening}
          onClick={handleVoice}
          className={cn(speech.listening && 'border-danger bg-danger text-white')}
        />
        <IconButton
          label={t('translate.speakSource')}
          icon={<IconVolume className="h-[18px] w-[18px]" />}
          onClick={() => speech.speak(text, speechLanguage, 'source')}
          disabled={!text.trim()}
          active={speech.speakingId === 'source'}
        />
        <span className="ml-auto text-[11px] tabular-nums text-muted">
          {t('translate.chars', { used: text.length, max: maxLength })}
        </span>
        <IconButton
          label={t('translate.clearInput')}
          icon={<IconClose className="h-[18px] w-[18px]" />}
          onClick={() => {
            onChange('');
            textareaRef.current?.focus();
          }}
          disabled={!text}
        />
      </div>
    </Card>
  );
}
