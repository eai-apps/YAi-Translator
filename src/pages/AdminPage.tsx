/**
 * Страница /admin (ленивая загрузка): «Обзор», «Ключи сайта», «Ресурсы», «Грамматика», «Настройки», «Пользователи».
 * Открывается только администратору — сервер всё равно проверяет права на каждом запросе.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AdminOverview } from '../../shared/types';
import { api } from '../api/client';
import { useAccount } from '../hooks/useAccount';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Segmented';
import { Spinner } from '../components/ui/Spinner';
import { IconAlert, IconArrowLeft, IconLock } from '../components/layout/icons';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminKeysTab } from '../components/admin/AdminKeysTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminResourcesTab } from '../components/admin/AdminResourcesTab';
import { AdminGrammarTab } from '../components/admin/AdminGrammarTab';
import { AdminPaidTab } from '../components/admin/AdminPaidTab';
import { AdminLog } from '../components/admin/AdminLog';

type Tab = 'overview' | 'keys' | 'paid' | 'resources' | 'grammar' | 'settings' | 'users';

export default function AdminPage() {
  const { t } = useTranslation();
  const { account, status } = useAccount();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logKey, setLogKey] = useState(0);

  const isAdmin = account?.isAdmin === true;

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await api.adminOverview());
      setError(null);
    } catch {
      setError(t('admin.loadError'));
    }
  }, [t]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadOverview();
  }, [isAdmin, loadOverview]);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted">
        <Spinner />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  // Обычный пользователь видит понятное объяснение, а не пустую страницу.
  if (!isAdmin) {
    return (
      <>
        <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />
        <Card className="flex flex-col items-start gap-3 p-5">
          <div className="flex items-start gap-2 text-danger">
            <IconLock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{t('admin.denied')}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{t('admin.deniedHint')}</p>
            </div>
          </div>
          <Link to="/profile">
            <Button size="sm" variant="secondary" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('admin.backToProfile')}
            </Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
        action={
          <Link to="/profile">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('nav.profile')}
            </Button>
          </Link>
        }
      />

      <Segmented<Tab>
        ariaLabel={t('admin.tabsLabel')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: t('admin.tabOverview') },
          { value: 'keys', label: t('admin.tabKeys') },
          { value: 'paid', label: t('admin.tabPaid') },
          { value: 'resources', label: t('admin.tabResources') },
          { value: 'grammar', label: t('admin.tabGrammar') },
          { value: 'settings', label: t('admin.tabSettings') },
          { value: 'users', label: t('admin.tabUsers') },
        ]}
      />

      {error ? (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-danger">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}

      <div className="mt-3">
        {tab === 'overview' ? (
          overview ? (
            <AdminOverviewTab data={overview} />
          ) : (
            <div className="flex items-center gap-2 py-6 text-sm text-muted">
              <Spinner />
              <span>{t('common.loading')}</span>
            </div>
          )
        ) : null}

        {tab === 'keys' ? <AdminKeysTab onError={setError} /> : null}

        {tab === 'paid' ? <AdminPaidTab onError={setError} /> : null}

        {tab === 'resources' ? <AdminResourcesTab onError={setError} /> : null}

        {tab === 'grammar' ? <AdminGrammarTab onError={setError} /> : null}

        {tab === 'settings' ? (
          <AdminSettingsTab
            onError={setError}
            onSaved={() => {
              // Настройки влияют на «О приложении» и лимит в health — обновляем оба экрана.
              setLogKey((previous) => previous + 1);
              void loadOverview();
            }}
          />
        ) : null}

        {tab === 'users' ? <AdminUsersTab onError={setError} /> : null}
      </div>

      {tab === 'settings' || tab === 'users' || tab === 'resources' || tab === 'grammar' ? (
        <div className="mt-3">
          <AdminLog refreshKey={logKey + (tab === 'users' ? 1 : 0)} />
        </div>
      ) : null}
    </>
  );
}
