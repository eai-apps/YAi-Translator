/**
 * Экран «Перевод» (этап 10Б): две колонки, свайп/навигация по истории переводов,
 * синхронизация адреса ?q=..., озвучка в приложении, кнопка «История», серия дней 🔥,
 * карточка повторения 5 слов и поделиться картинкой.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, ProviderId, TranslateResponse } from '../../shared/types';
import { isAiProvider } from '../lib/errors';
import { MAX_TEXT_LENGTH } from '../config';
import { useExplainAndCheck } from '../hooks/useExplainAndCheck';
import { useHistory } from '../hooks/useHistory';
import { useHistoryBrowse } from '../hooks/useHistoryBrowse';
import { useHistoryQuizPrompt } from '../hooks/useHistoryQuizPrompt';
import { useOthers } from '../hooks/useOthers';
import { useSettings } from '../hooks/useSettings';
import { useSpeech } from '../hooks/useSpeech';
import { useStreak } from '../hooks/useStreak';
import { useTranslateSettings } from '../hooks/useTranslateSettings';
import { useTranslationActions } from '../hooks/useTranslationActions';
import { useTranslationUrlSync } from '../hooks/useTranslationUrlSync';
import { isWordQuery, useTranslator } from '../hooks/useTranslator';
import { TranslateHeader } from '../components/translate/TranslateHeader';
import { TranslateHistoryDrawer } from '../components/translate/TranslateHistoryDrawer';
import { SourcePanel } from '../components/translate/SourcePanel';
import { ResultPanel } from '../components/translate/ResultPanel';
import { HistoryQuizPromptCard } from '../components/translate/HistoryQuizPromptCard';
import { HistoryQuizModal } from '../components/translate/HistoryQuizModal';
import { OthersPanel } from '../components/translate/OthersPanel';
import { CardMenu } from '../components/translate/CardMenu';
import { ExplanationPanel } from '../components/translate/ExplanationPanel';
import { CheckPanel } from '../components/translate/CheckPanel';
import { WordPanel } from '../components/word/WordPanel';
import { WordOfDayCard } from '../components/study/WordOfDayCard';
import { PickContext } from '../components/word/pick';
import { LimitDialog } from '../components/limit/LimitDialog';
import { cardFromTranslation } from '../lib/studyCard';
import { shareTranslationImage } from '../lib/renderShareImage';
import { extractMoreVariants } from '../components/translate/variants';
import { hideKeyboard } from '../lib/keyboard';

export default function TranslatePage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { settings } = useTranslateSettings();
  const { items, toggleFavorite } = useHistory();
  const speech = useSpeech();
  const translator = useTranslator(() => setLimitOpen(true));
  const { streak, todayActive, markTodayActivity } = useStreak();

  // Скрытие экранной клавиатуры при скролле страницы
  useEffect(() => {
    const onScroll = () => {
      void hideKeyboard();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [limitOpen, setLimitOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [chosen, setChosen] = useState<{ provider: ProviderId; text: string } | null>(null);

  const { text, sourceLang, targetLang, result } = translator;

  // Нажатые слова и «Поделиться»
  const { pickText, pickTranslation, share, shareSupported, shareCopied } = useTranslationActions(translator);

  // Синхронизация с URL (?q=...&from=...&to=...) и кнопками «Назад/Вперёд»
  useTranslationUrlSync({
    text: translator.text,
    sourceLang: translator.sourceLang,
    targetLang: translator.targetLang,
    result: translator.result,
    loading: translator.loading,
    error: translator.error,
    applyIncoming: translator.applyIncoming,
    clearAll: translator.clearAll,
  });

  // Листание истории свайпом, ‹ › и Alt+←/Alt+→
  const historyBrowse = useHistoryBrowse({
    items,
    currentText: translator.text,
    currentSource: translator.sourceLang,
    currentTarget: translator.targetLang,
    onSelect: translator.applyHistoryItem,
  });

  // Тест на 5 слов из истории
  const quiz = useHistoryQuizPrompt(items, settings.quizEnabled);

  // Серия дней и счётчик для теста: один раз на каждый новый перевод (не на каждую перерисовку,
  // и не для перевода, открытого из истории).
  const countedResultRef = useRef<TranslateResponse | null>(null);
  const { onWordTranslated } = quiz;
  useEffect(() => {
    if (!result || translator.loading || translator.error) return;
    if (countedResultRef.current === result) return;
    countedResultRef.current = result;
    markTodayActivity();
    if (!result.fromHistory && isWordQuery(text)) onWordTranslated();
  }, [result, translator.loading, translator.error, text, markTodayActivity, onWordTranslated]);

  // «Разобрать» и «Проверить мой немецкий»
  const { explain, check, runExplain, runCheck, closeExplain, closeCheck } = useExplainAndCheck({
    text,
    sourceLang,
    targetLang,
    uiLanguage,
    onLimitReached: () => setLimitOpen(true),
  });

  useEffect(() => {
    setChosen(null);
  }, [text, sourceLang, targetLang, translator.providerChoice]);

  const others = useOthers({
    text,
    sourceLang,
    targetLang,
    provider: result?.provider ?? null,
    autoEnabled: settings.showOthers,
    detectedLang: translator.detectedLang,
  });

  const useVariant = (provider: ProviderId, variantText: string) => {
    setChosen({ provider, text: variantText });
  };

  const currentFavorite = translator.historyId
    ? items.find((item) => item.id === translator.historyId)?.favorite ?? false
    : false;

  const wordLanguage: LanguageCode | null =
    sourceLang !== 'auto'
      ? sourceLang
      : translator.dict.data?.entry.sourceLang ?? translator.word.data?.card.language ?? null;

  const shown: TranslateResponse | null = result
    ? chosen
      ? { ...result, translatedText: chosen.text, provider: chosen.provider, alternatives: [] }
      : result
    : null;

  const resolvedSource = sourceLang === 'auto' ? translator.detectedLang : sourceLang;
  const studyInput = shown
    ? resolvedSource === 'de'
      ? cardFromTranslation(text, shown.translatedText)
      : targetLang === 'de'
        ? cardFromTranslation(shown.translatedText, text)
        : null
    : null;

  const moreVariants = extractMoreVariants(translator.word.data, shown);

  const tools = {
    onExplain: runExplain,
    onCheck: runCheck,
    canUseTools: translator.text.trim().length > 0,
  };

  const handleShareImage = () => {
    if (!shown) return;
    void shareTranslationImage({
      sourceText: text,
      translatedText: shown.translatedText,
      sourceLang,
      targetLang,
      article: translator.word.data?.card.article ?? null,
    });
  };

  const othersBlock =
    settings.showOthers && result && !translator.error ? (
      <OthersPanel
        data={others.data}
        loading={others.loading}
        failed={others.failed}
        autoEnabled={settings.showOthers}
        exclude={result.provider}
        targetLang={targetLang}
        speech={speech}
        expanded={others.expanded}
        onExpand={others.expand}
        onCollapse={others.collapse}
        onUseVariant={useVariant}
        usedProvider={chosen?.provider ?? null}
        sourceText={text}
        sourceLang={sourceLang}
        mainIsAi={isAiProvider(result.provider)}
        onLimitReached={() => setLimitOpen(true)}
      />
    ) : null;

  return (
    <>
      <TranslateHeader
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        streak={streak}
        todayActive={todayActive}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <SourcePanel
            text={translator.text}
            onChange={translator.setText}
            sourceLang={translator.sourceLang}
            targetLang={translator.targetLang}
            onSourceChange={translator.setSourceLang}
            onTargetChange={translator.setTargetLang}
            onSwap={translator.swapLanguages}
            maxLength={MAX_TEXT_LENGTH}
            speech={speech}
            suggestionsEnabled={settings.suggestions}
            enterToTranslate={settings.enterToTranslate}
            onSubmit={translator.retry}
            providerChoice={translator.providerChoice}
            onProviderChange={translator.setProviderChoice}
            aiLoading={translator.aiLoading}
            onAskAi={(model?: string) => void translator.askAi(model)}
          />

          {/* На телефоне пустая карточка «Начните переводить» не нужна — показываем её только на ПК. */}
          <div className={translator.text.trim() ? '' : 'hidden lg:block'}>
          <ResultPanel
            moreVariants={moreVariants}
            onPickVariant={(value) => pickTranslation(value, targetLang)}
            result={shown}
            loading={translator.loading}
            error={translator.error}
            sourceLang={translator.sourceLang}
            targetLang={translator.targetLang}
            detectedLang={translator.detectedLang}
            isFavorite={currentFavorite}
            canFavorite={Boolean(currentFavorite) || Boolean(translator.historyId && settings.saveHistory)}
            speech={speech}
            onRetry={translator.retry}
            onOpenLimit={() => setLimitOpen(true)}
            {...tools}
            onToggleFavorite={() => {
              if (translator.historyId) toggleFavorite(translator.historyId);
            }}
            studyInput={studyInput}
            sourceText={text}
            onPrevHistory={historyBrowse.goPrev}
            onNextHistory={historyBrowse.goNext}
            canPrevHistory={historyBrowse.canPrev}
            canNextHistory={historyBrowse.canNext}
            historyCounter={historyBrowse.counterText}
            slideDirection={historyBrowse.slideDirection}
            onShareImage={handleShareImage}
          />
          </div>

          {quiz.shouldPrompt ? (
            <HistoryQuizPromptCard onStart={quiz.startQuiz} onDismiss={quiz.dismiss} />
          ) : null}
        </div>

        {othersBlock ? <div className="flex min-w-0 flex-1 flex-col gap-3 lg:sticky lg:top-4">{othersBlock}</div> : null}
      </div>

      {shareCopied ? (
        <p role="status" className="mt-2 text-xs text-success">
          {t('common.copied')}
        </p>
      ) : null}

      <PickContext.Provider value={pickText}>
        <WordPanel
          word={translator.word}
          dict={translator.dict}
          queryWord={translator.text}
          sourceLang={wordLanguage}
          speech={speech}
          onRetry={translator.retryWord}
          onOpenLimit={() => setLimitOpen(true)}
          translationLang={targetLang}
          onPickTranslation={pickTranslation}
          headerMenu={
            shown ? (
              <CardMenu
                variant="dots"
                {...tools}
                onShare={() => void share(text, shown.translatedText, t('common.appName'))}
                onShareImage={handleShareImage}
                shareSupported={shareSupported}
              />
            ) : undefined
          }
        />
      </PickContext.Provider>

      {/* «Слово дня» — компактно в самом низу экрана перевода (пункт 2) */}
      <div className="mt-4">
        <WordOfDayCard compact />
      </div>

      {explain.open ? (
        <ExplanationPanel
          data={explain.data}
          loading={explain.loading}
          error={explain.error}
          onClose={closeExplain}
          onRetry={runExplain}
        />
      ) : null}

      {check.open ? (
        <CheckPanel
          data={check.data}
          loading={check.loading}
          error={check.error}
          speech={speech}
          onClose={closeCheck}
          onRetry={runCheck}
        />
      ) : null}

      <TranslateHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        onSelect={translator.applyHistoryItem}
      />

      <HistoryQuizModal
        open={quiz.modalOpen}
        onClose={quiz.closeQuiz}
        items={quiz.wordItems}
        onComplete={markTodayActivity}
      />

      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} onSaved={translator.retry} />
    </>
  );
}
