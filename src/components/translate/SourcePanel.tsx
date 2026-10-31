/**
 * Поле ввода карточки перевода (этап 12):
 * - Строка языков с равными долями 1fr auto 1fr и кнопкой ⇄ по центру.
 * - Поле ввода без перекрывающих чипсов: кнопка «Вставить» вынесена вниз рядом с микрофоном.
 * - enterKeyHint="done", скрытие экранной клавиатуры по Enter и действиям.
 * - Неактивные кнопки (озвучка при пустом вводе) скрываются.
 */
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { ProviderChoice } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { useSuggestions } from '../../hooks/useSuggestions';
import { useAudioVoice } from '../../hooks/useAudioVoice';
import { hideKeyboard } from '../../lib/keyboard';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { Spinner } from '../ui/Spinner';
import { IconClose, IconMic, IconVolume } from '../layout/icons';
import { LanguageRow } from './LanguageRow';
import { ProviderPill } from './ProviderPill';
import { SuggestionList } from './SuggestionList';
import { PasteChip } from './PasteChip';

interface SourcePanelProps {
  text: string;
  onChange: (value: string) => void;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  onSourceChange: (language: SourceLanguage) => void;
  onTargetChange: (language: LanguageCode) => void;
  onSwap: () => void;
  maxLength: number;
  speech: SpeechController;
  suggestionsEnabled: boolean;
  enterToTranslate: boolean;
  onSubmit: () => void;
  providerChoice: ProviderChoice;
  onProviderChange: (next: ProviderChoice) => void;
  aiLoading: boolean;
  onAskAi: (aiModel?: string) => void;
}

export function SourcePanel(props: SourcePanelProps) {
  const { t } = useTranslation();
  const { text, onChange, sourceLang, speech } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlighted, setHighlighted] = useState(-1);

  const suggestions = useSuggestions(text, sourceLang, props.suggestionsEnabled);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const listOpen = focused && !dismissed && suggestions.length > 0;

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 420)}px`;
  }, [text]);

  const acceptedRef = useRef<string | null>(null);
  useEffect(() => {
    setHighlighted(-1);
    setDismissed(acceptedRef.current === text);
  }, [text]);

  const insertCharacter = (char: string) => {
    const el = textareaRef.current;
    if (!el) { onChange(text + char); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? start;
    onChange(text.slice(0, start) + char + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + char.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const acceptSuggestion = (value: string) => {
    acceptedRef.current = value;
    setDismissed(true);
    onChange(value);
    setHighlighted(-1);
    textareaRef.current?.focus();
  };

  const voice = useAudioVoice({
    speech,
    lang: sourceLang,
    onText: (transcript) => onChange(text.trim() ? `${text.trim()} ${transcript}` : transcript),
  });

  const handleVoice = () => {
    if (voice.recording) voice.stop();
    else if (speech.listening) speech.stopListening();
    else voice.start();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (listOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setHighlighted((prev) => (prev + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === 'Escape' && listOpen) {
      setHighlighted(-1); setDismissed(true); return;
    }
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (listOpen && highlighted >= 0) {
      event.preventDefault();
      acceptSuggestion(suggestions[Math.min(highlighted, suggestions.length - 1)]);
      void hideKeyboard();
      return;
    }
    if (props.enterToTranslate) {
      event.preventDefault();
      props.onSubmit();
      void hideKeyboard();
    }
  };

  const speechLanguage: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;
  const voiceError = speech.error === 'unsupported' ? t('translate.voiceUnsupported') : speech.error ? t('translate.voiceDenied') : null;
  const hasText = text.trim().length > 0;

  return (
    <Card className="flex flex-col p-3 sm:p-4">
      <LanguageRow
        sourceLang={sourceLang} targetLang={props.targetLang}
        onSourceChange={props.onSourceChange} onTargetChange={props.onTargetChange}
        onSwap={props.onSwap} onUmlaut={insertCharacter}
      />

      <div className="mt-1.5 border-t border-line pt-2">
        <div className="relative">
          <label className="flex flex-col">
            <span className="sr-only">{t('translate.placeholder')}</span>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              maxLength={props.maxLength}
              placeholder={t('translate.placeholder')}
              rows={2}
              spellCheck
              enterKeyHint="done"
              dir={sourceLang === 'auto' ? 'auto' : textDirection(sourceLang)}
              className="min-h-[64px] max-h-[420px] w-full resize-none overflow-y-auto bg-transparent py-2 pl-1 pr-10 text-lg leading-relaxed text-ink outline-none placeholder:text-muted sm:min-h-[80px] sm:text-xl"
            />
          </label>

          {/* Крестик «очистить» справа в поле (только если есть текст) */}
          {hasText ? (
            <button
              type="button"
              aria-label={t('translate.clearInput')}
              title={t('translate.clearInput')}
              onClick={() => {
                onChange('');
                textareaRef.current?.focus();
              }}
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink active:scale-95"
            >
              <IconClose className="h-[18px] w-[18px]" />
            </button>
          ) : null}
        </div>

        {listOpen ? (
          <SuggestionList
            items={suggestions}
            highlighted={highlighted}
            onPick={acceptSuggestion}
            onHighlight={setHighlighted}
          />
        ) : null}

        {voice.recording ? (
          <p className="flex items-center gap-1.5 px-1 pb-1 text-xs font-medium text-danger" role="status">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-danger" />
            {t('translate.voiceListening')} {voice.seconds}s / 30s
          </p>
        ) : speech.listening ? (
          <p className="px-1 pb-1 text-xs font-medium text-danger" role="status">
            {t('translate.voiceListening')}
          </p>
        ) : voice.transcribing ? (
          <p className="flex items-center gap-1.5 px-1 pb-1 text-xs font-medium text-muted" role="status">
            <Spinner className="h-3 w-3" />
            {t('common.loading')}
          </p>
        ) : null}
        {voiceError ? (
          <p className="px-1 pb-1 text-xs text-danger" role="alert">
            {voiceError}
          </p>
        ) : null}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
        {/* Озвучка ввода: скрыта, если поле пустое (пункт 8) */}
        {hasText ? (
          <IconButton
            label={t('translate.speakSource')}
            icon={<IconVolume className="h-[18px] w-[18px]" />}
            onClick={() => speech.speak(text, speechLanguage, 'source')}
            active={speech.speakingId === 'source'}
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
          {/* Кнопка «Вставить» рядом с микрофоном при пустом поле (пункт 7) */}
          {!hasText ? <PasteChip onPaste={onChange} /> : null}

          <button
            type="button"
            aria-label={voice.recording || speech.listening ? t('common.stop') : t('translate.voice')}
            title={voice.recording || speech.listening ? t('common.stop') : t('translate.voice')}
            onClick={handleVoice}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line px-2.5 text-xs font-medium transition-colors',
              (voice.recording || speech.listening)
                ? 'border-danger bg-danger text-white'
                : 'text-muted hover:bg-soft hover:text-ink',
            )}
          >
            {voice.transcribing ? (
              <Spinner className="h-4 w-4" />
            ) : voice.recording ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="tabular-nums font-mono">{voice.seconds}s</span>
              </>
            ) : (
              <IconMic className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>

        <span className="w-full text-right text-[11px] tabular-nums text-muted">
          {props.enterToTranslate ? `${t('translate.enterHint')} · ` : ''}
          {t('translate.chars', { used: text.length, max: props.maxLength })}
        </span>
      </div>
    </Card>
  );
}
