/**
 * Вкладка «Нейросети» в админке: общие платные подключения, порядок и лимиты токенов, ссылки покупки (этап 9).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminPaidConnectionsResponse, PaidConnectionItem, PaidModelOption } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { Spinner } from '../ui/Spinner';
import { AdminBuyLinksSection } from './AdminBuyLinksSection';
import { AdminAddPaidConnectionForm } from './AdminAddPaidConnectionForm';
import { AdminPaidConnectionCard } from './AdminPaidConnectionCard';

export function AdminPaidTab({ onError }: { onError: (msg: string | null) => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<'free_first' | 'paid_first' | 'paid_off'>('free_first');
  const [regOnly, setRegOnly] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [connections, setConnections] = useState<PaidConnectionItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.adminPaidConnections() as AdminPaidConnectionsResponse;
      setConnections(res.connections || []);
      setOrder(res.order);
      setRegOnly(res.regOnly);
      setDailyLimit(res.dailyLimit);
      setMonthlyLimit(res.monthlyLimit);
      setDefaultId(res.defaultId ?? null);
    } catch {
      onError(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveSettings = async () => {
    try {
      await api.adminPaidAction({ action: 'update-settings', order, regOnly, dailyLimit, monthlyLimit });
      setNotice(t('admin.paid.settingsSaved'));
      setTimeout(() => setNotice(null), 3000);
    } catch {
      onError(t('admin.saveError'));
    }
  };

  const handleSetDefault = async (value: string) => {
    try {
      await api.adminPaidAction({ action: 'set-default', value });
      setDefaultId(value || null);
    } catch {
      onError(t('admin.saveError'));
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await api.adminPaidAction({ action: 'delete', id });
      void load();
    } catch {
      onError(t('admin.saveError'));
    }
  };

  const handleUpdateModels = async (id: string, defaultModel: string, models: PaidModelOption[]) => {
    try {
      await api.adminPaidAction({ action: 'update-models', id, defaultModel, models });
    } catch {
      onError(t('admin.saveError'));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <SectionTitle>{t('admin.paid.routingTitle')}</SectionTitle>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="ai_order" checked={order === 'free_first'} onChange={() => setOrder('free_first')} />
            <span>{t('admin.paid.orderFreeFirst')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="ai_order" checked={order === 'paid_first'} onChange={() => setOrder('paid_first')} />
            <span>{t('admin.paid.orderPaidFirst')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="ai_order" checked={order === 'paid_off'} onChange={() => setOrder('paid_off')} />
            <span>{t('admin.paid.orderPaidOff')}</span>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
          <input type="checkbox" checked={regOnly} onChange={(e) => setRegOnly(e.target.checked)} className="h-4 w-4" />
          <span>{t('admin.paid.regOnly')}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs text-muted mb-1">{t('admin.paid.dailyTokens')}</label>
            <input
              type="number"
              min={0}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-line bg-card px-3 text-sm text-ink"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">{t('admin.paid.monthlyTokens')}</label>
            <input
              type="number"
              min={0}
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-line bg-card px-3 text-sm text-ink"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="primary" onClick={() => void saveSettings()}>
            {t('admin.settings.save')}
          </Button>
          {notice && <span className="text-xs text-success">{notice}</span>}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>{t('admin.paid.connectionsTitle')}</SectionTitle>
          <Button size="sm" variant="secondary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? t('common.cancel') : t('admin.paid.addConnection')}
          </Button>
        </div>

        {showAdd && (
          <AdminAddPaidConnectionForm
            onError={onError}
            onSaved={() => {
              setShowAdd(false);
              void load();
            }}
          />
        )}

        {loading ? (
          <Spinner />
        ) : connections.length === 0 ? (
          <p className="text-xs text-muted">{t('admin.paid.noConnections')}</p>
        ) : (
          <div className="space-y-3">
            {connections.map((c) => (
              <AdminPaidConnectionCard
                key={c.id}
                connection={c}
                defaultId={defaultId}
                onSetDefault={handleSetDefault}
                onDeleteConnection={handleDeleteConnection}
                onUpdateModels={handleUpdateModels}
                onError={onError}
                onReload={() => void load()}
              />
            ))}
          </div>
        )}
      </Card>

      <AdminBuyLinksSection onError={onError} />
    </div>
  );
}
