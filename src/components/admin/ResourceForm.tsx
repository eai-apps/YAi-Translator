/** Форма добавления и изменения ссылки ресурса. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, ResourceCategory, ResourceInput, ResourceItem } from '../../../shared/types';
import { LANGUAGES } from '../../../shared/languages';
import { RESOURCE_CATEGORIES } from '../../../shared/dict';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { resourceCategoryKey } from '../resources/ResourceGroup';

interface ResourceFormProps {
  editing: ResourceItem | null;
  busy: boolean;
  onSave: (item: ResourceInput, id?: number) => Promise<boolean>;
  onCancel: () => void;
}

const EMPTY: ResourceInput = {
  lang: 'de',
  category: 'dictionaries',
  title: '',
  url: '',
  descriptionRu: '',
  descriptionDe: '',
  descriptionEn: '',
};

function fromItem(item: ResourceItem): ResourceInput {
  return {
    lang: item.lang,
    category: item.category,
    title: item.title,
    url: item.url,
    descriptionRu: item.descriptionRu,
    descriptionDe: item.descriptionDe,
    descriptionEn: item.descriptionEn,
  };
}

export function ResourceForm({ editing, busy, onSave, onCancel }: ResourceFormProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ResourceInput>(editing ? fromItem(editing) : EMPTY);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(editing ? fromItem(editing) : EMPTY);
    setNotice(null);
  }, [editing]);

  const update = (patch: Partial<ResourceInput>) => setDraft((previous) => ({ ...previous, ...patch }));

  const submit = async () => {
    // Адрес должен быть http(s): сервер отклонит остальное.
    let valid = false;
    try {
      const url = new URL(draft.url.trim());
      valid = url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      valid = false;
    }
    if (!draft.title.trim() || !valid) {
      setNotice(t('admin.resources.invalid'));
      return;
    }
    const ok = await onSave({ ...draft, title: draft.title.trim(), url: draft.url.trim() }, editing?.id);
    setNotice(ok ? t(editing ? 'admin.resources.updated' : 'admin.resources.added') : null);
    if (ok && !editing) setDraft((previous) => ({ ...previous, title: '', url: '', descriptionRu: '', descriptionDe: '', descriptionEn: '' }));
  };

  return (
    <Card className="p-4">
      <SectionTitle>{editing ? t('admin.resources.edit') : t('admin.resources.add')}</SectionTitle>
      {editing ? <p className="mt-1 text-xs text-muted">{t('admin.resources.editing', { title: editing.title })}</p> : null}

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          <span>{t('admin.resources.lang')}</span>
          <select
            value={draft.lang}
            onChange={(event) => update({ lang: event.target.value as LanguageCode })}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink"
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-muted">
          <span>{t('admin.resources.category')}</span>
          <select
            value={draft.category}
            onChange={(event) => update({ category: event.target.value as ResourceCategory })}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink"
          >
            {RESOURCE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(resourceCategoryKey(category))}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-muted sm:col-span-2">
          <span>{t('admin.resources.titleField')}</span>
          <input
            value={draft.title}
            maxLength={120}
            onChange={(event) => update({ title: event.target.value })}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink"
          />
        </label>

        <label className="block text-xs text-muted sm:col-span-2">
          <span>{t('admin.resources.urlField')}</span>
          <input
            value={draft.url}
            type="url"
            inputMode="url"
            maxLength={500}
            onChange={(event) => update({ url: event.target.value })}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 font-mono text-sm text-ink"
          />
        </label>

        {(['Ru', 'De', 'En'] as const).map((suffix) => {
          const key = `description${suffix}` as 'descriptionRu' | 'descriptionDe' | 'descriptionEn';
          return (
            <label key={suffix} className="block text-xs text-muted sm:col-span-2">
              <span>{t(`admin.resources.${key}`)}</span>
              <textarea
                value={draft[key]}
                rows={2}
                maxLength={400}
                dir="auto"
                onChange={(event) => update({ [key]: event.target.value })}
                className="mt-1 w-full resize-none rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink"
              />
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" loading={busy} onClick={() => void submit()}>
          {t('admin.resources.save')}
        </Button>
        {editing ? (
          <Button variant="ghost" onClick={onCancel}>
            {t('admin.resources.cancelEdit')}
          </Button>
        ) : null}
        {notice ? <span className="text-sm text-ink">{notice}</span> : null}
      </div>
    </Card>
  );
}
