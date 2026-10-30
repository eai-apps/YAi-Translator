/** Вкладка «Учёба» — на этапе 1 показывает экран «Скоро». */
import { useTranslation } from 'react-i18next';
import { SoonScreen } from '../components/layout/SoonScreen';
import { IconLearn } from '../components/layout/icons';

export default function LearnPage() {
  const { t } = useTranslation();

  return (
    <SoonScreen
      icon={<IconLearn className="h-9 w-9" />}
      title={t('soon.learnTitle')}
      text={t('soon.learnText')}
      features={[t('soon.feature1'), t('soon.feature2'), t('soon.feature3'), t('soon.feature4')]}
    />
  );
}
