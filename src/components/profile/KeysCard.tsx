/** Свои ключи Gemini и Groq: проверка и хранение только на устройстве. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKeyTest } from '../../hooks/useKeyTest';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconCheck, IconLock } from '../layout/icons';

type KeyProvider = 'gemini' | 'groq';

function KeyField({ provider, title }: { provider: KeyProvider; title: string }) {
  const { t } = useTranslation();
  const { keys, saveKey, removeKey } = useSettings();
  const saved = keys[provider];
  const [value, setValue] = useState(saved);
  const [savedNotice, setSavedNotice] = useState(false);
  const { status, latencyMs, test, reset } = useKeyTest();

  useEffect(() => {
    setValue(saved);
  }, [saved]);

  useEffect(() => {
    reset();
  }, [value, reset]);

  useEffect(() => {
    if (!savedNotice) return;
    const timer = window.setTimeout(() => setSavedNotice(false), 2200);
    return () => window.clearTimeout(timer);
  }, [savedNotice]);

  const handleSave = () => {
    saveKey(provider, value);
    setSavedNotice(true);
  };

  return (
    <div className="mt-4 first:mt-3">
      <label className="block">
        <span className="text-sm font-medium">{title}</span>
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('profile.keyPlaceholder')}
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={handleSave} disabled={!value.trim()}>
          {t('profile.saveKey')}
        </Button>
        <Button
          size="sm"
          loading={status === 'testing'}
          onClick={() => void test(provider, value)}
          disabled={!value.trim()}
        >
          {status === 'testing' ? t('profile.testing') : t('profile.testKey')}
        </Button>
        {saved ? (
          <Button size="sm" variant="danger" onClick={() => removeKey(provider)}>
            {t('profile.removeKey')}
          </Button>
        ) : null}
      </div>

      <div className="mt-1.5 min-h-[18px] text-xs" aria-live="polite">
        {savedNotice ? (
          <span className="inline-flex items-center gap-1 text-success">
            <IconCheck className="h-3.5 w-3.5" />
            {t('profile.keySaved')}
          </span>
        ) : null}
        {!savedNotice && status === 'ok' ? (
          <span className="text-success">
            {t('profile.keyOk')}
            {latencyMs ? ` · ${latencyMs} ms` : ''}
          </span>
        ) : null}
        {!savedNotice && status === 'fail' ? (
          <span className="text-danger">{t('profile.keyFail')}</span>
        ) : null}
      </div>
    </div>
  );
}

export function KeysCard() {
  const { t } = useTranslation();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('profile.keysTitle')}</SectionTitle>
      <p className="mt-2 text-xs leading-relaxed text-muted">{t('profile.keysHint')}</p>

      <KeyField provider="gemini" title={t('profile.geminiKey')} />
      <div className="my-3 border-t border-line" />
      <KeyField provider="groq" title={t('profile.groqKey')} />

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
        <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t('profile.privacy')}</span>
      </p>
    </Card>
  );
}
