/**
 * Страница «Условия использования» (/terms).
 * Описывает правила предоставления сервиса, отказ от юридической ответственности,
 * открытые лицензии и контакты.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionTitle } from '../components/ui/SectionTitle';
import { IconArrowLeft } from '../components/layout/icons';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('terms.title')}
        subtitle={t('terms.subtitle')}
        action={
          <Link to="/about">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('terms.back')}
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {/* 1. Описание сервиса */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('terms.serviceTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('terms.serviceText')}
          </p>
        </Card>

        {/* 2. Отказ от ответственности */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('terms.disclaimerTitle')}</SectionTitle>
          <div className="mt-2 rounded-xl bg-soft p-3.5 text-sm leading-relaxed text-muted">
            <p className="font-medium text-ink">{t('terms.disclaimerText')}</p>
          </div>
        </Card>

        {/* 3. Правила использования */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('terms.rulesTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('terms.rulesText')}
          </p>
        </Card>

        {/* 4. Интеллектуальная собственность */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('terms.ipTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('terms.ipText')}
          </p>
          <div className="mt-3">
            <Link to="/about">
              <Button size="sm" variant="secondary">
                {t('about.servicesTitle')}
              </Button>
            </Link>
          </div>
        </Card>

        {/* 5. Изменение условий и контакты */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('terms.changesTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('terms.changesText')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs text-muted">
            <span>{t('legal.title')}:</span>
            <Link to="/privacy" className="font-medium text-accent hover:underline">
              {t('legal.privacy')}
            </Link>
            <span>·</span>
            <Link to="/about" className="font-medium text-accent hover:underline">
              {t('nav.about')}
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
