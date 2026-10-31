/** Экран «Перевод»: связывает ввод, API, разбор, проверку, «Как переводят другие» и окно ключей. */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, ProviderId, SourceLanguage, TranslateResponse } from '../../shared/types';
import { isLanguageCode } from '../../shared/languages';
import { isAiProvider } from '../lib/errors';
import { MAX_TEXT_LENGTH, STORAGE_KEYS } from '../config';
import { useExplainAndCheck } from '../hooks/useExplainAndCheck';
import { useHistory } from '../hooks/useHistory';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOthers } from '../hooks/useOthers';
import { useSettings } from '../hooks/useSettings';
import { useSpeech } from '../hooks/useSpeech';
import { useTranslator } from '../hooks/useTranslator';
import { PageHeader } from '../components/ui/PageHeader';
import { LanguageBar } from '../components/translate/LanguageBar';
import { SourcePanel } from '../components/translate/SourcePanel';
import { ResultPanel } from '../components/translate/ResultPanel';
import { OthersPanel } from '../components/translate/OthersPanel';
import { ExplanationPanel } from '../components/translate/ExplanationPanel';
import { CheckPanel } from '../components/translate/CheckPanel';
import { WordPanel } from '../components/word/WordPanel';
import { PickContext } from '../components/word/pick';
import { LimitDialog } from '../components/limit/LimitDialog';

export default function TranslatePage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { items, toggleFavorite } = useHistory();
  const speech = useSpeech();
  const translator = useTranslator(() => setLimitOpen(true));
  // Настройка профиля: показывать ли других переводчиков автоматически.
  const [showOthers] = useLocalStorage<boolean>(STORAGE_KEYS.showOthers, true);

  const [limitOpen, setLimitOpen] = useState(false);
  /** Вариант другого переводчика, выбранный кнопкой «Использовать этот вариант». */
  const [chosen, setChosen] = useState<{ provider: ProviderId; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { text, sourceLang, targetLang, applyIncoming, result } = translator;

  // «Разобрать» и «Проверить мой немецкий» — отдельный хук (useExplainAndCheck.ts).
  const { explain, check, runExplain, runCheck, closeExplain, closeCheck } = useExplainAndCheck({
    text,
    sourceLang,
    targetLang,
    uiLanguage,
    onLimitReached: () => setLimitOpen(true),
  });

  // Выбранный вариант действует только для этого текста и языков.
  useEffect(() => {
    setChosen(null);
  }, [text, sourceLang, targetLang, translator.providerChoice]);

  const others = useOthers({
    text,
    sourceLang,
    targetLang,
    provider: result?.provider ?? null,
    autoEnabled: showOthers,
    detectedLang: translator.detectedLang,
  });

  // Текст и языки из истории («Открыть» в словаре).
  useEffect(() => {
    const textParam = searchParams.get('text');
    if (!textParam) return;
    const fromParam = searchParams.get('from') ?? 'auto';
    const toParam = searchParams.get('to') ?? 'de';
    const source: SourceLanguage =
      fromParam === 'auto' || isLanguageCode(fromParam) ? fromParam : 'auto';
    const target: LanguageCode = isLanguageCode(toParam) ? toParam : 'de';
    applyIncoming(textParam, source, target);

    const next = new URLSearchParams(searchParams);
    next.delete('text');
    next.delete('from');
    next.delete('to');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, applyIncoming]);

  // «Использовать этот вариант»: чужой текст становится основным переводом. */
  const useVariant = (provider: ProviderId, variantText: string) => {
    setChosen({ provider, text: variantText });
  };

  const currentFavorite = translator.historyId
    ? items.find((item) => item.id === translator.historyId)?.favorite ?? false
    : false;

  // Язык исходного слова для карточки из словарей: выбранный или определённый автоматически.
  const wordLanguage: LanguageCode | null =
    sourceLang !== 'auto'
      ? sourceLang
      : translator.dict.data?.entry.sourceLang ?? translator.word.data?.card.language ?? null;

  // Показанный перевод: выбранный вариант или ответ сервера.
  const shown: TranslateResponse | null = result
    ? chosen
      ? { ...result, translatedText: chosen.text, provider: chosen.provider, alternatives: [] }
      : result
    : null;

  // Нажатое слово из карточки становится новым запросом; язык ввода определится сам.
  const pickText = (value: string) => {
    translator.setSourceLang('auto');
    translator.setText(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageHeader title={t('translate.title')} subtitle={t('translate.subtitle')} />

      <LanguageBar
        sourceLang={translator.sourceLang}
        targetLang={translator.targetLang}
        onSourceChange={translator.setSourceLang}
        onTargetChange={translator.setTargetLang}
        onSwap={translator.swapLanguages}
      />

      <div className="mt-3 grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
        <SourcePanel
          text={translator.text}
          onChange={translator.setText}
          sourceLang={translator.sourceLang}
          maxLength={MAX_TEXT_LENGTH}
          speech={speech}
        />
        <ResultPanel
          result={shown}
          loading={translator.loading}
          error={translator.error}
          sourceLang={translator.sourceLang}
          targetLang={translator.targetLang}
          detectedLang={translator.detectedLang}
          isFavorite={currentFavorite}
          canUseTools={translator.text.trim().length > 0}
          speech={speech}
          providerChoice={translator.providerChoice}
          aiLoading={translator.aiLoading}
          onProviderChange={translator.setProviderChoice}
          onAskAi={() => void translator.askAi()}
          onRetry={translator.retry}
          onOpenLimit={() => setLimitOpen(true)}
          onExplain={runExplain}
          onCheck={runCheck}
          onToggleFavorite={() => {
            if (translator.historyId) toggleFavorite(translator.historyId);
          }}
          others={
            showOthers && result && !translator.error ? (
              <OthersPanel
                data={others.data}
                loading={others.loading}
                failed={others.failed}
                autoEnabled={showOthers}
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
            ) : null
          }
        />
      </div>

      {/* Синонимы, выражения и примеры в карточке можно нажать — они сразу переводятся. */}
      <PickContext.Provider value={pickText}>
      <WordPanel
        word={translator.word}
        dict={translator.dict}
        sourceLang={wordLanguage}
        speech={speech}
        onRetry={translator.retryWord}
        onOpenLimit={() => setLimitOpen(true)}
      />
      </PickContext.Provider>

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

      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} onSaved={translator.retry} />
    </>
  );
}
