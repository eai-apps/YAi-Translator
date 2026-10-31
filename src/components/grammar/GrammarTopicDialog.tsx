/**
 * Всплывающее окно темы справочника (версия 0.6.0).
 * Открывается поверх любой страницы: снизу на телефоне, по центру на компьютере.
 * Из окна можно открыть связанную тему, задать вопрос учителю или перейти на страницу темы.
 */
import { useTranslation } from 'react-i18next';
import type { GrammarTopicResponse, GrammarTopicSummary } from '../../../shared/types';
import type { TranslatorError } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { grammarTitle } from './grammarLabels';
import { GrammarTopicView } from './GrammarTopicView';

interface GrammarTopicDialogProps {
  open: boolean;
  loading: boolean;
  data: GrammarTopicResponse | null;
  /** Заголовок из списка тем — виден сразу, пока текст грузится. */
  summary: GrammarTopicSummary | null;
  error: TranslatorError | null;
  onClose: () => void;
  onRetry: () => void;
  /** Переход к другой теме внутри того же окна. */
  onOpenTopic: (slug: string) => void;
  onOpenPage: (slug: string) => void;
  onAsk: (title: string) => void;
}

export function GrammarTopicDialog({
  open,
  loading,
  data,
  summary,
  error,
  onClose,
  onRetry,
  onOpenTopic,
  onOpenPage,
  onAsk,
}: GrammarTopicDialogProps) {
  const { t, i18n } = useTranslation();
  const slug = data?.slug ?? summary?.slug ?? null;
  const title = data
    ? grammarTitle(data, i18n.language)
    : summary
      ? grammarTitle(summary, i18n.language)
      : t('grammar.popupTitle');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="sm:max-w-2xl"
      footer={
        slug ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={() => onAsk(title)}>
              {t('grammar.askAbout')}
            </Button>
            <Button size="sm" onClick={() => onOpenPage(slug)}>
              {t('grammar.openPage')}
            </Button>
          </div>
        ) : null
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted">
          <Spinner />
          <span>{t('grammar.generating')}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2 py-2">
          <p className="text-sm text-danger">{t('grammar.loadError')}</p>
          <Button size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      ) : data ? (
        <GrammarTopicView topic={data} onOpenTopic={onOpenTopic} compact />
      ) : null}
    </Modal>
  );
}
