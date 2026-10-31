/** Три блока многострочных полей формы темы: «Как образуется», «Примеры», «Типичные ошибки». */
import { useTranslation } from 'react-i18next';
import type { GrammarExample, GrammarMistake } from '../../../shared/types';
import { EMPTY_EXAMPLE, EMPTY_MISTAKE } from './grammarDraft';
import { RowsSection } from './RowsSection';

const INPUT_CLASS = 'mt-1 h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink';

interface FormationEditorProps {
  rows: Array<{ rule: string; example: string; translation: string }>;
  onChange: (rows: FormationEditorProps['rows']) => void;
}

/** «Как образуется»: правило и пример с переводом. */
export function FormationEditor({ rows, onChange }: FormationEditorProps) {
  const { t } = useTranslation();
  const replace = (index: number, patch: Partial<FormationEditorProps['rows'][number]>) =>
    onChange(rows.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <RowsSection
      title={t('admin.grammar.formationRule')}
      addLabel={t('admin.grammar.addFormation')}
      rows={rows}
      onAdd={() => onChange([...rows, { rule: '', example: '', translation: '' }])}
      onChange={replace}
      onRemove={(index) => onChange(rows.filter((_, i) => i !== index))}
      render={(row, index, change) => (
        <>
          <input
            value={row.rule}
            onChange={(event) => change({ rule: event.target.value })}
            placeholder={t('admin.grammar.formationRule')}
            className={INPUT_CLASS}
          />
          <input
            value={row.example}
            onChange={(event) => change({ example: event.target.value })}
            placeholder={t('admin.grammar.formationExample')}
            className={INPUT_CLASS}
          />
          <input
            value={row.translation}
            onChange={(event) => change({ translation: event.target.value })}
            placeholder={t('admin.grammar.formationTranslation')}
            className={INPUT_CLASS}
          />
        </>
      )}
    />
  );
}

/** «Примеры»: предложение с уровнем и переводом. */
export function ExamplesEditor({ rows, onChange }: { rows: GrammarExample[]; onChange: (rows: GrammarExample[]) => void }) {
  const { t } = useTranslation();
  const replace = (index: number, patch: Partial<GrammarExample>) =>
    onChange(rows.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <RowsSection
      title={t('admin.grammar.examples')}
      addLabel={t('admin.grammar.addExample')}
      rows={rows}
      onAdd={() => onChange([...rows, EMPTY_EXAMPLE])}
      onChange={replace}
      onRemove={(index) => onChange(rows.filter((_, i) => i !== index))}
      render={(row, index, change) => (
        <>
          <select
            value={row.level}
            aria-label={t('admin.grammar.exampleLevel')}
            onChange={(event) => change({ level: event.target.value as GrammarExample['level'] })}
            className="mt-1 h-10 rounded-xl border border-line bg-card px-2 text-sm text-ink"
          >
            {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <input
            value={row.text}
            onChange={(event) => change({ text: event.target.value })}
            placeholder={t('admin.grammar.exampleText')}
            className={INPUT_CLASS}
          />
          <input
            value={row.translation}
            onChange={(event) => change({ translation: event.target.value })}
            placeholder={t('admin.grammar.exampleTranslation')}
            className={INPUT_CLASS}
          />
        </>
      )}
    />
  );
}

/** «Типичные ошибки»: как не надо, как надо и почему. */
export function MistakesEditor({ rows, onChange }: { rows: GrammarMistake[]; onChange: (rows: GrammarMistake[]) => void }) {
  const { t } = useTranslation();
  const replace = (index: number, patch: Partial<GrammarMistake>) =>
    onChange(rows.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <RowsSection
      title={t('admin.grammar.commonMistakes')}
      addLabel={t('admin.grammar.addMistake')}
      rows={rows}
      onAdd={() => onChange([...rows, EMPTY_MISTAKE])}
      onChange={replace}
      onRemove={(index) => onChange(rows.filter((_, i) => i !== index))}
      render={(row, index, change) => (
        <>
          <input
            value={row.wrong}
            onChange={(event) => change({ wrong: event.target.value })}
            placeholder={t('admin.grammar.mistakeWrong')}
            className={INPUT_CLASS}
          />
          <input
            value={row.right}
            onChange={(event) => change({ right: event.target.value })}
            placeholder={t('admin.grammar.mistakeRight')}
            className={INPUT_CLASS}
          />
          <input
            value={row.why}
            onChange={(event) => change({ why: event.target.value })}
            placeholder={t('admin.grammar.mistakeWhy')}
            className={INPUT_CLASS}
          />
        </>
      )}
    />
  );
}
