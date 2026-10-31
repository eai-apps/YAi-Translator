/**
 * Карточка платного подключения нейросетей сайта с таблицей моделей (этап 9).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaidConnectionItem, PaidModelOption } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconTrash } from '../layout/icons';
import { shortModelName } from '../../hooks/useSiteAiModels';
import { AdminAddModelsModal } from './AdminAddModelsModal';
import { AdminPaidModelRow } from './AdminPaidModelRow';
import { cn } from '../../lib/cn';

interface Props {
  connection: PaidConnectionItem;
  defaultId: string | null;
  onSetDefault: (id: string) => Promise<void>;
  onDeleteConnection: (id: string) => Promise<void>;
  onUpdateModels: (id: string, defaultModel: string, models: PaidModelOption[]) => Promise<void>;
  onError: (msg: string | null) => void;
  onReload: () => void;
}

type SortKey = 'price' | 'speed' | 'name';

export function AdminPaidConnectionCard({
  connection,
  defaultId,
  onSetDefault,
  onDeleteConnection,
  onUpdateModels,
  onError,
  onReload,
}: Props) {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkProgress, setCheckProgress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Автозагрузка баланса для OpenRouter (без alert, текстом в карточке)
  useEffect(() => {
    if (!connection.baseUrl.includes('openrouter')) return;
    let alive = true;
    void (async () => {
      try {
        const res = await api.adminPaidAction<{ credits?: string | null }>({
          action: 'credits',
          id: connection.id,
        });
        if (alive && res.credits !== undefined) setBalance(res.credits);
      } catch {
        // Игнорируем тихие ошибки загрузки баланса
      }
    })();
    return () => {
      alive = false;
    };
  }, [connection.id, connection.baseUrl]);

  const handleTestOne = async (modelId: string) => {
    setTestingModel(modelId);
    try {
      await api.adminPaidAction({
        action: 'test',
        id: connection.id,
        model: modelId,
      });
      onReload();
    } catch {
      onError(t('admin.paid.testFail'));
    } finally {
      setTestingModel(null);
    }
  };

  const handleTestAll = async () => {
    const enabledModels = connection.models.filter((m) => m.enabled);
    if (enabledModels.length === 0) return;
    setCheckingAll(true);
    try {
      for (let i = 0; i < enabledModels.length; i++) {
        const m = enabledModels[i];
        setCheckProgress(`${i + 1}/${enabledModels.length}: ${shortModelName(m.id)}`);
        await api.adminPaidAction({
          action: 'test',
          id: connection.id,
          model: m.id,
        }).catch(() => null);
      }
      onReload();
    } finally {
      setCheckingAll(false);
      setCheckProgress(null);
    }
  };

  const toggleModelEnabled = async (model: PaidModelOption) => {
    const updated = connection.models.map((m) =>
      m.id === model.id ? { ...m, enabled: !m.enabled } : m,
    );
    await onUpdateModels(connection.id, connection.defaultModel, updated);
  };

  const deleteModel = async (modelId: string) => {
    const updated = connection.models.filter((m) => m.id !== modelId);
    const def = connection.defaultModel === modelId ? (updated[0]?.id || '') : connection.defaultModel;
    await onUpdateModels(connection.id, def, updated);
  };

  const sortedModels = [...connection.models].sort((a, b) => {
    if (sortKey === 'price') return (a.priceIn ?? 999) - (b.priceIn ?? 999);
    if (sortKey === 'speed') return (a.latencyMs ?? 99999) - (b.latencyMs ?? 99999);
    return a.id.localeCompare(b.id);
  });

  return (
    <Card className="p-4 space-y-3 border border-line">
      {/* Заголовок подключения */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink text-sm sm:text-base">{connection.name}</h3>
            <span className="font-mono text-xs text-muted">({connection.mask})</span>
          </div>
          <div className="text-xs text-muted break-all">{connection.baseUrl}</div>
          {balance !== null && (
            <div className="mt-1 text-xs font-medium text-ink">
              {t('admin.paid.balance')}: <span className="text-accent">${balance}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)}>
            {t('admin.paid.addModelsBtn')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (confirm(t('common.confirmDelete'))) {
                await onDeleteConnection(connection.id);
              }
            }}
          >
            <IconTrash className="h-4 w-4 text-danger" />
          </Button>
        </div>
      </div>

      {/* Панель над таблицей: Проверить все + Сортировка */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleTestAll()}
            disabled={checkingAll || connection.models.length === 0}
            loading={checkingAll}
          >
            {checkingAll && checkProgress ? checkProgress : t('admin.paid.testAll')}
          </Button>
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <span>{t('admin.paid.sortBy')}:</span>
          {(['price', 'speed', 'name'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              className={cn(
                'rounded px-2 py-0.5 transition-colors',
                sortKey === key ? 'bg-accentSoft font-semibold text-accent' : 'hover:bg-soft text-ink',
              )}
            >
              {t(`admin.paid.sort_${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Таблица / карточки моделей */}
      {sortedModels.length === 0 ? (
        <p className="py-3 text-xs text-muted">{t('admin.paid.noModelsInConnection')}</p>
      ) : (
        <div className="space-y-1.5 divide-y divide-line/40">
          {sortedModels.map((m) => (
            <AdminPaidModelRow
              key={m.id}
              connectionId={connection.id}
              model={m}
              isSiteDefault={defaultId === `${connection.id}|${m.id}`}
              isTesting={testingModel === m.id}
              checkingAll={checkingAll}
              onToggleEnabled={toggleModelEnabled}
              onSetDefault={onSetDefault}
              onTestOne={handleTestOne}
              onDeleteModel={deleteModel}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AdminAddModelsModal
          connection={connection}
          onClose={() => setShowAddModal(false)}
          onSave={async (models) => {
            const def = connection.defaultModel || models[0]?.id || '';
            await onUpdateModels(connection.id, def, models);
            onReload();
          }}
          onError={onError}
        />
      )}
    </Card>
  );
}
