/**
 * Карточка перевода (этап 12):
 * - Свайп пальцем по карточке листает историю (карточка едет за пальцем с живым откликом).
 * - Нативное окно «Поделиться» через @capacitor/share.
 * - Скрытие клавиатуры при начале свайпа или прокрутке.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage, StudyCardInput, TranslateResponse } from '../../../shared/types';
import { getLanguage, textDirection } from '../../../shared/languages';
import type { TranslatorError } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { useSwipe } from '../../hooks/useSwipe';
import { hideKeyboard } from '../../lib/keyboard';
import { shareText } from '../../lib/nativeShare';
import { errorMessageKey, providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { CopyButton } from '../ui/CopyButton';
import { IconButton } from '../ui/IconButton';
import { Spinner } from '../ui/Spinner';
import { SpeakButton } from '../ui/SpeakButton';
import { ProExtras } from './ProExtras';
import { IconAlert, IconStar, IconTranslate } from '../layout/icons';
import { AddToStudyMenu } from '../study/AddToStudyMenu';
import { AlternativesList } from './AlternativesList';
import { CardMenu } from './CardMenu';
import type { ConnectedWordItem } from '../../hooks/useConnectedWords';
import { ConnectedWordsChips } from './ConnectedWordsChips';
import { InteractiveGermanText } from './InteractiveGermanText';

interface ResultPanelProps {
  result: TranslateResponse | null;
  loading: boolean;
  error: TranslatorError | null;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  detectedLang: LanguageCode | null;
  isFavorite: boolean;
  canFavorite: boolean;
  canUseTools: boolean;
  speech: SpeechController;
  onRetry: () => void;
  onOpenLimit: () => void;
  onExplain: () => void;
  onCheck: () => void;
  onToggleFavorite: () => void;
  studyInput?: StudyCardInput | null;
  others?: ReactNode;
  moreVariants?: string[];
  onPickVariant?: (value: string) => void;
  sourceText: string;
  onPrevHistory?: () => void;
  onNextHistory?: () => void;
  canPrevHistory?: boolean;
  canNextHistory?: boolean;
  historyCounter?: string | null;
  slideDirection?: 'left' | 'right' | null;
  onShareImage?: () => void;
  connectedWords?: ConnectedWordItem[];
  matchedWordsMap?: Map<string, ConnectedWordItem>;
  onSelectConnectedWord?: (item: ConnectedWordItem) => void;
}

export function ResultPanel(props: ResultPanelProps) {
  const { result, loading, error, sourceLang, targetLang, detectedLang, speech } = props;
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  // Свайп с живым следованием карточки за пальцем
  const { dragOffset, isDragging } = useSwipe(panelRef, {
    onSwipeLeft: props.onNextHistory,
    onSwipeRight: props.onPrevHistory,
  });

  // При начале жеста свайпа прячем экранную клавиатуру
  useEffect(() => {
    if (isDragging) {
      void hideKeyboard();
    }
  }, [isDragging]);

  const targetName = getLanguage(targetLang)?.nativeName ?? targetLang;
  const copyValue = result?.translatedText ?? '';
  const targetDir = textDirection(targetLang);

  const handleShare = async () => {
    if (!result) return;
    const text = props.sourceText.trim()
      ? `${props.sourceText}\n→ ${result.translatedText}`
      : result.translatedText;
    await shareText({
      title: t('common.appName'),
      text,
    });
  };

  return (
    <div ref={panelRef} className="group relative flex min-w-0 flex-col gap-3">
      <Card
        className={`relative flex min-h-[220px] flex-col p-4 sm:p-5 select-text ${
          result?.pro ? 'ring-1 ring-accent shadow-[0_0_0_4px_rgba(109,146,255,0.08)]' : ''
        }`}
      >
        {props.historyCounter ? (
          <div className="absolute right-3 top-3 z-10 rounded-full border border-line bg-card px-2.5 py-0.5 font-mono text-[11px] text-muted shadow-sm backdrop-blur-sm">
            {props.historyCounter}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">
            {detectedLang && sourceLang === 'auto'
              ? t('translate.autoDetected', { language: getLanguage(detectedLang)?.nativeName ?? detectedLang })
              : targetName}
          </span>
          <div className="flex items-center gap-2">
            {(props.canPrevHistory || props.canNextHistory) ? (
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  aria-label={t('translate.historyPrev')}
                  title={`${t('translate.historyPrev')} (Alt+←)`}
                  disabled={!props.canPrevHistory}
                  onClick={props.onPrevHistory}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-card text-xs text-muted hover:bg-soft hover:text-ink disabled:opacity-30 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label={t('translate.historyNext')}
                  title={`${t('translate.historyNext')} (Alt+→)`}
                  disabled={!props.canNextHistory}
                  onClick={props.onNextHistory}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-card text-xs text-muted hover:bg-soft hover:text-ink disabled:opacity-30 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  ›
                </button>
              </div>
            ) : null}
            {loading ? <Spinner className="text-muted" /> : null}
            {result ? <Badge tone="accent">{result.label ?? providerLabel(result.provider, result.model)}</Badge> : null}
          </div>
        </div>

        <div className="my-3 border-t border-line" />

        <div
          className={`flex-1 ${
            !isDragging
              ? `transition-all duration-200 ${
                  props.slideDirection === 'left'
                    ? '-translate-x-3 opacity-60'
                    : props.slideDirection === 'right'
                      ? 'translate-x-3 opacity-60'
                      : 'translate-x-0 opacity-100'
                }`
              : ''
          }`}
          style={
            isDragging
              ? {
                  transform: `translateX(${dragOffset}px)`,
                  opacity: Math.max(0.4, 1 - Math.abs(dragOffset) / 300),
                  transition: 'none',
                }
              : undefined
          }
          aria-live="polite"
        >
          {error ? (
            <div className="flex flex-col items-start justify-center gap-3 py-6">
              <div className="flex items-start gap-2 text-danger">
                <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-relaxed">{t(errorMessageKey(error.code))}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {error.code !== 'VALIDATION' ? (
                  <Button size="sm" onClick={props.onRetry}>
                    {t('common.retry')}
                  </Button>
                ) : null}
                {error.code === 'LIMIT_REACHED' ? (
                  <Button size="sm" variant="primary" onClick={props.onOpenLimit}>
                    {t('limit.title')}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : !result ? (
            loading ? (
              <div className="flex h-full items-center justify-center gap-2 py-10 text-sm text-muted">
                <Spinner />
                <span>{t('translate.loadingTitle')}</span>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">
                  <IconTranslate className="h-6 w-6" />
                </div>
                <p className="font-medium">{t('translate.emptyTitle')}</p>
                <p className="max-w-xs text-sm leading-relaxed text-muted">{t('translate.emptyText')}</p>
              </div>
            )
          ) : (
            <>
              <p
                dir={targetDir}
                className={`select-text whitespace-pre-wrap break-words text-xl leading-relaxed sm:text-2xl ${
                  targetDir === 'rtl' ? 'text-right' : ''
                }`}
              >
                {targetLang === 'de' && props.matchedWordsMap && props.onSelectConnectedWord ? (
                  <InteractiveGermanText
                    text={result.translatedText}
                    matchedWordsMap={props.matchedWordsMap}
                    onWordClick={props.onSelectConnectedWord}
                    dir={targetDir}
                  />
                ) : (
                  result.translatedText
                )}
              </p>
              <AlternativesList alternatives={result.alternatives} targetLang={targetLang} speech={speech} />
              {props.moreVariants && props.moreVariants.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5" dir={targetDir}>
                  <span className="text-xs text-muted">{t('translate.moreVariants')}</span>
                  {props.moreVariants.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => props.onPickVariant?.(variant)}
                      className="rounded-full bg-accentSoft px-2.5 py-0.5 text-sm text-accent transition hover:ring-2 hover:ring-accent"
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              ) : null}
              {result.pro ? <ProExtras pro={result.pro} targetLang={targetLang} speech={speech} /> : null}
            </>
          )}
        </div>

        {result ? (
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <SpeakButton
                text={copyValue}
                language={targetLang}
                id="result"
                speech={speech}
                label={t('translate.speakResult')}
              />
              <CopyButton text={copyValue} label={t('translate.copyResult')} />
              <AddToStudyMenu input={props.studyInput ?? null} iconOnly />
              <IconButton
                label={props.isFavorite ? t('translate.favoriteRemove') : t('translate.favoriteAdd')}
                icon={<IconStar className="h-[18px] w-[18px]" filled={props.isFavorite} />}
                active={props.isFavorite}
                onClick={props.onToggleFavorite}
                disabled={!props.canFavorite}
              />
              <CardMenu
                onExplain={props.onExplain}
                onCheck={props.onCheck}
                onShare={() => void handleShare()}
                onShareImage={props.onShareImage}
                canUseTools={props.canUseTools}
                shareSupported={true}
                className="ml-auto"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {t('translate.provider', { provider: result.label ?? providerLabel(result.provider, result.model) })}
              {result.cached ? ` · ${t('translate.fromCache')}` : ''}
            </p>
          </div>
        ) : null}
      </Card>

      {props.connectedWords && props.connectedWords.length > 0 && props.onSelectConnectedWord ? (
        <ConnectedWordsChips
          items={props.connectedWords}
          onSelectWord={props.onSelectConnectedWord}
        />
      ) : null}

      {props.others}
    </div>
  );
}
