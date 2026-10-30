/** Окно «Подключи свой бесплатный ключ» с пошаговым мастером. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyTest } from '../../hooks/useKeyTest';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';
import { IconCheck, IconLock } from '../layout/icons';

type KeyProvider = 'gemini' | 'groq';

const LINKS: Record<KeyProvider, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  groq: 'https://console.groq.com/keys',
};

interface LimitDialogProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после сохранения ключа, чтобы повторить перевод. */
  onSaved?: () => void;
}

export function LimitDialog({ open, onClose, onSaved }: LimitDialogProps) {
  const { t } = useTranslation();
  const { saveKey } = useSettings();
  const [provider, setProvider] = useState<KeyProvider>('gemini');
  const [key, setKey] = useState('');
  const { status, latencyMs, test, reset } = useKeyTest();

  // При смене провайдера или ключа старое «ключ работает» больше не действует.
  useEffect(() => {
    reset();
  }, [provider, key, reset]);

  useEffect(() => {
    if (!open) {
      setKey('');
      setProvider('gemini');
    }
  }, [open]);

  const steps =
    provider === 'gemini'
      ? [t('limit.geminiStep1'), t('limit.geminiStep2'), t('limit.geminiStep3')]
      : [t('limit.groqStep1'), t('limit.groqStep2'), t('limit.groqStep3')];

  const providerName = provider === 'gemini' ? 'Gemini' : 'Groq';

  const handleSave = () => {
    saveKey(provider, key);
    onClose();
    onSaved?.();
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
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={status !== 'ok'}
            icon={<IconCheck className="h-4 w-4" />}
          >
            {t('limit.saveAndUse')}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{t('limit.text')}</p>

      <div className="mt-4">
        <Segmented
          ariaLabel={t('limit.guideTitle')}
          value={provider}
          onChange={setProvider}
          options={[
            { value: 'gemini', label: t('limit.tabGemini') },
            { value: 'groq', label: t('limit.tabGroq') },
          ]}
        />
      </div>

      <section className="mt-4">
        <h3 className="text-sm font-semibold">{t('limit.guideTitle')}</h3>
        <ol className="mt-2 space-y-1.5">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-2 text-sm text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentSoft text-[11px] font-semibold text-accent">
                {index + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <a
          href={LINKS[provider]}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-9 items-center rounded-xl border border-line bg-card px-3 text-sm font-medium text-accent hover:bg-soft"
        >
          {provider === 'gemini' ? t('limit.openGoogle') : t('limit.openGroq')}
        </a>
      </section>

      <label className="mt-4 block">
        <span className="text-sm font-medium">{t('limit.keyLabel', { provider: providerName })}</span>
        <input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder={t('limit.keyPlaceholder')}
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          loading={status === 'testing'}
          onClick={() => void test(provider, key)}
          disabled={!key.trim()}
        >
          {status === 'testing' ? t('limit.checking') : t('limit.checkKey')}
        </Button>
        {status === 'ok' ? (
          <span className="text-sm text-success">
            {t('limit.keyOk')}
            {latencyMs ? ` · ${latencyMs} ms` : ''}
          </span>
        ) : null}
        {status === 'fail' ? <span className="text-sm text-danger">{t('limit.keyFail')}</span> : null}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
        <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t('limit.privacyNote')}</span>
      </p>
    </Modal>
  );
}
