/**
 * Левое меню на компьютере и телевизоре.
 * Этап 8Б: на невысоких экранах меню прокручивается, переключатели темы и языка стоят в одну
 * компактную строку, «О приложении» и версия всегда видны внизу.
 */
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../../config';
import { useAccount } from '../../hooks/useAccount';
import { cn } from '../../lib/cn';
import { IconCompass, IconInfo, IconSparkles } from './icons';
import { useSidebarItems } from './navItems';
import type { NavItem } from './navItems';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';

function NavRow({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-accentSoft text-accent' : 'text-muted hover:bg-soft hover:text-ink',
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const items = useSidebarItems();
  const { account } = useAccount();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-card px-3 py-5 lg:flex">
      <Link to="/" className="shrink-0 rounded-xl px-2 py-1" aria-label={t('nav.translate')}>
        <Logo size={38} withWordmark />
      </Link>

      {/* Список прокручивается: на невысоком экране пункты меню не выталкивают версию за край. */}
      <nav
        className="no-scrollbar mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto"
        aria-label={t('common.appName')}
      >
        {items.map((item) => (
          <div key={item.to}>
            <NavRow {...item} />
            {item.to === '/profile' ? (
              account ? (
                <div className="-mt-1 mb-1 flex items-center gap-1.5 pl-11 text-xs text-muted">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="truncate">{account.login}</span>
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="-mt-1 mb-1 flex items-center gap-1.5 pl-11 text-xs text-muted transition-colors hover:text-ink"
                >
                  <span className="truncate">{t('nav.guestSignIn')}</span>
                </Link>
              )
            ) : null}
          </div>
        ))}
      </nav>

      {/* Внизу — компактные переключатели, «Ресурсы», «О приложении» и версия (всегда видны). */}
      <div className="shrink-0 space-y-2 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2">
          <ThemeSwitch compact />
          <LanguageSwitch compact />
        </div>
        <div className="space-y-0.5">
          <Link
            to="/resources"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
          >
            <IconCompass className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('nav.resources')}</span>
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
          >
            <IconInfo className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('nav.about')}</span>
          </Link>
          {account?.isAdmin ? (
            <Link
              to="/admin"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
            >
              <IconSparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('nav.admin')}</span>
            </Link>
          ) : null}
        </div>
        <p className="px-1 text-[11px] text-muted">
          {t('common.appName')} · {t('common.version')} {APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
