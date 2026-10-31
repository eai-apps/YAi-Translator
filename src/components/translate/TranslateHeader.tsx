/**
 * Заголовок главного экрана «Перевод»: название фирменным шрифтом с мягким градиентом
 * и короткая фраза-крючок рядом (на телефоне — под заголовком). Без крупных блоков — колонки не опускаются.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAccount } from '../../hooks/useAccount';

export function TranslateHeader() {
  const { t } = useTranslation();
  const { account } = useAccount();
  return (
    <header className="mb-4 flex flex-wrap items-end gap-x-5 gap-y-1.5 sm:mb-5">
      <h1 className="bg-gradient-to-r from-accent via-[#8b7bff] to-[#c06cf0] bg-clip-text pb-0.5 font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
        {t('translate.title')}
      </h1>
      <div className="min-w-0 max-w-xl pb-1">
        <p className="text-sm font-medium leading-snug text-ink sm:text-[15px]">{t('translate.tagline')}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted">{t('translate.taglineSub')}</p>
        {/* Гостю — приглашение зарегистрироваться (больше нейросетей и запросов). */}
        {!account ? (
          <Link to="/profile" className="mt-0.5 inline-block text-xs font-medium leading-snug text-accent hover:underline">
            ★ {t('translate.taglineGuest')}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
