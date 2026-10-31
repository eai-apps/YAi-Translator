/**
 * Карточка «Аккаунт». Один логин и пароль работают на всех устройствах:
 * ключи ИИ, избранное и история у вошедшего пользователя везде одинаковые.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../hooks/useAccount';
import { useAccountErrorText } from '../../lib/accountError';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { Spinner } from '../ui/Spinner';
import { IconUser } from '../layout/icons';
import { AccountForm } from './AccountForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { SessionList } from './SessionList';

export function AccountCard() {
  const { t } = useTranslation();
  const { status, account, logout, logoutAll } = useAccount();
  const errorText = useAccountErrorText();
  const [busy, setBusy] = useState<'logout' | 'logoutAll' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const run = async (action: 'logout' | 'logoutAll') => {
    setBusy(action);
    setError(null);
    try {
      if (action === 'logout') await logout();
      else await logoutAll();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('account.title')}</SectionTitle>

      {status === 'loading' ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Spinner />
          <span>{t('common.loading')}</span>
        </div>
      ) : null}

      {status === 'anonymous' ? (
        <>
          <div className="mt-3 rounded-xl border border-line bg-soft p-3 text-xs leading-relaxed">
            <p className="font-semibold text-ink">{t('account.benefitsTitle')}</p>
            <ul className="mt-1.5 space-y-1 text-muted list-disc list-inside">
              <li>{t('account.benefitAiLimit')}</li>
              <li>{t('account.benefitHistory')}</li>
              <li>{t('account.benefitPaidAi')}</li>
              <li>{t('account.benefitSync')}</li>
            </ul>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t('account.intro')} <span className="text-ink">{t('account.sharedHint')}</span>
          </p>
          <AccountForm />
        </>
      ) : null}

      {status === 'signedIn' && account ? (
        <>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accentSoft text-accent">
              <IconUser className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{account.login}</p>
              <p className="text-xs text-muted">{t('account.signedIn')}</p>
            </div>
          </div>

          <div className="mt-4">
            <SectionTitle>{t('account.devices')}</SectionTitle>
            <SessionList sessions={account.sessions} />
          </div>

          {error ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {passwordChanged ? (
            <p className="mt-3 text-sm text-success">{t('account.passwordChanged')}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" loading={busy === 'logout'} onClick={() => void run('logout')}>
              {t('account.signOut')}
            </Button>
            <Button size="sm" loading={busy === 'logoutAll'} onClick={() => void run('logoutAll')}>
              {t('account.signOutAll')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setChanging((previous) => !previous);
                setPasswordChanged(false);
              }}
            >
              {t('account.changePassword')}
            </Button>
          </div>

          {changing ? (
            <ChangePasswordForm
              onDone={() => {
                setChanging(false);
                setPasswordChanged(true);
                setError(null);
              }}
            />
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
