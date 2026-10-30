/**
 * Вкладка «Ресурсы» админки: добавить, изменить, скрыть, поменять порядок, удалить ссылку
 * и переключатель «Показывать ресурсы в приложениях из магазинов».
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, ResourceItem } from '../../../shared/types';
import { LANGUAGES, getLanguage } from '../../../shared/languages';
import { RESOURCE_CATEGORIES } from '../../../shared/dict';
import { useAdminResources } from '../../hooks/useAdminResources';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconArrowDown, IconArrowUp } from '../layout/icons';
import { resourceCategoryKey } from '../resources/ResourceGroup';
import { ResourceForm } from './ResourceForm';

export function AdminResourcesTab({ onError }: { onError: (message: string | null) => void }) {
  const { t } = useTranslation();
  const resources = useAdminResources(onError);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [openLang, setOpenLang] = useState<LanguageCode | null>(null);

  if (!resources.data) return null;
  const items = resources.data.items;
  const langs = LANGUAGES.map((language) => language.code).filter((code) =>
    items.some((item) => item.lang === code),
  );
  const activeLang = openLang && langs.includes(openLang) ? openLang : (langs[0] ?? null);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionTitle>{t('admin.resources.title')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.resources.intro')}</p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={resources.data.showInApps}
            disabled={resources.busy === 'showInApps'}
            onChange={(event) => void resources.setShowInApps(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span>
            {t('admin.resources.showInApps')}
            <span className="mt-0.5 block text-xs text-muted">{t('admin.resources.showInAppsHint')}</span>
          </span>
        </label>
      </Card>

      <ResourceForm
        editing={editing}
        busy={resources.busy === `save-${editing?.id ?? 'new'}`}
        onSave={async (item, id) => {
          const ok = await resources.save(item, id);
          if (ok) setEditing(null);
          return ok;
        }}
        onCancel={() => setEditing(null)}
      />

      {items.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted">{t('admin.resources.empty')}</p>
        </Card>
      ) : null}

      {/* Языки: сверху кнопки, ниже ссылки выбранного языка по группам. */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('admin.resources.lang')}>
        {langs.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={code === activeLang}
            onClick={() => setOpenLang(code)}
            className={
              code === activeLang
                ? 'rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accentInk'
                : 'rounded-xl border border-line bg-card px-3 py-1.5 text-sm font-medium text-muted hover:text-ink'
            }
          >
            {getLanguage(code)?.nativeName ?? code}
          </button>
        ))}
      </div>

      {activeLang
        ? RESOURCE_CATEGORIES.map((category) => {
            const group = items.filter((item) => item.lang === activeLang && item.category === category);
            if (group.length === 0) return null;
            return (
              <Card key={category} className="p-3 sm:p-4">
                <SectionTitle>{t(resourceCategoryKey(category))}</SectionTitle>
                <ul className="mt-2 divide-y divide-line">
                  {group.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-start gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {item.title}
                          {item.hidden ? (
                            <span className="ml-2 rounded-full bg-soft px-1.5 py-0.5 text-[10px] text-muted">
                              {t('admin.resources.hiddenNote')}
                            </span>
                          ) : null}
                        </p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-xs text-muted underline decoration-dotted underline-offset-2"
                        >
                          {item.url}
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={t('admin.resources.up')}
                          title={t('admin.resources.up')}
                          icon={<IconArrowUp className="h-4 w-4" />}
                          loading={resources.busy === `move-${item.id}`}
                          onClick={() => void resources.move(item.id, 'up')}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={t('admin.resources.down')}
                          title={t('admin.resources.down')}
                          icon={<IconArrowDown className="h-4 w-4" />}
                          disabled={resources.busy === `move-${item.id}`}
                          onClick={() => void resources.move(item.id, 'down')}
                        />
                        <Button size="sm" onClick={() => setEditing(item)}>
                          {t('admin.resources.edit')}
                        </Button>
                        <Button
                          size="sm"
                          disabled={resources.busy === `hidden-${item.id}`}
                          onClick={() => void resources.toggleHidden(item.id, !item.hidden)}
                        >
                          {item.hidden ? t('admin.resources.show') : t('admin.resources.hide')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={resources.busy === `delete-${item.id}`}
                          onClick={() => {
                            if (!window.confirm(t('admin.resources.confirmRemove', { title: item.title }))) return;
                            void resources.remove(item.id);
                          }}
                        >
                          {t('admin.resources.remove')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })
        : null}
    </div>
  );
}
