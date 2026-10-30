/** Группа ресурсов: заголовок и список ссылок с описанием на языке интерфейса. */
import { useTranslation } from 'react-i18next';
import type { ResourceCategory, ResourceItem, UiLanguage } from '../../../shared/types';
import { SectionTitle } from '../ui/SectionTitle';

interface ResourceGroupProps {
  category: ResourceCategory;
  items: ResourceItem[];
  uiLang: UiLanguage;
}

/** Название группы берётся из переводов страницы. */
export function resourceCategoryKey(category: ResourceCategory): string {
  return `resources.${category}`;
}

/** Описание ссылки на языке интерфейса; если перевода нет — на английском, затем на русском. */
export function resourceDescription(item: ResourceItem, uiLang: UiLanguage): string {
  if (uiLang === 'ru') return item.descriptionRu || item.descriptionEn || item.descriptionDe;
  if (uiLang === 'de') return item.descriptionDe || item.descriptionEn || item.descriptionRu;
  return item.descriptionEn || item.descriptionRu || item.descriptionDe;
}

export function ResourceGroup({ category, items, uiLang }: ResourceGroupProps) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <section className="mt-4">
      <SectionTitle>{t(resourceCategoryKey(category))}</SectionTitle>
      <ul className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="py-2.5">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              {item.title}
            </a>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{resourceDescription(item, uiLang)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
