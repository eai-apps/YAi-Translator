import { reverseCardDirection } from '../../../shared/cardDirection';
/**
 * Карточка слова на экране «Перевод» (этап 15Б, версия 0.17.5).
 * Карточка ВСЕГДА полная (вкладки/карусель, формы, примеры A1-B2, синонимы, правила):
 * - Если ответил ИИ — карточка ИИ.
 * - Если ИИ думает или лимит исчерпан — мгновенная полная карточка из базы и словарей.
 * - Кнопка «Разбор слова от ИИ» остаётся доступна.
 * - Поддерживает оба направления: de->ru («Kacke») и ru->de («Какашка»).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordCard } from '../../../shared/types';
import type { DictState, WordState } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { useLexicon } from '../../hooks/useLexicon';
import { useExamples } from '../../hooks/useExamples';
import { getOfflineCard, assembleClientCard } from '../../lib/offlineCards';
import { errorMessageKey } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { DictCard } from './DictCard';
import { WordCard as AiWordCard } from './WordCard';

interface WordPanelProps {
  word: WordState;
  dict: DictState;
  queryWord?: string;
  translatedText?: string;
  sourceLang: LanguageCode | null;
  speech: SpeechController;
  onRetry: () => void;
  onOpenLimit: () => void;
  translationLang?: LanguageCode;
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  headerMenu?: ReactNode;
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner />
        <span>{label}</span>
      </div>
      <div className="h-6 w-40 animate-pulse rounded-lg bg-soft" />
      <div className="h-4 w-3/4 animate-pulse rounded-lg bg-soft" />
      <div className="h-4 w-2/3 animate-pulse rounded-lg bg-soft" />
    </div>
  );
}

export function WordPanel({
  word,
  dict,
  queryWord,
  translatedText,
  sourceLang,
  speech,
  onRetry,
  onOpenLimit,
  translationLang,
  onPickTranslation,
  headerMenu,
}: WordPanelProps) {
  const { t, i18n } = useTranslation();
  const dictEntry = dict.data?.entry ?? null;
  const aiCard: WordCard | null = word.data?.card ?? null;

  // Определение изучаемого слова и направления (ru->de или de->ru)
  const isForeignTarget = Boolean(sourceLang && translationLang && reverseCardDirection(sourceLang, translationLang));

  const cleanTarget = (translatedText || '').split(/[;,]/)[0]
    .replace(/^(der|die|das|the|a|an)\s+/i, '')
    .trim();

  const targetWord = (isForeignTarget && cleanTarget
    ? cleanTarget
    : queryWord || dictEntry?.word || '').trim();

  const targetLang = (isForeignTarget ? translationLang : sourceLang || 'de') as LanguageCode;
  const currentUiLang = ((i18n.language?.slice(0, 2) || 'ru') as LanguageCode);
  const explainLang = (isForeignTarget ? sourceLang || 'ru' : translationLang || currentUiLang) as LanguageCode;

  const { match: lexMatch } = useLexicon(targetWord, targetLang);
  const { examples: tatoebaExamples } = useExamples(lexMatch?.lemma || targetWord, targetLang);

  // Проверка статической выгрузки для офлайна
  const cardKey = `${targetLang}:${explainLang}:${targetWord}`;
  const [storedOffline, setStoredOffline] = useState<{ key: string; card: WordCard } | null>(null);
  const offlineCard = storedOffline?.key === cardKey ? storedOffline.card : null;

  useEffect(() => {
    let active = true;
    setStoredOffline(null);
    if (aiCard) {
      setStoredOffline(null);
      return;
    }
    const lemma = lexMatch?.lemma || targetWord;
    if (lemma && lemma.length >= 2) {
      void getOfflineCard(lemma, targetLang, explainLang).then((card) => {
        if (active && card) setStoredOffline({ key: cardKey, card });
      });
    }
    return () => {
      active = false;
    };
  }, [aiCard, lexMatch, targetWord, targetLang, explainLang, cardKey]);

  // Сборка полной карточки из открытых баз, если нет ИИ-ответа
  const fallbackFullCard: WordCard | null = useMemo(() => {
    if (aiCard) return null;
    if (offlineCard) return offlineCard;
    if (!lexMatch) return null;

    const dictTranslations =
      dictEntry?.senses.map((s) => s.translation).filter((s): s is string => Boolean(s)) ?? [];

    return assembleClientCard(
      lexMatch.lemma,
      targetLang,
      explainLang,
      lexMatch.entry,
      tatoebaExamples,
      isForeignTarget && queryWord ? [queryWord] : dictTranslations,
    );
  }, [aiCard, offlineCard, lexMatch, targetLang, explainLang, tatoebaExamples, dictEntry, isForeignTarget, queryWord]);

  // Если ничего нет и ничего не грузится — ничего не показываем
  if (
    !word.loading &&
    !word.data &&
    !dict.loading &&
    !dict.data &&
    !word.error &&
    !lexMatch &&
    !offlineCard
  ) {
    return null;
  }

  // 1. Полная карточка ИИ (при ответе нейросети)
  if (aiCard) {
    const life = dictEntry?.examples.filter((e) => e.source === 'tatoeba') ?? [];
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <AiWordCard
          card={aiCard}
          speech={speech}
          dictExamples={life}
          dictLang={sourceLang}
          translationLang={translationLang}
          onPickTranslation={onPickTranslation}
          headerMenu={headerMenu}
        />
      </Card>
    );
  }

  // 2. Полная карточка из базы и словарей (все вкладки, формы, примеры, правила)
  if (fallbackFullCard) {
    const life = dictEntry?.examples.filter((e) => e.source === 'tatoeba') ?? [];
    return (
      <Card className="mt-4 p-4 sm:p-5">
        {word.loading ? (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-soft px-3 py-1.5 text-xs text-muted">
            <Spinner />
            <span>{t('word.preparingDetails')}</span>
          </div>
        ) : null}

        <AiWordCard
          card={fallbackFullCard}
          speech={speech}
          dictExamples={life}
          dictLang={targetLang}
          translationLang={explainLang}
          onPickTranslation={onPickTranslation}
          headerMenu={headerMenu}
        />

        {!word.loading ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
            <span>{t('word.assembledFromDicts')}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="ghost" onClick={onRetry}>
                {t('word.askAiCard')}
              </Button>
              {word.error?.code === 'LIMIT_REACHED' ? (
                <Button size="sm" variant="primary" onClick={onOpenLimit}>
                  {t('limit.title')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>
    );
  }

  // 3. Карточка словаря (если слова нет в базе лексикона)
  if (dictEntry) {
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <DictCard entry={dictEntry} speech={speech} withAi={false} onPick={onPickTranslation} />
        {word.error ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <Button size="sm" variant="ghost" onClick={onRetry}>
              {t('word.askAiCard')}
            </Button>
            {word.error.code === 'LIMIT_REACHED' ? (
              <Button size="sm" variant="primary" onClick={onOpenLimit}>
                {t('limit.title')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>
    );
  }

  // 4. Ожидание ответа
  if (word.loading || dict.loading) {
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <CardSkeleton label={t('word.loading')} />
      </Card>
    );
  }

  if (!word.error) return null;

  // 5. Ошибка при отсутствии каких-либо данных
  return (
    <Card className="mt-4 p-4 sm:p-5">
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted">
          {word.error.code === 'LIMIT_REACHED' ? t('word.needAi') : t(errorMessageKey(word.error.code))}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
          {word.error.code === 'LIMIT_REACHED' ? (
            <Button size="sm" variant="primary" onClick={onOpenLimit}>
              {t('limit.title')}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
