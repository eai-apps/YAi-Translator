/** Профиль и настройки. */
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui/PageHeader';
import { SettingsCard } from '../components/profile/SettingsCard';
import { KeysCard } from '../components/profile/KeysCard';
import { InstallCard } from '../components/profile/InstallCard';
import { AboutCard } from '../components/profile/AboutCard';

export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <div className="grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
        <SettingsCard />
        <KeysCard />
        <InstallCard />
        <AboutCard />
      </div>
    </>
  );
}
