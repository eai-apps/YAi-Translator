/** Вкладка «Разговор» — на этапе 1 показывает экран «Скоро». */
import { useTranslation } from 'react-i18next';
import { SoonScreen } from '../components/layout/SoonScreen';
import { IconChat } from '../components/layout/icons';

export default function ConversationPage() {
  const { t } = useTranslation();

  return (
    <SoonScreen
      icon={<IconChat className="h-9 w-9" />}
      title={t('soon.conversationTitle')}
      text={t('soon.conversationText')}
      features={[t('soon.feature1'), t('soon.feature2'), t('soon.feature4')]}
    />
  );
}
