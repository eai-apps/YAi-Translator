/**
 * Сопоставление «термин в тексте → тема справочника» (версия 0.6.0).
 * Сам словарь синонимов — в grammarTermsData.ts; здесь только поиск:
 * findGrammarTerms — список тем в порядке первого упоминания (для ссылок «Темы по этой грамматике»),
 * mergeTopics и topicsForNotes — помощники для разбора и карточки слова.
 */
import { GRAMMAR_TERMS } from './grammarTermsData';

/** Короткий словарь итогов: slug → все варианты для поиска (алиасы + словоформы). */
interface CompiledTerm {
  slug: string;
  /** Регулярные выражения по тексту. */
  matchers: RegExp[];
}

/** Экранируем спецсимволы для использования внутри RegExp. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Шаблон «словоформы» русского слова в родительном или другом падеже при поиске по началу.
 * Для латинских слов готовим формы окончаний: Perfekt → Perfekt, Perfekte, Perfekts.
 */
function stemMatchers(stem: string): RegExp[] {
  if (/[а-яё]/i.test(stem)) {
    // Русское слово: находим любые окончания (сослагательное → сослагательного).
    return [new RegExp(`(?<![а-яё])${escapeRegex(stem)}[а-яё]*(?![а-яё])`, 'giu')];
  }
  // Немецкое: формы с -e, -es, -s, -en (dekliniert manchmal mit -e/-er).
  return [new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegex(stem)}(?:e|es|en|s|er|n)?(?![\\p{L}\\p{M}])`, 'giu')];
}

const COMPILED: CompiledTerm[] = GRAMMAR_TERMS.map((entry) => {
  const matchers: RegExp[] = [];
  for (const alias of entry.aliases) {
    // Кириллица важна с регистром (названия тем), латиница — без.
    const flags = /[а-яё]/i.test(alias) ? 'gu' : 'giu';
    matchers.push(new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegex(alias)}(?![\\p{L}\\p{M}])`, flags));
  }
  for (const pattern of entry.patterns ?? []) {
    matchers.push(new RegExp(`(?<![\\p{L}\\p{M}])${pattern}(?![\\p{L}\\p{M}])`, 'giu'));
  }
  for (const stem of entry.stems ?? []) matchers.push(...stemMatchers(stem));
  return { slug: entry.slug, matchers };
});

/** Сколько подтверждений нужно, чтобы считать термин найденным. */
const MIN_HITS = 1;

/**
 * Slug тем, которые упоминаются в тексте. Результат упорядочен по первому вхождению:
 * на экране ссылки идут в том же порядке, что и в тексте.
 */
export function findGrammarTerms(text: string): string[] {
  if (!text || text.length > 20_000) return [];
  const found: Array<{ slug: string; at: number }> = [];

  for (const term of COMPILED) {
    let hits = 0;
    let first = -1;
    for (const matcher of term.matchers) {
      matcher.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = matcher.exec(text)) !== null) {
        hits += 1;
        if (first < 0 || match.index < first) first = match.index;
        if (match[0].length === 0) matcher.lastIndex += 1;
      }
    }
    if (hits >= MIN_HITS && first >= 0) found.push({ slug: term.slug, at: first });
  }

  // Сначала самые ранние упоминания; одинаковое место — порядок словаря.
  return found.sort((left, right) => left.at - right.at).map((item) => item.slug);
}

/** Склеивает slug из ИИ и найденные в тексте, убирая повторы (первыми идут данные ИИ). */
export function mergeTopics(fromAi: string[] | undefined, fromText: string[]): string[] {
  return [...new Set([...(fromAi ?? []), ...fromText])];
}

/** Тема не должна превращаться в ссылку внутри «Что важно знать» слишком часто. */
export function topicsForNotes(topics: string[]): string[] {
  const skipped = new Set(GRAMMAR_TERMS.filter((entry) => entry.skipInNotes).map((entry) => entry.slug));
  return topics.filter((slug) => !skipped.has(slug));
}
