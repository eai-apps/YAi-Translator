/**
 * Карточка слова на экране «Перевод».
 * Если ответил ИИ — карточка с вкладками (этап 8).
 * Пока ИИ думает — мгновенный заголовок и формы из базы лексикона (этап 11).
 * Если ИИ недоступен — полноценная карточка из базы и словарей.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordCard } from '../../../shared/types';
import type { DictState, WordState } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { useLexicon } from '../../hooks/useLexicon';
import { errorMessageKey } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { IconSparkles } from '../layout/icons';
import { DictCard } from './DictCard';
import { InstantWordCard } from './InstantWordCard';
import { WordCard as AiWordCard } from './WordCard';

interface WordPanelProps {
  word: WordState;
  dict: DictState;
  queryWord?: string;
  sourceLang: LanguageCode | null;
  speech: SpeechController;
  onRetry: () => void;
  onOpenLimit: () => void;
  translationLang?: LanguageCode;
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  headerMenu?: ReactNode;
  /** Готовый перевод: при переводе НА немецкий мгновенная карточка ищет немецкое слово перевода. */
  translatedText?: string;
  /** Это слово/короткая фраза — можно попросить ИИ-разбор (кнопка, если он не загружается сам). */
  aiOnButton?: boolean;
}

function AiLoadButton({ onLoad }: { onLoad: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
      <Button size="sm" variant="primary" icon={<IconSparkles className="h-4 w-4" />} onClick={onLoad}>
        {t('word.loadAi')}
      </Button>
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">{t('word.loadAiHint')}</p>
    </div>
  );
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
  sourceLang,
  speech,
  onRetry,
  onOpenLimit,
  translationLang,
  onPickTranslation,
  headerMenu,
  translatedText,
  aiOnButton = false,
}: WordPanelProps) {
  const { t } = useTranslation();
  const hasDict = Boolean(dict.data);
  const dictEntry = dict.data?.entry ?? null;
  const aiCard: WordCard | null = word.data?.card ?? null;

  const queryText = (queryWord || dictEntry?.word || '').trim();
  const sourceIsGerman = sourceLang === 'de' || (!sourceLang && /^[a-zäöüß\s]+$/i.test(queryText));
  // Русский → Немецкий: в немецкой базе ищем перевод («Какашка» → «Kacke»), а не русское слово.
  const germanTranslation = (translatedText ?? '').trim().replace(/[.,!?;:…]+$/u, '');
  const useTranslationWord =
    !sourceIsGerman && translationLang === 'de' && germanTranslation.length > 0 && germanTranslation.split(/\s+/).length <= 3;
  const targetWord = useTranslationWord ? germanTranslation : queryText;
  const isGerman = sourceIsGerman || useTranslationWord;
  const { match: lexMatch } = useLexicon(targetWord, isGerman && !aiCard);

  // ИИ-разбор не загружался сам (режим «по кнопке») — показываем кнопку.
  const showAiButton = aiOnButton && !aiCard && !word.loading && !word.data && !word.error;

  // Ничего нет и ничего не грузится — карточки на экране нет (кроме кнопки ИИ-разбора)
  if (!word.loading && !word.data && !dict.loading && !dict.data && !word.error && !lexMatch) {
    if (!showAiButton || !queryText) return null;
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <p className="text-lg font-semibold">{queryText}</p>
        <AiLoadButton onLoad={onRetry} />
      </Card>
    );
  }

  // 1. Полная карточка ИИ
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

  // 2. Мгновенная карточка из базы лексикона (пока ИИ думает или если ИИ недоступен)
  if (lexMatch) {
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <InstantWordCard
          match={lexMatch}
          speech={speech}
          isPreparingAi={word.loading}
          dictEntry={useTranslationWord ? null : dictEntry}
          meaning={useTranslationWord ? queryText.toLowerCase() : undefined}
          onPickTranslation={onPickTranslation}
        />
        {useTranslationWord && dictEntry ? (
          <div className="mt-4 border-t border-line pt-4">
            <DictCard entry={dictEntry} speech={speech} withAi={false} onPick={onPickTranslation} />
          </div>
        ) : null}
        {word.error ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {word.error.code === 'LIMIT_REACHED' ? (
              <>
                <p className="text-xs leading-relaxed text-muted">{t('word.needAi')}</p>
                <Button size="sm" variant="primary" onClick={onOpenLimit}>
                  {t('limit.title')}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            )}
          </div>
        ) : null}
        {showAiButton ? <AiLoadButton onLoad={onRetry} /> : null}
      </Card>
    );
  }

  // 3. Карточка только из словарей (если слова нет в базе лексикона)
  if (hasDict && dictEntry) {
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <DictCard entry={dictEntry} speech={speech} withAi={false} onPick={onPickTranslation} />
        {word.error ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {word.error.code === 'LIMIT_REACHED' ? (
              <>
                <p className="text-xs leading-relaxed text-muted">{t('word.needAi')}</p>
                <Button size="sm" variant="primary" onClick={onOpenLimit}>
                  {t('limit.title')}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            )}
          </div>
        ) : null}
        {showAiButton ? <AiLoadButton onLoad={onRetry} /> : null}
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

  // 5. Ошибка
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
