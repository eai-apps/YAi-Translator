/** Нижняя панель из 5 вкладок на телефоне. */
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { useNavItems } from './navItems';

export function BottomNav() {
  const { t } = useTranslation();
  const items = useNavItems();

  return (
    <nav
      aria-label={t('common.appName')}
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card lg:hidden"
    >
      <ul className="flex items-stretch">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-muted active:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2]')} />
                  <span className="max-w-full truncate">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
