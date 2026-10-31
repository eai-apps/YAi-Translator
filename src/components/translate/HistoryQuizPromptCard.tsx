/**
 * Ненавязчивая карточка с предложением повторить 5 слов из истории.
 */
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconSparkles } from '../layout/icons';

interface HistoryQuizPromptCardProps {
  onStart: () => void;
  onDismiss: () => void;
}

export function HistoryQuizPromptCard({ onStart, onDismiss }: HistoryQuizPromptCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col gap-2.5 border-accent bg-accentSoft/30 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent">
          <IconSparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{t('translate.quizPromptTitle')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('translate.quizPromptSubtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t('translate.quizNotNow')}
        </Button>
        <Button size="sm" variant="primary" onClick={onStart}>
          {t('translate.quizStart')}
        </Button>
      </div>
    </Card>
  );
}
