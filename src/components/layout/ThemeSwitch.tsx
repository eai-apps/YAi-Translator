/** Переключатель темы: солнце / луна / как в системе. */
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../hooks/useTheme';
import { IconMonitor, IconMoon, IconSun } from './icons';

const ORDER: ThemeMode[] = ['light', 'dark', 'system'];
const ICONS = { light: IconSun, dark: IconMoon, system: IconMonitor };

interface ThemeSwitchProps {
  compact?: boolean;
}

export function ThemeSwitch({ compact = false }: ThemeSwitchProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const labelFor = (mode: ThemeMode) =>
    mode === 'light' ? t('profile.themeLight') : mode === 'dark' ? t('profile.themeDark') : t('profile.themeSystem');

  // Компактный вариант переключает тему по кругу одной кнопкой.
  if (compact) {
    const index = ORDER.indexOf(theme);
    const next = ORDER[(index + 1) % ORDER.length];
    const Icon = ICONS[theme];
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`${t('profile.theme')}: ${labelFor(theme)}`}
        title={`${t('profile.theme')}: ${labelFor(theme)}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-muted transition-colors hover:bg-soft hover:text-ink"
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-soft p-1">
      {ORDER.map((mode) => {
        const Icon = ICONS[mode];
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-pressed={active}
            title={labelFor(mode)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden xl:inline">{labelFor(mode)}</span>
          </button>
        );
      })}
    </div>
  );
}
