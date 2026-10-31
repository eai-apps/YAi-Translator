/**
 * Форма темы справочника в админке (версия 0.6.0).
 * Простые поля по структуре body_json: «Коротко», «Когда нужно», «Как образуется»,
 * «Примеры», «Исключения», «Типичные ошибки», «Связанные темы».
 * Списки вводятся по строке на пункт, примеры и ошибки — отдельными строками-карточками.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminGrammarInput, AdminGrammarTopic } from '../../../shared/types';
import { GRAMMAR_CATEGORIES, GRAMMAR_LEVELS } from '../../../shared/grammarTopics';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { EMPTY_DRAFT, isValidSlug, toInput } from './grammarDraft';
import type { GrammarDraft } from './grammarDraft';
import { ExamplesEditor, FormationEditor, MistakesEditor } from './GrammarRows';

interface GrammarFormProps {
  /** null — форма новой темы. */
  editing: AdminGrammarTopic | null;
  busy: boolean;
  onSave: (input: AdminGrammarInput, isNew: boolean) => Promise<boolean>;
  onCancel: () => void;
}

/** Существующая тема разворачивается в поля формы. */
function fromTopic(topic: AdminGrammarTopic): GrammarDraft {
  return {
    slug: topic.slug,
    level: topic.level,
    category: topic.category,
    titleRu: topic.titleRu,
    titleDe: topic.titleDe,
    titleEn: topic.titleEn,
    summary: topic.body?.summary ?? '',
    whenToUse: (topic.body?.whenToUse ?? []).join('\n'),
    exceptions: (topic.body?.exceptions ?? []).join('\n'),
    related: (topic.body?.related ?? []).join(', '),
    formation: topic.body?.formation.length ? topic.body.formation : EMPTY_DRAFT.formation,
    examples: topic.body?.examples.length ? topic.body.examples : EMPTY_DRAFT.examples,
    commonMistakes: topic.body?.commonMistakes.length ? topic.body.commonMistakes : EMPTY_DRAFT.commonMistakes,
  };
}

const INPUT_CLASS = 'mt-1 h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink';
const AREA_CLASS = 'mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink';

export function GrammarForm({ editing, busy, onSave, onCancel }: GrammarFormProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<GrammarDraft>(editing ? fromTopic(editing) : EMPTY_DRAFT);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(editing ? fromTopic(editing) : EMPTY_DRAFT);
    setNotice(null);
  }, [editing]);

  const update = (patch: Partial<GrammarDraft>) => setDraft((previous) => ({ ...previous, ...patch }));

  const submit = async () => {
    const slug = draft.slug.trim().toLowerCase();
    const titlesFilled = Boolean(draft.titleRu.trim() && draft.titleDe.trim() && draft.titleEn.trim());
    if (!isValidSlug(slug) || !titlesFilled || !draft.summary.trim()) {
      setNotice(t('admin.grammar.invalid'));
      return;
    }
    const ok = await onSave(toInput(draft), editing === null);
    setNotice(ok ? t(editing ? 'admin.grammar.saved' : 'admin.grammar.added') : null);
  };

  return (
    <Card className="p-4">
      <SectionTitle>
        {editing ? t('admin.grammar.editing', { title: editing.titleDe }) : t('admin.grammar.addTitle')}
      </SectionTitle>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          <span>{t('admin.grammar.slug')}</span>
          <input
            value={draft.slug}
            disabled={editing !== null}
            onChange={(event) => update({ slug: event.target.value })}
            className={INPUT_CLASS}
            placeholder="konjunktiv-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-muted">
            <span>{t('admin.grammar.level')}</span>
            <select
              value={draft.level}
              onChange={(event) => update({ level: event.target.value as GrammarDraft['level'] })}
              className={INPUT_CLASS}
            >
              {GRAMMAR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            <span>{t('admin.grammar.category')}</span>
            <select
              value={draft.category}
              onChange={(event) => update({ category: event.target.value as GrammarDraft['category'] })}
              className={INPUT_CLASS}
            >
              {GRAMMAR_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`grammar.category.${category}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(['titleRu', 'titleDe', 'titleEn'] as const).map((key) => (
          <label key={key} className="block text-xs text-muted">
            <span>{t(`admin.grammar.${key}`)}</span>
            <input
              value={draft[key]}
              onChange={(event) => update({ [key]: event.target.value })}
              className={INPUT_CLASS}
            />
          </label>
        ))}

        <label className="block text-xs text-muted sm:col-span-2">
          <span>{t('admin.grammar.summary')}</span>
          <textarea
            value={draft.summary}
            rows={3}
            onChange={(event) => update({ summary: event.target.value })}
            className={AREA_CLASS}
          />
        </label>

        {(['whenToUse', 'exceptions'] as const).map((key) => (
          <label key={key} className="block text-xs text-muted">
            <span>{t(`admin.grammar.${key}`)}</span>
            <textarea
              value={draft[key]}
              rows={4}
              onChange={(event) => update({ [key]: event.target.value })}
              className={AREA_CLASS}
            />
          </label>
        ))}
      </div>

      <FormationEditor rows={draft.formation} onChange={(formation) => update({ formation })} />

      <ExamplesEditor rows={draft.examples} onChange={(examples) => update({ examples })} />

      <MistakesEditor rows={draft.commonMistakes} onChange={(commonMistakes) => update({ commonMistakes })} />

      <label className="mt-3 block text-xs text-muted">
        <span>{t('admin.grammar.related')}</span>
        <input
          value={draft.related}
          onChange={(event) => update({ related: event.target.value })}
          className={INPUT_CLASS}
          placeholder="konjunktiv-2-wuerde, konditional"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" loading={busy} onClick={() => void submit()}>
          {t('admin.grammar.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('admin.grammar.cancel')}
        </Button>
        {notice ? <span className="text-sm text-ink">{notice}</span> : null}
      </div>
    </Card>
  );
}

