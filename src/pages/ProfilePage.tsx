/** Профиль: аккаунт, свои ключи ИИ, сервисы сайта, настройки, установка, о приложении. */
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/ui/PageHeader';
import { AccountCard } from '../components/profile/AccountCard';
import { KeysCard } from '../components/profile/KeysCard';
import { SiteServicesCard } from '../components/profile/SiteServicesCard';
import { SettingsCard } from '../components/profile/SettingsCard';
import { InstallCard } from '../components/profile/InstallCard';
import { AboutCard } from '../components/profile/AboutCard';
import { ResourcesCard } from '../components/profile/ResourcesCard';

export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-4">
        <AccountCard />
        <KeysCard />
        <SiteServicesCard />
        <SettingsCard />
        <ResourcesCard />
        <InstallCard />
        <AboutCard />
      </div>
    </>
  );
}
