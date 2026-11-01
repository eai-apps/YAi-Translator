/**
 * Поле ввода карточки перевода (этап 18, версия 0.20.0):
 * - Строка языков с равными долями 1fr auto 1fr и кнопкой ⇄ по центру.
 * - Проверка правописания LanguageTool (волнистая линия, подсказки, «Исправить всё»).
 * - Поле ввода без перекрывающих чипсов: кнопка «Вставить» вынесена вниз рядом с микрофоном.
 * - enterKeyHint="done", скрытие экранной клавиатуры по Enter и действиям.
 */
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Correction, LanguageCode, SourceLanguage, UiLanguage } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { ProviderChoice } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { useSuggestions } from '../../hooks/useSuggestions';
import { useAudioVoice } from '../../hooks/useAudioVoice';
import { useSpellCheck } from '../../hooks/useSpellCheck';
import { hideKeyboard } from '../../lib/keyboard';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { IconClose } from '../layout/icons';
import { recognizeTextFromImage } from '../../lib/ocr';
import { LanguageRow } from './LanguageRow';
import { SuggestionList } from './SuggestionList';
import { SpellCheckBar } from './SpellCheckBar';
import { SourceUnderlay } from './SourceUnderlay';
import { SourceActions } from './SourceActions';

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
  const { t, i18n } = useTranslation();
  const { text, onChange, sourceLang, speech } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlighted, setHighlighted] = useState(-1);

  const suggestions = useSuggestions(text, sourceLang, props.suggestionsEnabled);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const listOpen = focused && !dismissed && suggestions.length > 0;

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверка правописания LanguageTool
  const [dismissedSpell, setDismissedSpell] = useState(false);
  const uiLanguage = (i18n.language?.slice(0, 2) || 'ru') as UiLanguage;
  const { corrections, correctedText, clearCorrections } = useSpellCheck({
    text,
    sourceLang,
    uiLanguage,
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrProgress(0);
    try {
      const recognized = await recognizeTextFromImage(file, sourceLang, (p) => {
        setOcrProgress(Math.round(p.progress * 100));
      });
      if (recognized.trim()) {
        onChange(recognized.trim());
        setTimeout(() => props.onSubmit(), 200);
      }
    } catch (err) {
      console.error('OCR error:', err);
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
    setDismissedSpell(false);
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
    const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (props.enterToTranslate || touch) {
      event.preventDefault();
      props.onSubmit();
      void hideKeyboard();
    }
  };

  const handleApplySpellOne = (corr: Correction, replacement: string) => {
    if (corr.offset !== undefined && corr.length !== undefined && text.slice(corr.offset, corr.offset + corr.length) === corr.original) {
      onChange(text.slice(0, corr.offset) + replacement + text.slice(corr.offset + corr.length));
    } else if (corr.original && text.includes(corr.original)) {
      onChange(text.replace(corr.original, replacement));
    }
  };

  const speechLanguage: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;
  const voiceError = speech.error === 'unsupported' ? t('translate.voiceUnsupported') : speech.error ? t('translate.voiceDenied') : null;
  const hasText = text.trim().length > 0;
  const visibleCorrections = dismissedSpell ? [] : corrections;

  return (
    <Card className="flex flex-col p-3 sm:p-4">
      <LanguageRow
        sourceLang={sourceLang} targetLang={props.targetLang}
        onSourceChange={props.onSourceChange} onTargetChange={props.onTargetChange}
        onSwap={props.onSwap} onUmlaut={insertCharacter}
      />

      <div className="mt-1.5 border-t border-line pt-2">
        <div className="relative">
          {/* Волнистая подсветка ошибок под текстом */}
          <SourceUnderlay text={text} corrections={visibleCorrections} />

          <label className="flex flex-col">
            <span className="sr-only">{t('translate.placeholder')}</span>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onBeforeInput={(event) => {
                const native = event.nativeEvent as InputEvent;
                const touch = window.matchMedia?.('(pointer: coarse)').matches;
                if (touch && (native.inputType === 'insertLineBreak' || native.inputType === 'insertParagraph' || native.data === '\n')) {
                  event.preventDefault();
                  props.onSubmit();
                  void hideKeyboard();
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              maxLength={props.maxLength}
              placeholder={t('translate.placeholder')}
              rows={2}
              spellCheck={false}
              enterKeyHint="done"
              dir={sourceLang === 'auto' ? 'auto' : textDirection(sourceLang)}
              className="relative z-10 min-h-[64px] max-h-[420px] w-full resize-none overflow-y-auto bg-transparent py-2 pl-1 pr-10 text-lg leading-relaxed text-ink outline-none placeholder:text-muted sm:min-h-[80px] sm:text-xl"
            />
          </label>

          {hasText ? (
            <button
              type="button"
              aria-label={t('translate.clearInput')}
              title={t('translate.clearInput')}
              onClick={() => {
                onChange('');
                clearCorrections();
                textareaRef.current?.focus();
              }}
              className="absolute right-1 top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink active:scale-95"
            >
              <IconClose className="h-[18px] w-[18px]" />
            </button>
          ) : null}
        </div>

        {/* Панель найденных ошибок LanguageTool */}
        {!dismissedSpell && corrections.length > 0 ? (
          <SpellCheckBar
            corrections={corrections}
            correctedText={correctedText}
            onApplyAll={(next) => {
              onChange(next);
              clearCorrections();
            }}
            onApplyOne={handleApplySpellOne}
            onDismiss={() => setDismissedSpell(true)}
          />
        ) : null}

        {listOpen ? (
          <SuggestionList
            items={suggestions}
            highlighted={highlighted}
            onPick={acceptSuggestion}
            onHighlight={setHighlighted}
          />
        ) : null}

        {ocrLoading ? (
          <p className="flex items-center gap-1.5 px-1 pb-1 text-xs font-medium text-accent" role="status">
            <Spinner className="h-3 w-3" />
            {t('translate.ocrProgress')} {ocrProgress}%
          </p>
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

      {/* Скрытый input для фото */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <SourceActions
        text={text}
        speech={speech}
        speechLanguage={speechLanguage}
        providerChoice={props.providerChoice}
        onProviderChange={props.onProviderChange}
        aiLoading={props.aiLoading}
        onAskAi={props.onAskAi}
        onChange={onChange}
        ocrLoading={ocrLoading}
        ocrProgress={ocrProgress}
        onPhotoClick={() => fileInputRef.current?.click()}
        voiceRecording={voice.recording}
        voiceSeconds={voice.seconds}
        voiceTranscribing={voice.transcribing}
        onVoiceClick={handleVoice}
        enterToTranslate={props.enterToTranslate}
        maxLength={props.maxLength}
      />
    </Card>
  );
}
