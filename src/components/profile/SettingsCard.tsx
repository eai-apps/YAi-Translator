/** Язык интерфейса и тема. */
import { useTranslation } from 'react-i18next';
import type { UiLanguage } from '../../../shared/types';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { Segmented } from '../ui/Segmented';

export function SettingsCard() {
  const { t } = useTranslation();
  const { uiLanguage, setUiLanguage } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('profile.interfaceLanguage')}</SectionTitle>
      <Segmented<UiLanguage>
        className="mt-2"
        ariaLabel={t('profile.interfaceLanguage')}
        value={uiLanguage}
        onChange={setUiLanguage}
        options={[
          { value: 'ru', label: t('languages.ru') },
          { value: 'de', label: t('languages.de') },
          { value: 'en', label: t('languages.en') },
        ]}
      />

      <div className="mt-5">
        <SectionTitle>{t('profile.theme')}</SectionTitle>
        <Segmented<ThemeMode>
          className="mt-2"
          ariaLabel={t('profile.theme')}
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: t('profile.themeLight') },
            { value: 'dark', label: t('profile.themeDark') },
            { value: 'system', label: t('profile.themeSystem') },
          ]}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted">{t('profile.themeHint')}</p>
      </div>
    </Card>
  );
}
