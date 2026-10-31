/**
 * Подсветка искомого слова в примерах (этап 8).
 * Куски приходят от ИИ (`match: {source, target}`), но подсвечиваем только то, что реально есть в тексте.
 * Для Tatoeba формы слова находятся по списку известных форм из карточки (спряжение, склонение, степени).
 */
import type { WordCard } from '../../shared/types';
import { adjectiveStem, buildComparison, buildDeclension } from './adjectiveForms';

export interface HighlightPart {
  text: string;
  /** true — это искомое слово, его подсвечиваем. */
  match: boolean;
}

/** Известные формы слова: лемма, артикль + слово, склонение, спряжение, сравнение. */
export function knownWordForms(card: WordCard): string[] {
  const forms = new Set<string>();
  const add = (value: string | null | undefined) => {
    const text = (value ?? '').trim();
    if (!text) return;
    forms.add(text.toLowerCase());
    // «der Tisch» → «tisch», «den Tisch» берётся отдельно из таблицы склонения.
    const parts = text.split(/\s+/);
    if (parts.length === 2 && /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)$/i.test(parts[0])) {
      forms.add(parts[1].toLowerCase());
    }
  };

  add(card.lemma);
  // Формы глагола берём из карточки: их строит ИИ, а не угадываем окончания.
  for (const form of card.conjugation?.praesens ?? []) add(form.form);
  for (const form of card.conjugation?.praeteritum ?? []) add(form.form);
  for (const form of card.conjugation?.konjunktiv2 ?? []) add(form.form);
  add(card.conjugation?.perfekt?.split(/\s+/).pop());
  add(card.conjugation?.imperativ?.du);
  add(card.conjugation?.imperativ?.ihr);

  for (const row of card.declension ?? []) {
    add(row.singular);
    add(row.plural);
  }
  add(card.plural);

  if (card.partOfSpeech === 'adjective') {
    const comparison = buildComparison(card.lemma);
    for (const row of buildDeclension(card.lemma, 'strong')) {
      add(row.masculine.adjective);
      add(row.neuter.adjective);
      add(row.feminine.adjective);
      add(row.plural.adjective);
    }
    add(adjectiveStem(card.lemma));
    add(comparison.comparative);
    add(comparison.superlative.replace(/^am\s+/, ''));
  }

  return [...forms];
}

/** Регулярное выражение для поиска куска в тексте (экранируем спецсимволы). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Есть ли кусок в тексте (без учёта регистра). */
export function containsSlice(text: string, slice: string): boolean {
  return Boolean(slice.trim()) && text.toLowerCase().includes(slice.trim().toLowerCase());
}

/**
 * Разбивает текст на части и подсвечивает куски. Правила по порядку:
 * 1) готовый кусок от ИИ, если он есть в тексте; 2) первое известное слово среди форм;
 * 3) первые 5 букв леммы (Garten → Garten, Gartens).
 */
export function splitHighlight(
  text: string,
  options: { slice?: string | null; forms?: string[]; lemma?: string | null },
): HighlightPart[] {
  const { slice, forms = [], lemma } = options;
  if (!text) return [];

  const candidates: string[] = [];
  if (slice && containsSlice(text, slice)) candidates.push(slice.trim());
  // Сначала более длинные формы: «aufgestanden» раньше «aufstehen».
  const sortedForms = [...forms].sort((left, right) => right.length - left.length);
  for (const form of sortedForms) {
    if (containsSlice(text, form)) candidates.push(form);
  }
  if (lemma && lemma.length >= 5) candidates.push(lemma.slice(0, 5));

  for (const candidate of candidates) {
    const pattern = new RegExp(`(${escapeRegExp(candidate)})`, 'i');
    if (!pattern.test(text)) continue;
    return text
      .split(pattern)
      .filter((part) => part.length > 0)
      .map((part, index) => ({ text: part, match: index % 2 === 1 }));
  }
  return [{ text, match: false }];
}
