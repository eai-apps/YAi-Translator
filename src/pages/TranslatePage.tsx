/** Экран «Перевод»: связывает ввод, API, разбор, проверку, «Как переводят другие» и окно ключей. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type {
  CheckResponse,
  ExplainResponse,
  LanguageCode,
  ProviderId,
  SourceLanguage,
  TranslateResponse,
} from '../../shared/types';
import { isLanguageCode } from '../../shared/languages';
import { api } from '../api/client';
import { isAiProvider, toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';
import { MAX_TEXT_LENGTH, STORAGE_KEYS } from '../config';
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
import { LimitDialog } from '../components/limit/LimitDialog';

interface PanelState<T> {
  open: boolean;
  loading: boolean;
  data: T | null;
  error: TranslatorError | null;
}

function closedPanel<T>(): PanelState<T> {
  return { open: false, loading: false, data: null, error: null };
}

export default function TranslatePage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { items, toggleFavorite } = useHistory();
  const speech = useSpeech();
  const translator = useTranslator(() => setLimitOpen(true));
  // Настройка профиля: показывать ли других переводчиков автоматически.
  const [showOthers] = useLocalStorage<boolean>(STORAGE_KEYS.showOthers, true);

  const [limitOpen, setLimitOpen] = useState(false);
  const [explain, setExplain] = useState<PanelState<ExplainResponse>>(closedPanel);
  const [check, setCheck] = useState<PanelState<CheckResponse>>(closedPanel);
  /** Вариант другого переводчика, выбранный кнопкой «Использовать этот вариант». */
  const [chosen, setChosen] = useState<{ provider: ProviderId; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const explainAbort = useRef<AbortController | null>(null);
  const checkAbort = useRef<AbortController | null>(null);

  const { text, sourceLang, targetLang, applyIncoming, result } = translator;

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

  // Новый текст — старые разбор и проверка больше не относятся к делу.
  useEffect(() => {
    explainAbort.current?.abort();
    checkAbort.current?.abort();
    setExplain(closedPanel());
    setCheck(closedPanel());
  }, [text, sourceLang, targetLang]);

  useEffect(() => {
    return () => {
      explainAbort.current?.abort();
      checkAbort.current?.abort();
    };
  }, []);

  const runExplain = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    explainAbort.current?.abort();
    const controller = new AbortController();
    explainAbort.current = controller;
    setExplain({ open: true, loading: true, data: null, error: null });

    void (async () => {
      try {
        const data = await api.explain(
          { text: value, sourceLang, targetLang, uiLang: uiLanguage },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setExplain({ open: true, loading: false, data, error: null });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const error = toTranslatorError(caught, t('errors.unknown'));
        setExplain({ open: true, loading: false, data: null, error });
        if (error.code === 'LIMIT_REACHED') setLimitOpen(true);
      }
    })();
  }, [text, sourceLang, targetLang, uiLanguage, t]);

  const runCheck = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    checkAbort.current?.abort();
    const controller = new AbortController();
    checkAbort.current = controller;
    setCheck({ open: true, loading: true, data: null, error: null });

    void (async () => {
      try {
        const data = await api.check({ text: value, uiLang: uiLanguage }, controller.signal);
        if (controller.signal.aborted) return;
        setCheck({ open: true, loading: false, data, error: null });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const error = toTranslatorError(caught, t('errors.unknown'));
        setCheck({ open: true, loading: false, data: null, error });
        if (error.code === 'LIMIT_REACHED') setLimitOpen(true);
      }
    })();
  }, [text, uiLanguage, t]);

  /** «Использовать этот вариант»: чужой текст становится основным переводом. */
  const useVariant = (provider: ProviderId, variantText: string) => {
    setChosen({ provider, text: variantText });
  };

  const currentFavorite = translator.historyId
    ? items.find((item) => item.id === translator.historyId)?.favorite ?? false
    : false;

  // Показанный перевод: выбранный вариант или ответ сервера.
  const shown: TranslateResponse | null = result
    ? chosen
      ? { ...result, translatedText: chosen.text, provider: chosen.provider, alternatives: [] }
      : result
    : null;

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

      <WordPanel
        word={translator.word}
        speech={speech}
        onRetry={translator.retryWord}
        onOpenLimit={() => setLimitOpen(true)}
      />

      {explain.open ? (
        <ExplanationPanel
          data={explain.data}
          loading={explain.loading}
          error={explain.error}
          onClose={() => {
            explainAbort.current?.abort();
            setExplain(closedPanel());
          }}
          onRetry={runExplain}
        />
      ) : null}

      {check.open ? (
        <CheckPanel
          data={check.data}
          loading={check.loading}
          error={check.error}
          speech={speech}
          onClose={() => {
            checkAbort.current?.abort();
            setCheck(closedPanel());
          }}
          onRetry={runCheck}
        />
      ) : null}

      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} onSaved={translator.retry} />
    </>
  );
}
