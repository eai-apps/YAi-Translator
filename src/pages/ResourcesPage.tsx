/**
 * Страница «Ресурсы»: бесплатные проверенные сайты по каждому языку,
 * сгруппированные по словарям, грамматике, аудированию, экзаменам и жизни в стране.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../shared/types';
import { getLanguage, isLanguageCode, textDirection } from '../../shared/languages';
import { RESOURCE_CATEGORIES } from '../../shared/dict';
import { STORAGE_KEYS } from '../config';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useResources } from '../hooks/useResources';
import { useSettings } from '../hooks/useSettings';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { IconArrowLeft, IconInfo } from '../components/layout/icons';
import { ResourceGroup } from '../components/resources/ResourceGroup';

export default function ResourcesPage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const { data, loading, failed, reload } = useResources();

  // Обычно смотрим ресурсы для немецкого: это главный язык продукта.
  const preferred: LanguageCode = uiLanguage === 'de' ? 'ru' : 'de';
  const [storedLang, setStoredLang] = useLocalStorage<string>(STORAGE_KEYS.resourcesLang, preferred);
  const availableLangs = data?.langs ?? [];
  const lang: LanguageCode =
    isLanguageCode(storedLang) && availableLangs.includes(storedLang)
      ? storedLang
      : availableLangs.includes(preferred)
        ? preferred
        : (availableLangs[0] ?? preferred);

  const items = (data?.items ?? []).filter((item) => item.lang === lang);

  return (
    <>
      <PageHeader
        title={t('resources.title')}
        subtitle={t('resources.subtitle')}
        action={
          <Link to="/profile">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('nav.profile')}
            </Button>
          </Link>
        }
      />

      {/* Выбор языка: показываются только языки, для которых есть ссылки. */}
      {availableLangs.length > 1 ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('resources.langLabel')}>
          {availableLangs.map((code) => {
            const option = getLanguage(code);
            const active = code === lang;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => setStoredLang(code)}
                dir={textDirection(code)}
                className={
                  active
                    ? 'rounded-xl border border-transparent bg-accent px-3 py-1.5 text-sm font-medium text-accentInk'
                    : 'rounded-xl border border-line bg-card px-3 py-1.5 text-sm font-medium text-muted hover:text-ink'
                }
              >
                {option?.nativeName ?? code}
              </button>
            );
          })}
        </div>
      ) : null}

      <Card className="mt-3 p-4 sm:p-5">
        {loading && !data ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted">
            <Spinner />
            <span>{t('resources.loading')}</span>
          </div>
        ) : failed ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted">{t('resources.error')}</p>
            <Button size="sm" onClick={reload}>
              {t('resources.retry')}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-muted">{t('resources.empty')}</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">{getLanguage(lang)?.nativeName ?? lang}</p>
              <span className="text-xs text-muted">{items.length}</span>
            </div>
            {RESOURCE_CATEGORIES.map((category) => (
              <ResourceGroup
                key={category}
                category={category}
                items={items.filter((item) => item.category === category)}
                uiLang={uiLanguage}
              />
            ))}
          </>
        )}
      </Card>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t('resources.intro')}</span>
      </p>
    </>
  );
}
