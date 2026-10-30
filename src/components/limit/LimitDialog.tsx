/** Окно «Подключи свой бесплатный ключ»: тот же мастер, что и в профиле. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
