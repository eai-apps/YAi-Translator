/**
 * Разбивает текст на части: обычный текст и термины с slug темы (версия 0.6.0).
 * Работает по словарю синонимов из src/data/grammarTerms.ts: самое раннее вхождение
 * выделяется первым, иначе ссылки накладывались бы друг на друга («Konjunktiv II» → «II»).
 */
import { GRAMMAR_TERMS } from '../../data/grammarTermsData';

export interface HighlightPart {
  text: string;
  /** null — обычный текст, иначе slug темы справочника. */
  slug: string | null;
}

interface Match {
  start: number;
  end: number;
  slug: string;
}

/** Экранирование для RegExp (варианты названий — обычный текст). */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Словоформы латинского термина: Perfekt → Perfekt, Perfekte, Perfekts, Perfekten. */
function stemRegExp(stem: string): RegExp {
  if (/[а-яё]/i.test(stem)) return new RegExp(`(?<![а-яё])${escapeRegex(stem)}[а-яё]*(?![а-яё])`, 'giu');
  return new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegex(stem)}(?:e|es|en|er|s|n)?(?![\\p{L}\\p{M}])`, 'giu');
}

/** Собираем все варианты каждой темы и ищем их в тексте. */
function collectMatches(text: string): Match[] {
  const matches: Match[] = [];
  for (const entry of GRAMMAR_TERMS) {
    const regexps: RegExp[] = [
      // Названия: кириллица важна с регистром, латиница — без.
      ...entry.aliases.map((alias) =>
        new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegex(alias)}(?![\\p{L}\\p{M}])`, /[а-яё]/i.test(alias) ? 'gu' : 'giu'),
      ),
      ...(entry.patterns ?? []).map((pattern) => new RegExp(`(?<![\\p{L}\\p{M}])${pattern}(?![\\p{L}\\p{M}])`, 'giu')),
      ...(entry.stems ?? []).map(stemRegExp),
    ];
    for (const regexp of regexps) {
      let match: RegExpExecArray | null;
      while ((match = regexp.exec(text)) !== null) {
        if (match[0].length === 0) {
          regexp.lastIndex += 1;
          continue;
        }
        matches.push({ start: match.index, end: match.index + match[0].length, slug: entry.slug });
      }
    }
  }
  return matches;
}

export function grammarTermsInText(text: string): HighlightPart[] {
  if (!text) return [];
  const matches = collectMatches(text)
    // Длинные вхождения идут первыми (Konjunktiv II раньше Konjunktiv), затем по позиции.
    .sort((left, right) => right.end - right.start - (left.end - left.start) || left.start - right.start);

  const taken: Match[] = [];
  for (const match of matches) {
    if (taken.some((other) => match.start < other.end && other.start < match.end)) continue;
    taken.push(match);
  }
  if (taken.length === 0) return [{ text, slug: null }];

  taken.sort((left, right) => left.start - right.start);

  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (const match of taken) {
    if (match.start > cursor) parts.push({ text: text.slice(cursor, match.start), slug: null });
    parts.push({ text: text.slice(match.start, match.end), slug: match.slug });
    cursor = match.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), slug: null });
  return parts;
}
