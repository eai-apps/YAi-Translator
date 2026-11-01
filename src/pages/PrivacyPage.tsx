/**
 * Страница «Политика конфиденциальности» (/privacy).
 * Описывает правила хранения данных, используемые сервисы перевода,
 * удаление аккаунта и контактные данные.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionTitle } from '../components/ui/SectionTitle';
import { IconArrowLeft } from '../components/layout/icons';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('privacy.title')}
        subtitle={t('privacy.subtitle')}
        action={
          <Link to="/about">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('privacy.back')}
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {/* 1. Общие принципы */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('privacy.generalTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('privacy.generalText')}
          </p>
        </Card>

        {/* 2. Какие данные мы храним */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('privacy.storageTitle')}</SectionTitle>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
            <div className="rounded-xl bg-soft p-3.5">
              <p className="font-medium text-ink">{t('privacy.storageGuest')}</p>
            </div>
            <div className="rounded-xl bg-soft p-3.5">
              <p className="font-medium text-ink">{t('privacy.storageUser')}</p>
            </div>
          </div>
        </Card>

        {/* 3. Передача текста для перевода */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('privacy.servicesTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('privacy.servicesText')}
          </p>
        </Card>

        {/* 4. Удаление аккаунта и данных */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('privacy.deletionTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('privacy.deletionText')}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Link to="/profile">
              <Button size="sm" variant="secondary">
                {t('nav.profile')}
              </Button>
            </Link>
          </div>
        </Card>

        {/* 5. Контакты и Условия */}
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('privacy.contactTitle')}</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('privacy.contactText')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs text-muted">
            <span>{t('legal.title')}:</span>
            <Link to="/terms" className="font-medium text-accent hover:underline">
              {t('legal.terms')}
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
