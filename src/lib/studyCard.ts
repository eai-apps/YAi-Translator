/**
 * Снимки слов для карточек учёбы (этап 6).
 * Данные берутся из уже загруженной карточки слова, словаря или готового набора —
 * новых запросов к ИИ при добавлении нет.
 */
import type {
  DeckWord,
  DictEntry,
  PartOfSpeech,
  StudyArticle,
  StudyCardInput,
  UiLanguage,
  WordCard,
} from '../../shared/types';
import { STUDY_MAX_CARDS, deckTranslation, studyCardId } from '../../shared/study';

/** «der Tisch» → артикль der и слово Tisch. */
export function splitArticle(text: string): { article: StudyArticle | null; lemma: string } {
  const match = text.trim().match(/^(der|die|das)\s+(.+)$/i);
  if (!match) return { article: null, lemma: text.trim() };
  return { article: match[1].toLowerCase() as StudyArticle, lemma: match[2].trim() };
}

/** Убирает пустые переводы и оставляет не больше трёх. */
export function cleanTranslations(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = (value ?? '').trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length === 3) break;
  }
  return result;
}

/** Карточка из ответа ИИ (WordCard). Только для немецких слов. */
export function cardFromWord(card: WordCard): StudyCardInput | null {
  if (card.language !== 'de') return null;
  const translations = cleanTranslations(card.meanings.flatMap((meaning) => meaning.translations));
  if (translations.length === 0) return null;

  const example = card.examples[0]
    ? { text: card.examples[0].text, translation: card.examples[0].translation }
    : null;

  return {
    lemma: card.lemma.trim(),
    article: card.article,
    plural: card.plural,
    partOfSpeech: card.partOfSpeech,
    translations,
    example,
    perfekt: card.conjugation?.perfekt ?? null,
  };
}

/** Карточка только из словарей (DictCard). Только для немецких слов. */
export function cardFromDict(entry: DictEntry, targetLang: UiLanguage): StudyCardInput | null {
  if (entry.sourceLang !== 'de') return null;

  // Сначала переводы на язык интерфейса, затем любые другие (Wiktionary даёт английский).
  const own = entry.senses.filter((sense) => sense.translation && sense.translationLang === targetLang);
  const other = entry.senses.filter((sense) => sense.translation && sense.translationLang !== targetLang);
  const translations = cleanTranslations([...own, ...other].map((sense) => sense.translation));
  if (translations.length === 0) return null;

  const example =
    entry.examples.find((item) => item.translation) ??
    entry.examples[0] ??
    null;
  const perfektForm = entry.forms.find((form) => /perfekt/i.test(form.label));

  return {
    lemma: entry.word.trim(),
    article: entry.gender,
    plural: entry.plural,
    partOfSpeech: (entry.partOfSpeech ?? 'other') as PartOfSpeech,
    translations,
    example: example?.translation ? { text: example.text, translation: example.translation } : null,
    perfekt: perfektForm?.value ?? null,
  };
}

/** Карточка из готового набора: перевод берётся на языке интерфейса. */
export function cardFromDeckWord(word: DeckWord, targetLang: UiLanguage): StudyCardInput {
  return {
    lemma: word.lemma,
    article: word.article,
    plural: word.plural,
    partOfSpeech: word.partOfSpeech,
    // Только один язык: «семья», а не «семья, family». Нет перевода на нужном языке — русский, потом английский.
    translations: cleanTranslations([deckTranslation(word, targetLang) || word.translations.ru || word.translations.en]),
    example: word.example,
    perfekt: null,
  };
}

/**
 * Простая карточка из строки перевода (1–3 слова): без грамматики, только перевод.
 * Нужна кнопке «+ В карточки» рядом со звёздочкой на экране «Перевод».
 */
export function cardFromTranslation(germanText: string, translatedText: string): StudyCardInput | null {
  const german = germanText.trim();
  const translation = translatedText.trim();
  if (!german || !translation) return null;
  if (german.split(/\s+/).length > 3 || translation.split(/\s+/).length > 6) return null;

  const { article, lemma } = splitArticle(german);
  if (!lemma) return null;
  return {
    lemma,
    article,
    plural: null,
    partOfSpeech: 'other',
    translations: cleanTranslations([translation]),
    example: null,
    perfekt: null,
  };
}

/** Готова ли карточка к сохранению: id, переводы и длина слова. */
export function isValidStudyInput(input: StudyCardInput): boolean {
  const id = studyCardId(input.lemma);
  return Boolean(id) && input.lemma.length <= 80 && input.translations.length > 0 && input.translations.length <= 3;
}

/** Сколько карточек ещё поместится в лимит аккаунта. */
export function freeSlots(current: number): number {
  return Math.max(0, STUDY_MAX_CARDS - current);
}
