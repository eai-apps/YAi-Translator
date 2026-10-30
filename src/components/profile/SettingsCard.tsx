/** Язык интерфейса, тема и другие переводчики под переводом. */
import { useTranslation } from 'react-i18next';
import type { UiLanguage } from '../../../shared/types';
import { STORAGE_KEYS } from '../../config';
import { useLocalStorage } from '../../hooks/useLocalStorage';
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
  // По умолчанию включено: блок «Как переводят другие» появляется сам.
  const [showOthers, setShowOthers] = useLocalStorage<boolean>(STORAGE_KEYS.showOthers, true);

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

      <div className="mt-5 border-t border-line pt-4">
        <SectionTitle>{t('profile.otherTranslatorsTitle')}</SectionTitle>
        <label className="mt-2 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={showOthers}
            onChange={(event) => setShowOthers(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
          />
          <span className="text-sm leading-relaxed">{t('profile.showOthers')}</span>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t('profile.showOthersHint')}</p>
      </div>
    </Card>
  );
}
