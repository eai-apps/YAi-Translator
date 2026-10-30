/** Карточка из словарей под переводом: загрузка, ошибка или данные словарей. */
import { useTranslation } from 'react-i18next';
import type { DictState } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { DictCard } from './DictCard';

interface DictPanelProps {
  dict: DictState;
  speech: SpeechController;
}

export function DictPanel({ dict, speech }: DictPanelProps) {
  const { t } = useTranslation();
  if (!dict.data && !dict.loading) return null;

  return (
    <Card className="mt-4 p-4 sm:p-5">
      {dict.data ? (
        <DictCard entry={dict.data.entry} speech={speech} withAi={false} />
      ) : (
        <div className="flex items-center gap-2 py-4 text-sm text-muted">
          <Spinner />
          <span>{t('dict.loading')}</span>
        </div>
      )}
    </Card>
  );
}
