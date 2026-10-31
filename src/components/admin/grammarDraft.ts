/** Черновик формы темы в админке: поля, которые заполняет человек (этап 5). */
import type { AdminGrammarInput, GrammarExample, GrammarMistake } from '../../../shared/types';

/** Пустой пример и пустая ошибка: с них начинается новая строка формы. */
export const EMPTY_EXAMPLE: GrammarExample = { level: 'A2', text: '', translation: '' };
export const EMPTY_MISTAKE: GrammarMistake = { wrong: '', right: '', why: '' };

/** Поля формы. Списки («когда нужно», «исключения», «связанные») — строки с переносом на пункт. */
export interface GrammarDraft {
  slug: string;
  level: AdminGrammarInput['level'];
  category: AdminGrammarInput['category'];
  titleRu: string;
  titleDe: string;
  titleEn: string;
  summary: string;
  whenToUse: string;
  exceptions: string;
  related: string;
  formation: AdminGrammarInput['body']['formation'];
  examples: GrammarExample[];
  commonMistakes: GrammarMistake[];
}

/** Поля новой темы. */
export const EMPTY_DRAFT: GrammarDraft = {
  slug: '',
  level: 'A2',
  category: 'syntax',
  titleRu: '',
  titleDe: '',
  titleEn: '',
  summary: '',
  whenToUse: '',
  exceptions: '',
  related: '',
  formation: [{ rule: '', example: '', translation: '' }],
  examples: [EMPTY_EXAMPLE],
  commonMistakes: [EMPTY_MISTAKE],
};

/** Строки текста → массив пунктов (пустые строки пропускаем). */
export function lines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Черновик → поля запроса к серверу (без пустых пунктов). */
export function toInput(draft: GrammarDraft): AdminGrammarInput {
  return {
    slug: draft.slug.trim().toLowerCase(),
    level: draft.level,
    category: draft.category,
    titleRu: draft.titleRu.trim(),
    titleDe: draft.titleDe.trim(),
    titleEn: draft.titleEn.trim(),
    body: {
      summary: draft.summary.trim(),
      whenToUse: lines(draft.whenToUse),
      formation: draft.formation.filter((row) => row.rule.trim()),
      examples: draft.examples.filter((row) => row.text.trim()),
      exceptions: lines(draft.exceptions),
      commonMistakes: draft.commonMistakes.filter((row) => row.right.trim()),
      related: draft.related
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      links: [],
    },
  };
}

/** Адрес темы: латиница, цифры и дефисы — как у slug в справочнике. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{2,80}$/.test(slug);
}
