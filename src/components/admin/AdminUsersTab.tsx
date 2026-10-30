/** Вкладка «Пользователи»: список, блокировка и удаление аккаунтов. */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminUserItem } from '../../../shared/types';
import { api } from '../../api/client';
import { useAccount } from '../../hooks/useAccount';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

interface UsersTabProps {
  onError: (message: string | null) => void;
}

export function AdminUsersTab({ onError }: UsersTabProps) {
  const { t, i18n } = useTranslation();
  const { account } = useAccount();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.adminUsers();
      setUsers(data.users);
      onError(null);
    } catch {
      onError(t('admin.loadError'));
    }
  }, [onError, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (login: string, action: 'block' | 'unblock' | 'delete') => {
    if (action === 'delete' && !window.confirm(t('admin.users.confirmRemove', { login }))) return;
    setBusy(`${action}-${login}`);
    try {
      await api.adminUserAction({ login, action });
      await load();
    } catch {
      onError(t('admin.loadError'));
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (value: number | null): string => {
    if (!value) return t('admin.users.never');
    return new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionTitle>{t('admin.users.title')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.users.intro')}</p>
        {users.length === 0 ? <p className="mt-2 text-sm text-muted">{t('admin.users.empty')}</p> : null}
      </Card>

      {users.map((user) => {
        const isSelf = account?.login === user.login;
        return (
          <Card key={user.login} className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="truncate font-semibold">{user.login}</p>
              {isSelf ? (
                <span className="rounded-full bg-accentSoft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                  {t('admin.users.self')}
                </span>
              ) : null}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  user.blocked ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                }`}
              >
                {user.blocked ? t('admin.users.blocked') : t('admin.users.active')}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted sm:grid-cols-4">
              <span>
                {t('admin.users.registered')}: {formatDate(user.createdAt)}
              </span>
              <span>
                {t('admin.users.lastLogin')}: {formatDate(user.lastLoginAt)}
              </span>
              <span>
                {t('admin.users.devices')}: {user.devices}
              </span>
              <span>
                {t('admin.users.ownKeys')}: {user.hasKeys ? t('admin.users.yes') : t('admin.users.no')}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={busy === `${user.blocked ? 'unblock' : 'block'}-${user.login}`}
                disabled={isSelf}
                onClick={() => void act(user.login, user.blocked ? 'unblock' : 'block')}
              >
                {user.blocked ? t('admin.users.unblock') : t('admin.users.block')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={busy === `delete-${user.login}`}
                disabled={isSelf}
                onClick={() => void act(user.login, 'delete')}
              >
                {t('admin.users.remove')}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
