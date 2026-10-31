/**
 * Поле ввода карточки перевода (этап 8, «как в Яндексе»): строка языков внутри карточки,
 * крупный текст с крестиком «очистить» справа, подсказки при наборе и нижняя панель действий:
 * 🔊 озвучить, пилюля режима, 🎤 микрофон.
 */
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import type { ProviderChoice } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { useSuggestions } from '../../hooks/useSuggestions';
import { cn } from '../../lib/cn';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { IconClose, IconMic, IconVolume } from '../layout/icons';
import { LanguageRow } from './LanguageRow';
import { ProviderPill } from './ProviderPill';
import { SuggestionList } from './SuggestionList';

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
  /** Настройки перевода: подсказки и Enter вместо перевода через 600 мс. */
  suggestionsEnabled: boolean;
  enterToTranslate: boolean;
  /** Enter в режиме «переводить по Enter». */
  onSubmit: () => void;
  providerChoice: ProviderChoice;
  onProviderChange: (next: ProviderChoice) => void;
  aiLoading: boolean;
  onAskAi: () => void;
}

export function SourcePanel(props: SourcePanelProps) {
  const { t } = useTranslation();
  const { text, onChange, sourceLang, speech } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // -1 — подсказка не подсвечена (Enter в этом случае просто переводит текст).
  const [highlighted, setHighlighted] = useState(-1);

  const suggestions = useSuggestions(text, sourceLang, props.suggestionsEnabled);
  // Подсказки — только пока человек печатает в поле; после выбора или ухода из поля прячутся.
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const listOpen = focused && !dismissed && suggestions.length > 0;

  // Новый текст — выбор подсказки снова с начала списка.
  const acceptedRef = useRef<string | null>(null);
  useEffect(() => {
    setHighlighted(-1);
    // Выбранную подсказку не показываем снова для того же слова.
    setDismissed(acceptedRef.current === text);
  }, [text]);

  /** Вставляем символ в позицию курсора, а не в конец текста. */
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

  const acceptSuggestion = (value: string) => {
    acceptedRef.current = value;
    setDismissed(true);
    onChange(value);
    setHighlighted(-1);
    textareaRef.current?.focus();
  };

  const handleVoice = () => {
    speech.listen(sourceLang, (transcript) => {
      onChange(text.trim() ? `${text.trim()} ${transcript}` : transcript);
    });
  };

  /** Enter: подсвеченная подсказка, перевод (в режиме «по Enter») или новая строка. */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (listOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setHighlighted((previous) => {
        const next = event.key === 'ArrowDown' ? previous + 1 : previous - 1;
        return (next + suggestions.length) % suggestions.length;
      });
      return;
    }
    if (event.key === 'Escape' && listOpen) {
      setHighlighted(-1);
      setDismissed(true);
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (listOpen && highlighted >= 0) {
      event.preventDefault();
      acceptSuggestion(suggestions[Math.min(highlighted, suggestions.length - 1)]);
      return;
    }
    if (props.enterToTranslate) {
      event.preventDefault();
      props.onSubmit();
    }
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
      <LanguageRow
        sourceLang={sourceLang}
        targetLang={props.targetLang}
        onSourceChange={props.onSourceChange}
        onTargetChange={props.onTargetChange}
        onSwap={props.onSwap}
        onUmlaut={insertCharacter}
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
              // Небольшая пауза: нажатие на подсказку успевает сработать до скрытия списка.
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              maxLength={props.maxLength}
              placeholder={t('translate.placeholder')}
              rows={5}
              spellCheck
              /* Арабский текст пишется справа налево; для остальных языков — обычное направление. */
              dir={sourceLang === 'auto' ? 'auto' : textDirection(sourceLang)}
              className="min-h-[130px] w-full resize-none bg-transparent py-2 pl-1 pr-10 text-lg leading-relaxed text-ink outline-none placeholder:text-muted sm:min-h-[190px] sm:text-xl"
            />
          </label>
          {/* Крестик «очистить» — справа в поле, как в Яндекс.Переводчике. */}
          {text ? (
            <button
              type="button"
              aria-label={t('translate.clearInput')}
              title={t('translate.clearInput')}
              onClick={() => {
                onChange('');
                textareaRef.current?.focus();
              }}
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink"
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
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
        <IconButton
          label={t('translate.speakSource')}
          icon={<IconVolume className="h-[18px] w-[18px]" />}
          onClick={() => speech.speak(text, speechLanguage, 'source')}
          disabled={!text.trim()}
          active={speech.speakingId === 'source'}
        />
        <ProviderPill
          value={props.providerChoice}
          onChange={props.onProviderChange}
          aiLoading={props.aiLoading}
          onAskAi={props.onAskAi}
          hasText={text.trim().length > 0}
        />
        <IconButton
          className={cn('ml-auto', speech.listening && 'border-danger bg-danger text-white')}
          label={speech.listening ? t('common.stop') : t('translate.voice')}
          icon={<IconMic className="h-[18px] w-[18px]" />}
          active={speech.listening}
          onClick={handleVoice}
        />
        <span className="w-full text-right text-[11px] tabular-nums text-muted">
          {props.enterToTranslate ? `${t('translate.enterHint')} · ` : ''}
          {t('translate.chars', { used: text.length, max: props.maxLength })}
        </span>
      </div>
    </Card>
  );
}
