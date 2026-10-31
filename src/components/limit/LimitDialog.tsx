/** Окно «Подключи свой бесплатный ключ»: тот же мастер, что и в профиле. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../hooks/useAccount';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';
import { KeyWizard } from '../keys/KeyWizard';
import type { KeyProvider } from '../../../shared/types';

interface LimitDialogProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после сохранения ключа, чтобы повторить перевод. */
  onSaved?: () => void;
}

export function LimitDialog({ open, onClose, onSaved }: LimitDialogProps) {
  const { t } = useTranslation();
  const { account } = useAccount();
  const [provider, setProvider] = useState<KeyProvider>('gemini');

  const handleSaved = () => {
    onSaved?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('limit.title')}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('limit.later')}
          </Button>
        </div>
      }
    >
      {!account ? (
        <div className="mb-4 rounded-xl border border-accent/20 bg-accent/10 p-3 text-sm">
          <p className="font-medium text-ink">{t('limit.guestPromptTitle')}</p>
          <p className="mt-1 text-xs text-muted">{t('limit.guestPromptText')}</p>
          <Link to="/profile" onClick={onClose} className="mt-2 inline-block">
            <Button size="sm" variant="primary">
              {t('limit.registerBtn')}
            </Button>
          </Link>
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-muted">{t('limit.text')}</p>

      <div className="mt-4">
        <Segmented<KeyProvider>
          ariaLabel={t('limit.guideTitle')}
          value={provider}
          onChange={setProvider}
          options={[
            { value: 'gemini', label: t('limit.tabGemini') },
            { value: 'groq', label: t('limit.tabGroq') },
          ]}
        />
      </div>

      <div className="mt-3">
        {/* key: мастер пересоздаётся при смене сервиса, чтобы не перепутать ключи. */}
        <KeyWizard key={provider} provider={provider} showAccountHint={false} onSaved={handleSaved} />
      </div>
    </Modal>
  );
}
