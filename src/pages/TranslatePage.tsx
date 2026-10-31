/**
 * Экран «Перевод» (этап 8, «как в Яндекс.Переводчике»): одна карточка с языками, полем ввода и пилюлей
 * режима, рядом карточка перевода; под ними — «Как переводят другие» и карточка слова с вкладками.
 * Связывает ввод, API, разбор, проверку и окно ключей.
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, ProviderId, SourceLanguage, TranslateResponse } from '../../shared/types';
import { isLanguageCode } from '../../shared/languages';
import { isAiProvider } from '../lib/errors';
import { MAX_TEXT_LENGTH } from '../config';
import { useExplainAndCheck } from '../hooks/useExplainAndCheck';
import { useHistory } from '../hooks/useHistory';
import { useOthers } from '../hooks/useOthers';
import { useSettings } from '../hooks/useSettings';
import { useSpeech } from '../hooks/useSpeech';
import { useTranslateSettings } from '../hooks/useTranslateSettings';
import { useTranslator } from '../hooks/useTranslator';
import { PageHeader } from '../components/ui/PageHeader';
import { SourcePanel } from '../components/translate/SourcePanel';
import { ResultPanel } from '../components/translate/ResultPanel';
import { OthersPanel } from '../components/translate/OthersPanel';
import { CardMenu } from '../components/translate/CardMenu';
import { ExplanationPanel } from '../components/translate/ExplanationPanel';
import { CheckPanel } from '../components/translate/CheckPanel';
import { WordPanel } from '../components/word/WordPanel';
import { WordOfDayCard } from '../components/study/WordOfDayCard';
import { PickContext } from '../components/word/pick';
import { LimitDialog } from '../components/limit/LimitDialog';
import { cardFromTranslation } from '../lib/studyCard';
import { initialSourceLanguage, readTranslateSettings } from '../lib/translateSettings';

export default function TranslatePage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { settings } = useTranslateSettings();
  const { items, toggleFavorite } = useHistory();
  const speech = useSpeech();
  const translator = useTranslator(() => setLimitOpen(true));

  const [limitOpen, setLimitOpen] = useState(false);
  /** Вариант другого переводчика, выбранный кнопкой «Использовать этот вариант». */
  const [chosen, setChosen] = useState<{ provider: ProviderId; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  /** «Поделиться» без navigator.share — короткое подтверждение «Скопировано». */
  const [shareCopied, setShareCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

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
    autoEnabled: settings.showOthers,
    detectedLang: translator.detectedLang,
  });

  // Текст и языки из истории («Открыть» в словаре).
  useEffect(() => {
    const textParam = searchParams.get('text');
    if (!textParam) return;
    const fromParam = searchParams.get('from') ?? (readTranslateSettings().detectLanguage ? 'auto' : initialSourceLanguage(false));
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

  // «Использовать этот вариант»: чужой текст становится основным переводом.
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

  // Для 1–3 слов рядом со звёздочкой появляется «В карточки» (этап 6).
  const resolvedSource = sourceLang === 'auto' ? translator.detectedLang : sourceLang;
  const studyInput = shown
    ? resolvedSource === 'de'
      ? cardFromTranslation(text, shown.translatedText)
      : targetLang === 'de'
        ? cardFromTranslation(shown.translatedText, text)
        : null
    : null;

  // Нажатое слово из карточки становится новым запросом; язык ввода определится сам.
  const pickText = (value: string) => {
    translator.setSourceLang('auto');
    translator.setText(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Нажатие на перевод значения («получать»): языки меняются местами, слово встаёт в поле. */
  const pickTranslation = (value: string, lang: LanguageCode) => {
    translator.setTargetLang(sourceLang === 'auto' ? wordLanguage ?? 'de' : sourceLang);
    translator.setSourceLang(lang);
    translator.setText(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // «Поделиться»: системное окно телефона, без него — перевод кладётся в буфер обмена.
  const shareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const share = async () => {
    const translation = shown?.translatedText ?? '';
    if (!translation) return;
    const combined = text.trim() ? `${text.trim()}\n→ ${translation}` : translation;
    try {
      if (shareSupported) {
        await navigator.share({ title: t('common.appName'), text: combined });
        return;
      }
      await navigator.clipboard.writeText(translation);
      setShareCopied(true);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Окно закрыли или браузер запретил — ничего не показываем.
    }
  };

  const tools = {
    onExplain: runExplain,
    onCheck: runCheck,
    canUseTools: translator.text.trim().length > 0,
  };

  return (
    <>
      <PageHeader title={t('translate.title')} subtitle={t('translate.subtitle')} />

      <div className="grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
        <div className="flex flex-col gap-3">
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
            onAskAi={() => void translator.askAi()}
          />
          {/* Под пустым полем — маленькое слово дня; крестик скрывает его до завтра. */}
          {translator.text.trim() === '' ? <WordOfDayCard compact /> : null}
        </div>

        <ResultPanel
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
          others={
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
            ) : null
          }
        />
      </div>

      {shareCopied ? (
        <p role="status" className="mt-2 text-xs text-success">
          {t('common.copied')}
        </p>
      ) : null}

      {/* Синонимы, выражения и примеры в карточке можно нажать — они сразу переводятся. */}
      <PickContext.Provider value={pickText}>
        <WordPanel
          word={translator.word}
          dict={translator.dict}
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
                onShare={() => void share()}
                shareSupported={shareSupported}
              />
            ) : undefined
          }
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
