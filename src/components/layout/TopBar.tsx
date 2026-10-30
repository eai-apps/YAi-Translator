/** Верхняя панель на телефоне и планшете. */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-line bg-card px-4 lg:hidden">
      <Link to="/" className="rounded-lg" aria-label={t('common.appName')}>
        <Logo size={32} withWordmark />
      </Link>
      <div className="flex items-center gap-1.5">
        <LanguageSwitch compact />
        <ThemeSwitch compact />
      </div>
    </header>
  );
}
