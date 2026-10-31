/**
 * Только приложение Android: версия установленного APK и кнопка «Проверить обновления».
 * Экраны приложения обновляются сами (грузятся с сайта); здесь — только сам APK.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storeBuild } from '../../config';
import { APP_UPDATE_EVENT, checkAppUpdate, installedApp, type InstalledApp } from '../../lib/appUpdate';
import { Button } from '../ui/Button';

type Status = 'idle' | 'checking' | 'latest' | 'update' | 'offline';

export function AppVersionRow() {
  const { t } = useTranslation();
  const [installed, setInstalled] = useState<InstalledApp | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [latestName, setLatestName] = useState('');
  const isAndroid = storeBuild() === 'android';

  useEffect(() => {
    if (isAndroid) void installedApp().then(setInstalled);
  }, [isAndroid]);

  if (!isAndroid) return null;

  const check = async () => {
    setStatus('checking');
    const result = await checkAppUpdate();
    if (!result || !result.latest) {
      setStatus('offline');
      return;
    }
    setInstalled(result.installed);
    if (result.hasUpdate) {
      setLatestName(result.latest.versionName);
      setStatus('update');
      window.dispatchEvent(new CustomEvent(APP_UPDATE_EVENT, { detail: result.latest }));
    } else {
      setStatus('latest');
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>
        {t('appUpdate.installed', { version: installed?.name ?? '…', build: installed?.code ?? '…' })}
      </span>
      <Button size="sm" variant="secondary" onClick={() => void check()} disabled={status === 'checking'}>
        {status === 'checking' ? t('appUpdate.checking') : t('appUpdate.check')}
      </Button>
      {status === 'latest' ? <span className="font-medium text-success">✓ {t('appUpdate.latest')}</span> : null}
      {status === 'update' ? (
        <span className="font-medium text-accent">{t('appUpdate.available', { version: latestName })}</span>
      ) : null}
      {status === 'offline' ? <span className="text-danger">{t('appUpdate.offline')}</span> : null}
      <p className="w-full">{t('appUpdate.autoNote')}</p>
    </div>
  );
}
