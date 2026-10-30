/** Карточка «Полезные ресурсы» в профиле: ссылка на страницу /resources. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconCompass } from '../layout/icons';

export function ResourcesCard() {
  const { t } = useTranslation();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('resources.title')}</SectionTitle>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t('resources.profileHint')}</p>
      <Link to="/resources" className="mt-3 inline-block">
        <Button size="sm" variant="secondary" icon={<IconCompass className="h-4 w-4" />}>
          {t('resources.profileLink')}
        </Button>
      </Link>
    </Card>
  );
}
