/**
 * Строка модели в таблице платного подключения (этап 9).
 */
import { useTranslation } from 'react-i18next';
import type { PaidModelOption } from '../../../shared/types';
import { Button } from '../ui/Button';
import { IconTrash } from '../layout/icons';
import { shortModelName } from '../../hooks/useSiteAiModels';
import { cn } from '../../lib/cn';

interface Props {
  connectionId: string;
  model: PaidModelOption;
  isSiteDefault: boolean;
  isTesting: boolean;
  checkingAll: boolean;
  onToggleEnabled: (model: PaidModelOption) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onTestOne: (modelId: string) => Promise<void>;
  onDeleteModel: (modelId: string) => Promise<void>;
}

export function AdminPaidModelRow({
  connectionId,
  model: m,
  isSiteDefault,
  isTesting,
  checkingAll,
  onToggleEnabled,
  onSetDefault,
  onTestOne,
  onDeleteModel,
}: Props) {
  const { t } = useTranslation();
  const dotColor =
    m.ok === true ? 'bg-emerald-500' : m.ok === false ? 'bg-rose-500' : 'bg-neutral-400';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={m.enabled}
          onChange={() => void onToggleEnabled(m)}
          className="h-4 w-4 rounded accent-accent"
          title={t('admin.paid.enabledLabel')}
        />
        <span
          className={cn('h-2 w-2 rounded-full shrink-0', dotColor)}
          title={m.ok === true ? 'OK' : m.ok === false ? m.error || 'Error' : 'Not tested'}
        />
        <div className="min-w-0">
          <span className="font-medium text-ink truncate" title={m.id}>
            {shortModelName(m.id)}
          </span>
          {m.priceIn !== undefined && (
            <span className="ml-1.5 text-muted font-mono text-[11px]">
              ${m.priceIn.toFixed(2)}/1M
            </span>
          )}
          {m.latencyMs !== null && m.latencyMs !== undefined && (
            <span className="ml-1.5 font-mono text-muted text-[11px]">
              {m.latencyMs} мс
            </span>
          )}
          {m.reply && (
            <span className="ml-1.5 text-muted italic truncate max-w-[140px] inline-block align-bottom">
              «{m.reply}»
            </span>
          )}
          {m.ok === false && m.error && (
            <span className="ml-1.5 text-danger truncate max-w-[140px] inline-block align-bottom">
              {m.error}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => void onSetDefault(isSiteDefault ? '' : `${connectionId}|${m.id}`)}
          className={cn(
            'p-1 text-sm rounded transition-colors',
            isSiteDefault ? 'text-amber-500 font-bold' : 'text-muted hover:text-ink',
          )}
          title={isSiteDefault ? t('admin.paid.isDefault') : t('admin.paid.makeDefault')}
        >
          ★
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void onTestOne(m.id)}
          loading={isTesting}
          disabled={isTesting || checkingAll}
        >
          {t('admin.paid.testBtn')}
        </Button>
        <button
          type="button"
          onClick={() => void onDeleteModel(m.id)}
          className="p-1 text-muted hover:text-danger transition-colors"
          title={t('common.delete')}
        >
          <IconTrash className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
