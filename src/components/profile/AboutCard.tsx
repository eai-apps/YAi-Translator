/** Карточка «О приложении» в профиле: версия, приватность и ссылка на историю версий. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../config';
import { useAccount } from '../../hooks/useAccount';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconSparkles } from '../layout/icons';
import { AppVersionRow } from './AppVersionRow';

export function AboutCard() {
  const { t } = useTranslation();
  const { account } = useAccount();

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

      {/* Только в приложении Android: версия APK и «Проверить обновления». */}
      <AppVersionRow />

      {/* Ссылки «О приложении» и (только админу) «Админка». */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/about">
          <Button size="sm" variant="secondary">
            {t('profile.aboutLink')}
          </Button>
        </Link>
        {account?.isAdmin ? (
          <Link to="/admin">
            <Button size="sm" variant="primary" icon={<IconSparkles className="h-4 w-4" />}>
              {t('profile.openAdmin')}
            </Button>
          </Link>
        ) : null}
      </div>
      {account?.isAdmin ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{t('profile.adminHint')}</p>
      ) : null}
    </Card>
  );
}
