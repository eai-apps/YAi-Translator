/** Страница «Справка» (этап 8): 10 частых вопросов короткими блоками и ссылка в профиль. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { IconArrowLeft } from '../components/layout/icons';

/** Номера вопросов в порядке показа. */
const QUESTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function HelpPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('help.title')}
        subtitle={t('help.subtitle')}
        action={
          <Link to="/profile">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('help.backToProfile')}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-4">
        {QUESTIONS.map((number) => (
          <Card key={number} className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold leading-snug">{t(`help.q${number}`)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`help.a${number}`)}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
