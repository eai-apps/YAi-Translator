/**
 * Вкладка «Учёба» — на этапе 1 показывает экран «Скоро».
 * Этап 5: внизу на телефоне пять вкладок, поэтому справочник грамматики живёт внутри «Учёбы».
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SoonScreen } from '../components/layout/SoonScreen';
import { IconBook, IconLearn } from '../components/layout/icons';

interface LearnPageProps {
  /** Показывает ссылку на справочник грамматики (этап 5). */
  withGrammarLink?: boolean;
}

export default function LearnPage({ withGrammarLink = false }: LearnPageProps) {
  const { t } = useTranslation();

  return (
    <>
      <SoonScreen
        icon={<IconLearn className="h-9 w-9" />}
        title={t('soon.learnTitle')}
        text={t('soon.learnText')}
        features={[t('soon.feature1'), t('soon.feature2'), t('soon.feature3'), t('soon.feature4')]}
      />
      {withGrammarLink ? (
        <div className="-mt-10 flex justify-center pb-4">
          <Link
            to="/grammar"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <IconBook className="h-4 w-4" />
            {t('learn.grammarLink')}
          </Link>
        </div>
      ) : null}
    </>
  );
}
