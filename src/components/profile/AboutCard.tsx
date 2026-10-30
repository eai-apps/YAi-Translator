/** О приложении: лимиты бесплатного доступа, версия, приватность. */
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../config';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

export function AboutCard() {
  const { t } = useTranslation();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('profile.limitsTitle')}</SectionTitle>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t('profile.limitsTextFree')}</p>

      <div className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
        <p>
          {t('profile.versionLabel')}: {APP_VERSION}
        </p>
        <p>{t('profile.privacy')}</p>
        <p>{t('profile.privacyAccount')}</p>
      </div>
    </Card>
  );
}
