/**
 * Вкладка «Нейросети» в админке: общие платные подключения, порядок и лимиты токенов, ссылки покупки.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PaidConnectionItem } from '../../../shared/types';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { Spinner } from '../ui/Spinner';
import { IconTrash } from '../layout/icons';
import { AdminBuyLinksSection } from './AdminBuyLinksSection';
import { AdminAddPaidConnectionForm } from './AdminAddPaidConnectionForm';

export function AdminPaidTab({ onError }: { onError: (msg: string | null) => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<'free_first' | 'paid_first' | 'paid_off'>('free_first');
  const [regOnly, setRegOnly] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [connections, setConnections] = useState<PaidConnectionItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.adminPaidConnections();
      setConnections(res.connections);
      setOrder(res.order);
      setRegOnly(res.regOnly);
      setDailyLimit(res.dailyLimit);
      setMonthlyLimit(res.monthlyLimit);
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

  const handleTest = async (conn: PaidConnectionItem) => {
    try {
      setTestResult((prev) => ({ ...prev, [conn.id]: t('common.loading') }));
      const res = await api.adminPaidAction<{ ok: boolean; reply?: string; error?: string }>({
        action: 'test',
        id: conn.id,
      });
      setTestResult((prev) => ({ ...prev, [conn.id]: res.ok ? t('admin.paid.testSuccess') : String(res.error) }));
    } catch {
      setTestResult((prev) => ({ ...prev, [conn.id]: t('admin.paid.testFail') }));
    }
  };

  const handleCredits = async (id: string) => {
    try {
      const res = await api.adminPaidAction<{ ok: boolean; credits?: { limit?: number; usage?: number } }>({
        action: 'credits',
        id,
      });
      if (res.credits) {
        alert(t('admin.paid.creditsAlert', { limit: res.credits.limit ?? '-', usage: res.credits.usage ?? '-' }));
      }
    } catch {
      alert(t('admin.paid.creditsFail'));
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
          <div className="space-y-2">
            {connections.map((c) => (
              <div key={c.id} className="p-3 border border-line rounded-xl flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted">({c.defaultModel})</span>
                  </div>
                  <div className="text-xs text-muted">{c.baseUrl}</div>
                  {testResult[c.id] && <div className="text-xs mt-1 text-ink">{testResult[c.id]}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => void handleTest(c)}>
                    {t('admin.paid.testBtn')}
                  </Button>
                  {c.baseUrl.includes('openrouter') && (
                    <Button size="sm" variant="ghost" onClick={() => void handleCredits(c.id)}>
                      {t('admin.paid.creditsBtn')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(t('common.confirmDelete'))) {
                        await api.adminPaidAction({ action: 'delete', id: c.id });
                        void load();
                      }
                    }}
                  >
                    <IconTrash className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AdminBuyLinksSection onError={onError} />
    </div>
  );
}
