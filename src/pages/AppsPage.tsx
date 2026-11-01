/**
 * Страница «Приложения» (/apps), как в SlyNet Radio: Android — телефон, планшет и Android TV одним APK
 * (GitHub Releases), RuStore — скоро, iPhone/iPad (через Safari). Версия APK — из GitHub, версия содержимого — версия сайта:
 * приложение берёт экраны с сайта и обновляется само (см. HANDOFF, запись 0.12.1).
 */
import { useTranslation } from 'react-i18next';
import { useLatestRelease } from '../hooks/useLatestRelease';
import { AndroidCard, RuStoreCard } from '../components/apps/AndroidCards';
import { IosCard } from '../components/apps/IosCard';
import { IconPhone } from '../components/layout/icons';

export default function AppsPage() {
  const { t } = useTranslation();
  const { release, loading } = useLatestRelease();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
          <IconPhone className="h-3.5 w-3.5" />
          {t('apps.badge')}
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t('apps.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{t('apps.subtitle')}</p>
      </section>

      <AndroidCard release={release} loading={loading} />
      <RuStoreCard />
      <IosCard />
    </div>
  );
}
