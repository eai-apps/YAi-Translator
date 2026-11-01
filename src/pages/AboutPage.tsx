/** Страница «О приложении»: логотип, описание, версия, сервисы и история версий. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../config';
import { useSettings } from '../hooks/useSettings';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionTitle } from '../components/ui/SectionTitle';
import { IconArrowLeft } from '../components/layout/icons';
import { Logo } from '../components/layout/Logo';
import { ChangelogList, ServicesStatus } from '../components/about/ServicesStatus';
import { DictionarySources } from '../components/about/DictionarySources';

export default function AboutPage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();

  return (
    <>
      <PageHeader
        title={t('about.title')}
        subtitle={t('about.subtitle')}
        action={
          <Link to="/profile">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('nav.profile')}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div className="min-w-0">
              <p className="text-lg font-semibold">{t('common.appName')}</p>
              <p className="text-xs text-muted">
                {t('about.versionLabel')} {APP_VERSION}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t('about.description')}</p>
          <div className="mt-4 space-y-2 rounded-xl bg-soft p-3.5">
            <p className="text-sm font-semibold text-ink">{t('translate.tagline')}</p>
            <p className="text-xs leading-relaxed text-muted">{t('translate.taglineSub')}</p>
            <p className="text-xs font-medium text-accent">★ {t('translate.taglineGuest')}</p>
          </div>
          <div className="mt-3 rounded-xl bg-soft p-3">
            <p className="text-sm font-semibold">{t('about.freelyTitle')}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{t('about.freelyText')}</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('about.servicesTitle')}</SectionTitle>
          <ServicesStatus />
        </Card>

        <Card className="p-4 sm:p-5">
          <DictionarySources />
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('legal.title')}</SectionTitle>
          <p className="mt-2 text-xs leading-relaxed text-muted">{t('legal.desc')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/privacy">
              <Button size="sm" variant="secondary">
                {t('legal.privacy')}
              </Button>
            </Link>
            <Link to="/terms">
              <Button size="sm" variant="secondary">
                {t('legal.terms')}
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <ChangelogList uiLang={uiLanguage} />
        </Card>
      </div>
    </>
  );
}
