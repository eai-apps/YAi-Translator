/**
 * Форма входа и регистрации. Одна форма на две вкладки:
 * «Вход» проверяет логин и пароль, «Регистрация» создаёт аккаунт и сразу входит.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { lastLoginName, useAccount } from '../../hooks/useAccount';
import { useAccountErrorText } from '../../lib/accountError';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Segmented';
import { PasswordField } from './PasswordField';

type Mode = 'login' | 'register';

export function AccountForm() {
  const { t } = useTranslation();
  const { login, register } = useAccount();
  const errorText = useAccountErrorText();

  const [mode, setMode] = useState<Mode>('login');
  const [loginName, setLoginName] = useState(() => lastLoginName());
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(loginName, password);
      else await register(loginName, password);
      setPassword('');
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-3">
      <Segmented<Mode>
        ariaLabel={t('account.tabsLabel')}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setError(null);
        }}
        options={[
          { value: 'login', label: t('account.tabLogin') },
          { value: 'register', label: t('account.tabRegister') },
        ]}
      />

      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">{t('account.login')}</span>
          <input
            type="text"
            value={loginName}
            onChange={(event) => setLoginName(event.target.value)}
            autoComplete="username"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t('account.loginPlaceholder')}
            className="mt-1.5 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <PasswordField
          label={t('account.password')}
          value={password}
          onChange={setPassword}
          visible={visible}
          onToggleVisible={() => setVisible((previous) => !previous)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        {mode === 'register' ? t('account.registerHint') : t('account.sharedHint')}
      </p>

      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="sm" className="mt-3" loading={busy}>
        {mode === 'login' ? t('account.signIn') : t('account.createAccount')}
      </Button>
    </form>
  );
}
