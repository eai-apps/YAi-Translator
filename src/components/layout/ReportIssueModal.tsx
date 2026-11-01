/**
 * Модальное окно «Сообщить о проблеме» (Часть 19).
 * Позволяет пользователю отправить описание ошибки администратору в 1 клик.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reportClientError } from '../../lib/errorReporter';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { IconCheck, IconAlert } from './icons';

interface ReportIssueModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportIssueModal({ open, onClose }: ReportIssueModalProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      reportClientError({
        message: 'Пользовательский отчёт о проблеме',
        userNote: description.trim(),
        url: window.location.href,
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setSent(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('feedback.modalTitle')}
      className="max-w-md"
    >
      {sent ? (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <IconCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-text">
              {t('feedback.sentTitle')}
            </h4>
            <p className="mt-1 text-sm text-muted">
              {t('feedback.sentSubtitle')}
            </p>
          </div>
          <Button onClick={handleClose} variant="primary" className="w-full">
            {t('common.close')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <p className="text-xs text-muted">
            {t('feedback.prompt')}
          </p>

          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('feedback.placeholder')}
              rows={4}
              required
              className="w-full rounded-xl border border-line bg-page p-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="rounded-xl border border-line bg-soft p-3 text-xs text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-text">
              <IconAlert className="h-3.5 w-3.5 text-accent" />
              <span>{t('feedback.privacyTitle')}</span>
            </div>
            <p>
              {t('feedback.privacyNote')}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!description.trim() || submitting}
            >
              {submitting ? t('common.loading') : t('feedback.submit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
