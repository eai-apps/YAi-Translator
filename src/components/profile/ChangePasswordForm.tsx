/** Смена пароля: после сохранения все другие устройства выходят из аккаунта. */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../hooks/useAccount';
import { useAccountErrorText } from '../../lib/accountError';
import { Button } from '../ui/Button';
import { PasswordField } from './PasswordField';

interface ChangePasswordFormProps {
  onDone: () => void;
}

export function ChangePasswordForm({ onDone }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const { changePassword } = useAccount();
  const errorText = useAccountErrorText();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await changePassword(oldPassword, newPassword);
      onDone();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-3 space-y-3 rounded-xl bg-soft p-3">
      <PasswordField
        label={t('account.oldPassword')}
        value={oldPassword}
        onChange={setOldPassword}
        visible={visible}
        onToggleVisible={() => setVisible((previous) => !previous)}
        autoComplete="current-password"
      />
      <PasswordField
        label={t('account.newPassword')}
        value={newPassword}
        onChange={setNewPassword}
        visible={visible}
        onToggleVisible={() => setVisible((previous) => !previous)}
        autoComplete="new-password"
      />
      <p className="text-xs leading-relaxed text-muted">{t('account.newPasswordHint')}</p>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="sm" loading={busy}>
          {t('account.savePassword')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
