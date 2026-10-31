/**
 * Верхняя панель на телефоне и планшете.
 * safe-top: padding-top = env(safe-area-inset-top) — не уходит под статус-бар при edge-to-edge.
 * h-14 — высота самой панели; фактическая высота = 56px + safe-area-inset-top.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header
      className="safe-top sticky top-0 z-20 flex flex-col border-b border-line bg-card lg:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <Link to="/" className="rounded-lg" aria-label={t('common.appName')}>
          <Logo size={32} withWordmark />
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageSwitch compact />
          <ThemeSwitch compact />
        </div>
      </div>
    </header>
  );
}
