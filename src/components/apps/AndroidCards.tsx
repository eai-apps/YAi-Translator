/**
 * Страница «Приложения»: карточки Android (телефон/планшет) и Android TV — один и тот же APK.
 * Внутри приложения вместо кнопки скачивания — установленная версия и «Проверить обновления».
 */
import { useTranslation } from 'react-i18next';
import { APP_VERSION, storeBuild } from '../../config';
import { CHANGELOG } from '../../data/changelog';
import { APK_URL, type LatestRelease } from '../../hooks/useLatestRelease';
import { Card } from '../ui/Card';
import { IconDownload, IconPhone, IconTv } from '../layout/icons';
import { AppVersionRow } from '../profile/AppVersionRow';
import { AppInfoRow, AppSteps } from './AppInfoRow';

interface CardsProps {
  release: LatestRelease | null;
  loading: boolean;
}

function formatDate(iso: string | null, language: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function DownloadButton({ label }: { label: string }) {
  return (
    <a
      href={APK_URL}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-base font-semibold text-accentInk shadow-card transition hover:opacity-90"
    >
      <IconDownload className="h-5 w-5" />
      {label}
    </a>
  );
}

function ApkRow({ release, loading }: CardsProps) {
  const { t, i18n } = useTranslation();
  const date = formatDate(release?.date ?? null, i18n.language);
  const hint = [date, release?.sizeMb ? t('apps.sizeMb', { size: release.sizeMb }) : null].filter(Boolean).join(' · ');
  return (
    <AppInfoRow
      label={t('apps.latestApk')}
      value={loading ? '…' : release ? `v${release.version}` : '—'}
      hint={hint || undefined}
    />
  );
}

function ContentRow() {
  const { t, i18n } = useTranslation();
  const date = formatDate(CHANGELOG[0]?.date ?? null, i18n.language);
  return (
    <AppInfoRow
      label={t('apps.contentUpdate')}
      value={`v${APP_VERSION}`}
      hint={[date, t('apps.contentAuto')].filter(Boolean).join(' · ')}
    />
  );
}

export function AndroidCard(props: CardsProps) {
  const { t } = useTranslation();
  const inApp = storeBuild() === 'android';
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-success">
          <IconPhone className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Android</h2>
          <p className="text-sm text-muted">{t('apps.androidSubtitle')}</p>
        </div>
      </div>

      <div className="mt-4">
        {inApp ? (
          <p className="rounded-xl bg-accentSoft px-3.5 py-3 text-sm font-medium text-accent">✓ {t('apps.inAppNote')}</p>
        ) : (
          <DownloadButton label={t('apps.downloadAndroid')} />
        )}
      </div>

      <div className="mt-3 space-y-2">
        <ApkRow {...props} />
        <AppInfoRow label="Google Play" value={t('apps.soon')} hint={t('apps.sameVersion')} />
        <ContentRow />
      </div>

      {inApp ? <AppVersionRow /> : <AppSteps steps={[t('apps.androidStep1'), t('apps.androidStep2'), t('apps.androidStep3')]} />}
    </Card>
  );
}

export function TvCard(props: CardsProps) {
  const { t } = useTranslation();
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accentSoft text-accent">
          <IconTv className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Android TV</h2>
          <p className="text-sm text-muted">{t('apps.tvSubtitle')}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <ApkRow {...props} />
        <AppInfoRow label={t('apps.tvLink')} value={<span className="select-all break-all text-xs font-medium">{APK_URL}</span>} />
      </div>
      <AppSteps steps={[t('apps.tvStep1'), t('apps.tvStep2'), t('apps.tvStep3')]} />
    </Card>
  );
}
