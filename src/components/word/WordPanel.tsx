/** Полная карточка слова под переводом: загрузка, ошибка или сама карточка. */
import { useTranslation } from 'react-i18next';
import type { WordState } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { errorMessageKey } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { WordCard } from './WordCard';

interface WordPanelProps {
  word: WordState;
  speech: SpeechController;
  onRetry: () => void;
  onOpenLimit: () => void;
}

export function WordPanel({ word, speech, onRetry, onOpenLimit }: WordPanelProps) {
  const { t } = useTranslation();
  if (!word.loading && !word.data && !word.error) return null;

  return (
    <Card className="mt-4 p-4 sm:p-5">
      {word.loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted">
          <Spinner />
          <span>{t('word.loading')}</span>
        </div>
      ) : word.error ? (
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
      ) : word.data ? (
        <WordCard card={word.data.card} speech={speech} />
      ) : null}
    </Card>
  );
}
