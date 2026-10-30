/** Карточка «Сервисы сайта» в профиле: список сервисов и настоящая проверка. */
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { ServicesStatus } from '../about/ServicesStatus';

export function SiteServicesCard() {
  const { t } = useTranslation();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('services.title')}</SectionTitle>
      <p className="mt-2 text-xs leading-relaxed text-muted">{t('services.intro')}</p>
      <ServicesStatus />
    </Card>
  );
}
