/** Левое меню на компьютере и телевизоре. */
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../config';
import { cn } from '../../lib/cn';
import { useNavItems } from './navItems';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';

export function Sidebar() {
  const { t } = useTranslation();
  const items = useNavItems();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-card px-3 py-5 lg:flex">
      <Link to="/" className="rounded-xl px-2 py-1" aria-label={t('nav.translate')}>
        <Logo size={38} withWordmark />
      </Link>

      <nav className="mt-8 space-y-1" aria-label={t('common.appName')}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accentSoft text-accent'
                  : 'text-muted hover:bg-soft hover:text-ink',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-line pt-4">
        <ThemeSwitch />
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-muted">{t('profile.interfaceLanguage')}</span>
          <LanguageSwitch compact />
        </div>
        <p className="px-1 text-[11px] text-muted">
          {t('common.appName')} · {t('common.version')} {APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
