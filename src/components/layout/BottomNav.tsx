/**
 * Нижняя панель из 5 вкладок на телефоне.
 * Пятая вкладка «Ещё» открывает шторку со всеми разделами (Грамматика, AI, Ресурсы, О приложении, Админка).
 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { useNavItems } from './navItems';
import { MoreScreen } from './MoreScreen';
import { IconMenu } from './icons';

// Дополнительные маршруты, которые «принадлежат» вкладке «Ещё» (чтобы она была выделена)
const MORE_ROUTES = ['/grammar', '/ask', '/resources', '/apps', '/about', '/admin'];

export function BottomNav() {
  const { t } = useTranslation();
  const items = useNavItems();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Вкладка «Ещё» считается активной, если текущий маршрут из её списка
  const moreActive = MORE_ROUTES.some(
    (r) => location.pathname === r || location.pathname.startsWith(r + '/'),
  );

  return (
    <>
      <nav
        aria-label={t('common.appName')}
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card lg:hidden"
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
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

          {/* Вкладка «Ещё» */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex w-full flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors',
                moreActive ? 'text-accent' : 'text-muted active:text-ink',
              )}
            >
              <IconMenu className={cn('h-[22px] w-[22px]', moreActive && 'stroke-[2]')} />
              <span className="max-w-full truncate">{t('nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>

      <MoreScreen open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
