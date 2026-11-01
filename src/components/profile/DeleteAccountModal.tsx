/**
 * Модальное окно полного удаления аккаунта (требование магазинов приложений).
 * Запрашивает пароль для подтверждения и предупреждает о безвозвратности.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../hooks/useAccount';
import { useAccountErrorText } from '../../lib/accountError';
import { Button } from '../ui/Button';
import { IconAlert, IconTrash } from '../layout/icons';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const { deleteAccount } = useAccount();
  const errorText = useAccountErrorText();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-2xl">
        <div className="flex items-center gap-2.5 text-danger">
          <IconAlert className="h-6 w-6 shrink-0" />
          <h2 id="delete-account-title" className="text-base font-semibold text-ink">
            {t('account.deleteTitle')}
          </h2>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted">
          {t('account.deleteWarning')}
        </p>

        <form onSubmit={(e) => void handleDelete(e)} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink">
              {t('account.deleteConfirmPassword')}
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink outline-none focus:border-danger"
            />
          </div>

          {error ? (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" disabled={busy} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              type="submit"
              loading={busy}
              icon={<IconTrash className="h-4 w-4" />}
            >
              {t('account.deleteConfirmBtn')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
