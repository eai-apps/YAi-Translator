/**
 * Карточка слова на экране «Перевод».
 * Если ответил ИИ — карточка с вкладками (этап 8), к примерам добавлены настоящие предложения
 * из Tatoeba. Если ИИ недоступен — карточка только из словарей.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordCard } from '../../../shared/types';
import type { DictState, WordState } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { errorMessageKey } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { DictCard } from './DictCard';
import { WordCard as AiWordCard } from './WordCard';

interface WordPanelProps {
  word: WordState;
  dict: DictState;
  /** Язык исходного слова — нужен карточке словарей. */
  sourceLang: LanguageCode | null;
  speech: SpeechController;
  onRetry: () => void;
  onOpenLimit: () => void;
  /** Язык переводов карточки (цель перевода) — для чипсов значений. */
  translationLang?: LanguageCode;
  /** Нажатие на перевод значения: перевести обратно. */
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
  /** «⋯» в заголовке карточки. */
  headerMenu?: ReactNode;
}

/** Скелет карточки на время загрузки: заголовок и несколько строк-заглушек. */
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
      <div className="h-4 w-1/2 animate-pulse rounded-lg bg-soft" />
    </div>
  );
}

export function WordPanel({
  word,
  dict,
  sourceLang,
  speech,
  onRetry,
  onOpenLimit,
  translationLang,
  onPickTranslation,
  headerMenu,
}: WordPanelProps) {
  const { t } = useTranslation();
  const hasDict = Boolean(dict.data);
  const dictEntry = dict.data?.entry ?? null;
  const aiCard: WordCard | null = word.data?.card ?? null;

  // Ничего нет и ничего не грузится — карточки на экране нет.
  if (!word.loading && !word.data && !dict.loading && !dict.data && !word.error) return null;

  if (aiCard) {
    // Карточка ИИ: все примеры ИИ + настоящие предложения из Tatoeba.
    const life = dictEntry?.examples.filter((example) => example.source === 'tatoeba') ?? [];
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
      </Card>
    );
  }

  // ИИ ещё думает (или недоступен) — показываем, что готовим карточку, без пустого места.
  if (word.loading || dict.loading) {
    return (
      <Card className="mt-4 p-4 sm:p-5">
        <CardSkeleton label={t('word.loading')} />
      </Card>
    );
  }

  if (!word.error) return null;

  // ИИ не ответил и словари не помогли: понятное объяснение и кнопки.
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
