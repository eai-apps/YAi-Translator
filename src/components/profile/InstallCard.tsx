/** Установка PWA на телефон. */
import { useTranslation } from 'react-i18next';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconCheck, IconMonitor } from '../layout/icons';

export function InstallCard() {
  const { t } = useTranslation();
  const { isStandalone, canInstall, install } = useInstallPrompt();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('profile.installTitle')}</SectionTitle>

      {isStandalone ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-success">
          <IconCheck className="h-4 w-4" />
          {t('profile.installed')}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t('profile.installText')}</p>
          {canInstall ? (
            <Button
              size="sm"
              variant="primary"
              className="mt-3"
              icon={<IconMonitor className="h-4 w-4" />}
              onClick={() => void install()}
            >
              {t('profile.installButton')}
            </Button>
          ) : (
            <p className="mt-3 rounded-xl bg-soft px-3 py-2.5 text-xs leading-relaxed text-muted">
              {t('profile.installIos')}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
