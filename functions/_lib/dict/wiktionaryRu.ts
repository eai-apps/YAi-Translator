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

/** Род по подсказке ru.wiktionary: <span title="форма (формы) женского рода"><i>ж</i>.</span>. */
function genderFromTitle(fragment: string): 'der' | 'die' | 'das' | null {
  const title = /title="([^"]*)"/.exec(fragment)?.[1]?.toLowerCase() ?? '';
  const mark = stripHtml(fragment).trim().toLowerCase();
  if (title.includes('женск') || /^ж\.?$/.test(mark)) return 'die';
  if (title.includes('мужск') || /^м\.?$/.test(mark)) return 'der';
  if (title.includes('средн') || /^с\.?$/.test(mark)) return 'das';
  return parseGender(mark);
}

/**
 * Немецкие переводы из строк «Немецкий (de)» раздела «Перевод». Строка выглядит так:
 * <span lang="de"><a>Blume</a> <span title="…женского рода"><i>ж</i>.</span>; <a>Blüte</a> …</span></li>
 * Внутри есть вложенные <span>, поэтому строку берём целиком до </li> (исправление Claude, 0.10.0).
 */
function extractGermanTranslations(html: string): Array<{ word: string; gender: 'der' | 'die' | 'das' | null }> {
  const results: Array<{ word: string; gender: 'der' | 'die' | 'das' | null }> = [];
  const seen = new Set<string>();
  const lineRegex = /<span class="perev-code">de<\/span><\/span>\s*<span lang="de">([\s\S]*?)<\/li>/gi;
  let line: RegExpExecArray | null;
  while ((line = lineRegex.exec(html)) !== null) {
    // Слово и всё до следующего слова (там подсказка рода).
    const itemRegex = /<a[^>]*>([^<]+)<\/a>([\s\S]*?)(?=<a |$)/gi;
    let item: RegExpExecArray | null;
    while ((item = itemRegex.exec(line[1])) !== null) {
      const word = stripHtml(item[1]).trim();
      if (!word || !/^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\s-]*$/.test(word) || seen.has(word.toLowerCase())) continue;
      const tail = item[2].split(';')[0] ?? '';
      seen.add(word.toLowerCase());
      results.push({ word, gender: tail.includes('<span') || tail.trim() ? genderFromTitle(tail) : null });
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
    // Цитаты-примеры (◆ …) идут внутри того же пункта — отрезаем их до разбора текста.
    const body = liMatch[1].split(/<span class="example-fullblock/)[0];
    const text = stripHtml(body)
      .replace(/◆[\s\S]*$/, '')
      // Значки синонимов/антонимов «[ ≈ 1 ] [ ≠ 1 ]» и сноски «[7]» не нужны в толковании.
      .replace(/\[\s*[≈≠▲▼]?\s*\d+\s*\]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:)])/g, '$1')
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
        // Ru.wiktionary не связывает переводы с конкретным значением — все переводы у первого значения.
        translation: i === 0 ? allFormatted : null,
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
