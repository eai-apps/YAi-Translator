/**
 * Данные и разбор ru.wiktionary (для перевода ru → de без ИИ).
 * Извлекает перевод на немецкий (с родом: Blume f → «die Blume») и русские толкования,
 * затем дополняет главное немецкое слово формами и падежами из de.wiktionary.
 */
import type { DictForm, DictSense, PartOfSpeech } from '../../../shared/types';
import { DICT } from '../config';
import { dictFetch, stripHtml } from './http';
import { lookupGermanWiktionary } from './wiktionaryDe';

export interface RuWiktionaryResult {
  url: string;
  mainGermanWord: string | null;
  translations: Array<{ german: string; article: 'der' | 'die' | 'das' | null; formatted: string }>;
  senses: DictSense[];
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
  transcription: string | null;
  forms: DictForm[];
  partOfSpeech: PartOfSpeech | null;
}

const RU_WIKT_HTML = 'https://ru.wiktionary.org/api/rest_v1/page/html';
const RU_WIKT_PAGE = 'https://ru.wiktionary.org/wiki';

/** Определяет артикль по букве или названию рода. */
function parseGender(text: string): 'der' | 'die' | 'das' | null {
  const lower = text.toLowerCase();
  if (/\b(жен|fem|f)\b/i.test(lower) || lower === 'ж' || lower === 'ж.') return 'die';
  if (/\b(муж|masc|m)\b/i.test(lower) || lower === 'м' || lower === 'м.') return 'der';
  if (/\b(сред|neut|n)\b/i.test(lower) || lower === 'с' || lower === 'с.') return 'das';
  return null;
}

/** Извлекает фрагмент немецкого перевода из HTML ru.wiktionary. */
function extractGermanTranslations(html: string): Array<{ word: string; gender: 'der' | 'die' | 'das' | null }> {
  const results: Array<{ word: string; gender: 'der' | 'die' | 'das' | null }> = [];
  const seen = new Set<string>();

  // Ищем блоки перевода на немецкий: <span class="perev-code">de</span></span> <span lang="de">...</span>
  // или <li>...Немецкий...de...<span lang="de">...</span>
  const deBlockRegex = /<span class="perev-code">de<\/span><\/span>\s*<span lang="de">([\s\S]*?)<\/span>/gi;
  let match: RegExpExecArray | null;

  while ((match = deBlockRegex.exec(html)) !== null) {
    const content = match[1];
    // Внутри span: ссылки на слова <a ...>Слово</a> и рядом род <i>ж</i> / title="..."
    const itemRegex = /<a[^>]*>([^<]+)<\/a>([^;<]*)/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(content)) !== null) {
      const rawWord = stripHtml(itemMatch[1]).trim();
      if (!rawWord || seen.has(rawWord.toLowerCase())) continue;
      const after = itemMatch[2] ?? '';
      const gender = parseGender(after);
      seen.add(rawWord.toLowerCase());
      results.push({ word: rawWord, gender });
    }
  }

  // Запасной вариант: если perev-code не сработал, ищем строку с «Немецкий»
  if (results.length === 0) {
    const lineRegex = /Немецкий[^<]*<\/a>[\s\S]*?<span lang="de">([\s\S]*?)<\/span>/gi;
    while ((match = lineRegex.exec(html)) !== null) {
      const content = match[1];
      const itemRegex = /<a[^>]*>([^<]+)<\/a>([^;<]*)/gi;
      let itemMatch: RegExpExecArray | null;
      while ((itemMatch = itemRegex.exec(content)) !== null) {
        const rawWord = stripHtml(itemMatch[1]).trim();
        if (!rawWord || seen.has(rawWord.toLowerCase())) continue;
        const gender = parseGender(itemMatch[2] ?? '');
        seen.add(rawWord.toLowerCase());
        results.push({ word: rawWord, gender });
      }
    }
  }

  return results.slice(0, 10);
}

/** Русские толкования из раздела «Значение». */
function extractRussianDefinitions(html: string): string[] {
  const definitions: string[] = [];
  const meaningIndex = html.indexOf('id="Значение"');
  if (meaningIndex === -1) return definitions;

  const olStart = html.indexOf('<ol', meaningIndex);
  if (olStart === -1 || olStart - meaningIndex > 500) return definitions;
  const olEnd = html.indexOf('</ol>', olStart);
  if (olEnd === -1) return definitions;

  const olContent = html.slice(olStart, olEnd);
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(olContent)) !== null) {
    const text = stripHtml(liMatch[1])
      .replace(/^◆.*$/gm, '') // цитаты-примеры в ru.wiktionary начинаются с ◆
      .replace(/\s+/g, ' ')
      .trim();
    if (text && text.length > 2 && text.length < 250) {
      definitions.push(text);
      if (definitions.length >= DICT.maxSenses) break;
    }
  }

  return definitions;
}

export async function lookupWiktionaryRu(
  word: string,
  signal: AbortSignal | undefined,
): Promise<RuWiktionaryResult | null> {
  const url = `${RU_WIKT_HTML}/${encodeURIComponent(word)}`;
  const response = await dictFetch(url, signal, { Accept: 'text/html' });
  if (!response || !response.ok) return null;

  const html = await response.text();
  const rawTranslations = extractGermanTranslations(html);
  if (rawTranslations.length === 0) return null;

  const russianDefs = extractRussianDefinitions(html);
  const mainGerman = rawTranslations[0].word;

  // Для главного немецкого слова запрашиваем род, формы и склонение из de.wiktionary
  const germanData = await lookupGermanWiktionary(mainGerman, signal).catch(() => null);

  const translations = rawTranslations.map((item, idx) => {
    let gender = item.gender;
    // Если род не нашли в ru.wiktionary, для первого слова берём из de.wiktionary
    if (!gender && idx === 0 && germanData?.gender) {
      gender = germanData.gender;
    }
    const formatted = gender ? `${gender} ${item.word}` : item.word;
    return { german: item.word, article: gender, formatted };
  });

  const senses: DictSense[] = [];
  // Формируем карточки значений: немецкие переводы с артиклем и русским толкованием
  if (russianDefs.length > 0) {
    const allFormatted = translations.map((t) => t.formatted).join(', ');
    for (let i = 0; i < russianDefs.length; i++) {
      senses.push({
        source: 'wiktionary',
        partOfSpeech: germanData?.partOfSpeech ?? 'noun',
        definition: russianDefs[i],
        translation: i === 0 ? allFormatted : translations[i]?.formatted ?? translations[0].formatted,
        translationLang: 'de',
      });
    }
  } else {
    for (const t of translations) {
      senses.push({
        source: 'wiktionary',
        partOfSpeech: germanData?.partOfSpeech ?? 'noun',
        definition: word,
        translation: t.formatted,
        translationLang: 'de',
      });
    }
  }

  return {
    url: `${RU_WIKT_PAGE}/${encodeURIComponent(word)}`,
    mainGermanWord: mainGerman,
    translations,
    senses: senses.slice(0, DICT.maxSenses),
    gender: germanData?.gender ?? translations[0].article ?? null,
    plural: germanData?.plural ?? null,
    transcription: germanData?.transcription ?? null,
    forms: germanData?.forms ?? [],
    partOfSpeech: germanData?.partOfSpeech ?? 'noun',
  };
}
