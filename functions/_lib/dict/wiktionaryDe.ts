/**
 * Данные и разбор de.wiktionary (HTML-страница немецкой статьи): род, множественное число,
 * падежи существительного, формы глагола и транскрипция [IPA].
 * Вынесено из wiktionary.ts: там значения и примеры из en.wiktionary (REST), здесь — формы.
 */
import type { DictForm } from '../../../shared/types';
import { DICT } from '../config';
import { dictFetch } from './http';

/** Статьи de.wiktionary бывают большими (сотни килобайт), но это нормально для Workers. */
export type GermanWikiData = {
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
  transcription: string | null;
  forms: DictForm[];
  partOfSpeech: 'verb' | 'noun' | null;
};

export const EMPTY_GERMAN: GermanWikiData = {
  gender: null,
  plural: null,
  transcription: null,
  forms: [],
  partOfSpeech: null,
};

const GENDER_BY_EM: Record<string, 'der' | 'die' | 'das'> = {
  maskulin: 'der',
  feminin: 'die',
  neutrum: 'das',
};

const NOUN_ROWS: Array<[string, string]> = [
  ['Nominativ · Singular', 'Nominativ Singular'],
  ['Genitiv · Singular', 'Genitiv Singular'],
  ['Dativ · Singular', 'Dativ Singular'],
  ['Akkusativ · Singular', 'Akkusativ Singular'],
  ['Nominativ · Plural', 'Nominativ Plural'],
  ['Genitiv · Plural', 'Genitiv Plural'],
  ['Dativ · Plural', 'Dativ Plural'],
  ['Akkusativ · Plural', 'Akkusativ Plural'],
];

const VERB_ROWS: Array<[string, string]> = [
  ['Präsens · ich', 'Präsens_ich'],
  ['Präsens · du', 'Präsens_du'],
  ['Präsens · er/sie/es', 'Präsens_er, sie, es'],
  ['Präteritum · ich', 'Präteritum_ich'],
  ['Partizip II', 'Partizip II'],
  ['Imperativ', 'Imperativ Singular'],
  ['Hilfsverb', 'Hilfsverb'],
];

/**
 * Значения из шаблона карточки de.wiktionary.
 * Старый парсер отдаёт data-mw без экранирования кавычек, новый (Parsoid) — с экранированием (\"),
 * поэтому кавычки перед разбором нормализуются.
 */
export function readTemplateParams(rawHtml: string, template: string): Record<string, string> | null {
  const html = rawHtml.replace(/\\"/g, '"');
  const index = html.indexOf(template);
  if (index === -1) return null;
  const marker = '"params":{';
  const start = html.indexOf(marker, index);
  if (start === -1) return null;

  // Ищем закрывающую скобку с учётом вложенности.
  let depth = 0;
  let end = start + marker.length - 1;
  for (let i = end; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    else if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const raw = html
    .slice(start + marker.length - 1, end)
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  try {
    const parsed = JSON.parse(raw.replace(/\\n/g, '')) as Record<string, unknown>;
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      // Писаное значение: "Nominativ Singular":"Haus".
      if (typeof value === 'string') params[key] = value.trim();
      // Parsoid: "Nominativ Singular":{"wt":"Haus"}.
      else if (value && typeof value === 'object' && typeof (value as { wt?: unknown }).wt === 'string') {
        params[key] = (value as { wt: string }).wt.trim();
      }
    }
    return params;
  } catch {
    return null;
  }
}

/** Род, множественное число, падежи, формы глагола и IPA со страницы de.wiktionary. */
export async function lookupGermanWiktionary(
  word: string,
  signal: AbortSignal | undefined,
): Promise<GermanWikiData> {
  const response = await dictFetch(`${DICT.wiktionaryHtml}/${encodeURIComponent(word)}`, signal, {
    Accept: 'text/html',
  });
  if (!response || !response.ok) return EMPTY_GERMAN;

  const html = await response.text();
  // Род у всех частей речи: title="Genus: Neutrum (grammatikal. Geschlecht: sächlich)".
  const genus = html.match(/title="Genus:\s*([A-Za-zäöü]+)/);
  const gender = genus ? (GENDER_BY_EM[genus[1].toLowerCase()] ?? null) : null;

  const forms: DictForm[] = [];
  const noun = readTemplateParams(html, 'Deutsch Substantiv Übersicht');
  if (noun) {
    for (const [label, key] of NOUN_ROWS) {
      if (noun[key]) forms.push({ label, value: noun[key] });
    }
  }

  const verb = readTemplateParams(html, 'Deutsch Verb Übersicht');
  if (verb) {
    for (const [label, key] of VERB_ROWS) {
      if (verb[key]) forms.push({ label, value: verb[key] });
    }
  }

  const ipa = html.match(/class="ipa"[^>]*>([^<]+)</);

  return {
    gender,
    plural: noun?.['Nominativ Plural'] ?? null,
    transcription: ipa ? `[${ipa[1].trim()}]` : null,
    forms: forms.slice(0, DICT.maxForms),
    partOfSpeech: verb ? 'verb' : noun ? 'noun' : null,
  };
}
