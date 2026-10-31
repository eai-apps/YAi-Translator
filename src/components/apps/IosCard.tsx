/** Страница «Приложения»: iPhone и iPad — сайт на экране «Домой» через Safari (App Store — позже). */
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../config';
import { CHANGELOG } from '../../data/changelog';
import { Card } from '../ui/Card';
import { IconPhone } from '../layout/icons';
import { AppInfoRow, AppSteps } from './AppInfoRow';

export function IosCard() {
  const { t, i18n } = useTranslation();
  const raw = CHANGELOG[0]?.date;
  const date = raw ? new Date(raw).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-ink">
          <IconPhone className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t('apps.iosTitle')}</h2>
          <p className="text-sm text-muted">{t('apps.iosSubtitle')}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <AppInfoRow
          label={t('apps.iosVersion')}
          value={`v${APP_VERSION}`}
          hint={[date, t('apps.iosAuto')].filter(Boolean).join(' · ')}
        />
        <AppInfoRow label="App Store" value={t('apps.soon')} />
      </div>
      <AppSteps steps={[t('apps.iosStep1'), t('apps.iosStep2'), t('apps.iosStep3'), t('apps.iosStep4')]} />
    </Card>
  );
}
