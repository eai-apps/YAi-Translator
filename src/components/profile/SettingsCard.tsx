/**
 * Настройки профиля (этап 8): язык интерфейса, тема и переключатели перевода —
 * история, определение языка, подсказки, Enter, «Как переводят другие».
 * Ниже — офлайн-режим и ссылки «О приложении», «Обратная связь», «Справка».
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UiLanguage } from '../../../shared/types';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';
import { useTranslateSettings } from '../../hooks/useTranslateSettings';
import { isReminderSupported, readReminderSettings, writeReminderSettings, type ReminderSettings } from '../../lib/dailyReminder';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { Segmented } from '../ui/Segmented';
import { Toggle } from '../ui/Toggle';
import { OfflineCard } from './OfflineCard';
import { SettingsLinks } from './SettingsLinks';

export function SettingsCard() {
  const { t } = useTranslation();
  const { uiLanguage, setUiLanguage } = useSettings();
  const { theme, setTheme } = useTheme();
  const { settings, update } = useTranslateSettings();
  const [reminder, setReminder] = useState<ReminderSettings>(readReminderSettings);

  const handleReminderToggle = async (val: boolean) => {
    const next = { ...reminder, enabled: val };
    setReminder(next);
    // Нет разрешения на уведомления — переключатель возвращается в «выключено».
    const ok = await writeReminderSettings(next);
    if (!ok) setReminder(readReminderSettings());
  };

  const handleReminderTime = async (time: string) => {
    const next = { ...reminder, time };
    setReminder(next);
    await writeReminderSettings(next);
  };

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

      {/* Переключатели перевода — как в Яндекс.Переводчике. */}
      <div className="mt-5 border-t border-line pt-4">
        <SectionTitle>{t('profile.settingsTitle')}</SectionTitle>
        <div className="mt-1 divide-y divide-line">
          <Toggle
            label={t('profile.saveHistory')}
            hint={t('profile.saveHistoryHint')}
            checked={settings.saveHistory}
            onChange={(value) => update({ saveHistory: value })}
          />
          <Toggle
            label={t('profile.detectLanguage')}
            hint={t('profile.detectLanguageHint')}
            checked={settings.detectLanguage}
            onChange={(value) => update({ detectLanguage: value })}
          />
          <Toggle
            label={t('profile.suggestions')}
            hint={t('profile.suggestionsHint')}
            checked={settings.suggestions}
            onChange={(value) => update({ suggestions: value })}
          />
          <Toggle
            label={t('profile.enterToTranslate')}
            hint={t('profile.enterToTranslateHint')}
            checked={settings.enterToTranslate}
            onChange={(value) => update({ enterToTranslate: value })}
          />
          <Toggle
            label={t('profile.showOthers')}
            hint={t('profile.showOthersHint')}
            checked={settings.showOthers}
            onChange={(value) => update({ showOthers: value })}
          />
          <Toggle
            label={t('profile.quizEnabled')}
            hint={t('profile.quizEnabledHint')}
            checked={settings.quizEnabled}
            onChange={(value) => update({ quizEnabled: value })}
          />
          {isReminderSupported() ? (
            <div className="py-2.5">
              <Toggle
                label={t('profile.dailyReminder')}
                hint={t('profile.dailyReminderHint')}
                checked={reminder.enabled}
                onChange={(value) => void handleReminderToggle(value)}
              />
              {reminder.enabled ? (
                <div className="mt-2 flex items-center justify-between pl-1">
                  <span className="text-xs text-muted">{t('profile.dailyReminderTime')}</span>
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => void handleReminderTime(e.target.value)}
                    className="rounded-lg border border-line bg-soft px-2 py-1 text-xs text-ink outline-none"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <OfflineCard />
      <SettingsLinks />
    </Card>
  );
}
