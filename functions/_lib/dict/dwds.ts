/**
 * DWDS — Digitales Wörterbuch der deutschen Sprache (https://www.dwds.de).
 * Ключа нет. Толкование по-немецки берём из блока «Bedeutungsübersicht» статьи:
 * документированного JSON у DWDS нет, поэтому разбираю только этот стабильный блок
 * (заголовок «Bedeutungsübersicht» → <ol><li>значение</li>…).
 * Источник необязательный: если статья не нашлась, карточка строится без немецких толкований.
 */
import type { DictDefinition, LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import { dictFetch, stripHtml } from './http';

/** Сколько толкований показывать. */
const MAX_ITEMS = 4;
/** Толкование не длиннее: иначе это абзац, а не определение. */
const MAX_LENGTH = 300;

/** Сущности, которые встречаются в статье DWDS. */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function unescape(value: string): string {
  return value.replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ');
}

/**
 * Адрес блока толкований. Заголовок «Bedeutungsübersicht» встречается в статье дважды
 * (скрытая навигация и сам блок), после заголовка сразу идёт <ol> — по нему и находим блок.
 */
function definitionsBlockStart(html: string): number {
  // Между заголовком и списком бывает пустая строка, поэтому пропускаем любой пробельный текст.
  const heading = /<h2[^>]*>\s*Bedeutungs(?:ü|&uuml;|ue)bersicht\s*<\/h2>\s*<ol\b/gi;
  let last = -1;
  let match: RegExpExecArray | null;
  while ((match = heading.exec(html)) !== null) last = match.index;
  return last;
}

/**
 * Вырезает из HTML все вложенные списки <ol>/<ul> (с учётом вложенности, чтобы не съесть соседние пункты).
 * Остаются только пункты верхнего уровня: подпункты «a) … b) …» в толкование не попадают.
 */
export function removeNestedLists(html: string): string {
  // Самый внешний список снимаем вместе с его меткой: пункты <li> остаются.
  let withoutNestedLists = '';
  let rest = html.replace(/<(?:ol|ul)\b[^>]*>/i, '');
  const nested = /<(?:ol|ul)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = nested.exec(rest)) !== null) {
    let depth = 0;
    let index = match.index;
    for (; index < rest.length; index += 1) {
      const tag = rest.slice(index, index + 4).toLowerCase();
      if (tag.startsWith('<ol') || tag.startsWith('<ul')) depth += 1;
      if (tag.startsWith('</ol') || tag.startsWith('</ul')) {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const end = rest.indexOf('>', index) + 1;
    withoutNestedLists += rest.slice(0, match.index);
    // Сайт иногда оставляет список незакрытым: тогда считаем, что он кончается здесь.
    rest = index >= rest.length ? '' : rest.slice(end);
    nested.lastIndex = 0;
  }
  withoutNestedLists += rest;
  return withoutNestedLists;
}

/** Толкования из HTML статьи DWDS; пустой массив — блок не найден или статьи нет. */
export function parseDwdsDefinitions(html: string, url: string): DictDefinition[] {
  const start = definitionsBlockStart(html);
  if (start === -1) return [];
  // После блока толкований в статье идут «Lesarten», «Bedeutungsteil» или «Beispiele».
  const tail = html.slice(start);
  const end = tail.search(/<div class="[^"]*(?:lesarten|bedeutungsteil|beispiele)[^"]*"/i);
  const block = end > 0 ? tail.slice(0, end) : tail.slice(0, 60_000);

  const result: string[] = [];
  for (const item of removeNestedLists(block).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = stripHtml(unescape(item[1]))
      .replace(/^\d+\.\s*/, '')
      .replace(/\s*\.\.\.\s*$/, '…')
      .trim();
    if (text.length <= 2 || text.length > MAX_LENGTH) continue;
    if (!result.includes(text)) result.push(text);
  }

  return result.slice(0, MAX_ITEMS).map((text) => ({ text, partOfSpeech: 'other', url }));
}

/** Немецкие толкования слова по DWDS. */
export async function lookupDwds(
  word: string,
  sourceLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<DictDefinition[]> {
  if (sourceLang !== 'de') return [];
  const url = `${DICT.dwdsPage}/wb/${encodeURIComponent(word)}`;
  const response = await dictFetch(url, signal, { Accept: 'text/html' });
  if (!response || !response.ok) return [];
  try {
    return parseDwdsDefinitions(await response.text(), url);
  } catch {
    return [];
  }
}
