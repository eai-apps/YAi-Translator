/** Разворачивающаяся панель с заголовком, загрузкой и ошибкой. */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TranslatorError } from '../../hooks/useTranslator';
import { errorMessageKey } from '../../lib/errors';
import { Button } from './Button';
import { Card } from './Card';
import { IconButton } from './IconButton';
import { Spinner } from './Spinner';
import { IconClose } from '../layout/icons';

interface AsyncPanelProps {
  title: string;
  subtitle: string;
  loading: boolean;
  error: TranslatorError | null;
  onClose: () => void;
  onRetry: () => void;
  children: ReactNode;
}

export function AsyncPanel({
  title,
  subtitle,
  loading,
  error,
  onClose,
  onRetry,
  children,
}: AsyncPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="mt-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-semibold leading-snug">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        <IconButton label={t('common.close')} icon={<IconClose className="h-4 w-4" />} onClick={onClose} />
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
            <Spinner />
            <span>{t('common.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-2 py-1">
            <p className="text-sm text-danger">{t(errorMessageKey(error.code))}</p>
            <Button size="sm" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
