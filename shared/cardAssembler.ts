/**
 * Сборщик полной карточки слова из открытых словарей без ИИ (этап 15Б, версия 0.17.5).
 * Объединяет данные Kaikki (лексикон), Tatoeba (примеры), OpenThesaurus (синонимы),
 * таблицы склонений/спряжений и детерминированные правила грамматики.
 */
import type {
  DictSourceRef,
  LanguageCode,
  PartOfSpeech,
  WordCard,
  WordExample,
  WordMeaning,
} from './types';
import type { LexiconEntry, ResolvedLexiconEntry } from './lexicon';
import { getCefrLevel, isResolvedEntry } from './lexicon';
import { buildNounDeclension, buildVerbConjugation } from './lexiconForms';
import { buildGrammarNotes } from './grammarRules';

export interface ExampleInput {
  id?: number;
  text: string;
  tr?: Partial<Record<string, string | undefined>>;
}

export interface AssembleCardOptions {
  lemma: string;
  lang: LanguageCode;
  explainLang: LanguageCode;
  entry?: LexiconEntry | ResolvedLexiconEntry | null;
  translations?: string[];
  examples?: ExampleInput[];
  synonyms?: string[];
  antonyms?: string[];
  dictSources?: DictSourceRef[];
}

function resolvePartOfSpeech(rawPos?: string, lemma: string = '', lang: string = 'de'): PartOfSpeech {
  if (rawPos === 'n' || rawPos === 'noun') return 'noun';
  if (rawPos === 'v' || rawPos === 'verb') return 'verb';
  if (rawPos === 'adj' || rawPos === 'adjective') return 'adjective';
  if (rawPos === 'adv' || rawPos === 'adverb') return 'adverb';
  if (rawPos === 'pron' || rawPos === 'pronoun') return 'pronoun';
  if (rawPos === 'prep' || rawPos === 'preposition') return 'preposition';
  if (rawPos === 'conj' || rawPos === 'conjunction') return 'conjunction';
  if (rawPos === 'num' || rawPos === 'numeral') return 'numeral';

  // Эвристика по регистру и языку
  if (lang === 'de') {
    if (/^[A-ZÄÖÜ]/.test(lemma)) return 'noun';
    if (lemma.endsWith('en') || lemma.endsWith('ern') || lemma.endsWith('eln')) return 'verb';
  }
  return 'other';
}

function resolveArticle(gender?: string | null): 'der' | 'die' | 'das' | null {
  if (!gender) return null;
  const g = gender.toLowerCase();
  if (g === 'der' || g === 'm' || g === 'masculine') return 'der';
  if (g === 'die' || g === 'f' || g === 'feminine') return 'die';
  if (g === 'das' || g === 'n' || g === 'neuter') return 'das';
  return null;
}

/** Оценка CEFR уровня для примера предложений */
function evaluateExampleLevel(text: string): 'A1' | 'A2' | 'B1' | 'B2' {
  const words = text.trim().split(/\s+/).length;
  if (words <= 5) return 'A1';
  if (words <= 8) return 'A2';
  if (words <= 12) return 'B1';
  return 'B2';
}

export function assembleWordCard(options: AssembleCardOptions): WordCard {
  const {
    lemma,
    lang,
    explainLang,
    entry,
    translations = [],
    examples = [],
    synonyms = [],
    antonyms = [],
    dictSources = [],
  } = options;

  const resolved = isResolvedEntry(entry) ? entry : null;
  const nounEntry = resolved?.pos === 'n' ? resolved : null;
  const verbEntry = resolved?.pos === 'v' ? resolved : null;

  const pos = resolvePartOfSpeech(resolved?.pos, lemma, lang);
  const article = lang === 'de' && pos === 'noun' ? resolveArticle(nounEntry?.g) : null;
  const plural = nounEntry ? (nounEntry.pl ?? null) : null;
  const transcription = resolved?.ipa ?? resolved?.ipaUk ?? resolved?.ipaUs ?? null;
  const cefrLevel = resolved?.fr ? getCefrLevel(resolved.fr) : null;
  const frequencyRank = resolved?.fr ?? null;
  const audioUrl = resolved?.audio ?? null;

  // 1. Значения и переводы
  const rawTrList: string[] = [
    ...translations,
    ...(resolved?.tr?.[explainLang] || []),

  ];
  const uniqueTr = Array.from(new Set(rawTrList.map((t) => t.trim()).filter(Boolean)));
  const meanings: WordMeaning[] = [];

  if (uniqueTr.length > 0) {
    // Делим на 1–3 смысловые группы
    const firstGroup = uniqueTr.slice(0, 3);
    meanings.push({
      sense: firstGroup[0],
      translations: firstGroup,
      note: null,
    });
    if (uniqueTr.length > 3) {
      const secondGroup = uniqueTr.slice(3, 6);
      meanings.push({
        sense: secondGroup[0],
        translations: secondGroup,
        note: null,
      });
    }
  } else {
    meanings.push({
      sense: lemma,
      translations: [],
      note: null,
    });
  }

  // 2. Склонение и спряжение
  let declension = null;
  let conjugation = null;

  if (lang === 'de') {
    if (pos === 'noun') {
      declension = buildNounDeclension(lemma, nounEntry ?? undefined);
    } else if (pos === 'verb') {
      conjugation = buildVerbConjugation(lemma, verbEntry ?? undefined);
    }
  }

  // 3. Примеры Tatoeba по уровням A1, A2, B1, B2 (по 2 примера на уровень)
  const groupedExamples: Record<'A1' | 'A2' | 'B1' | 'B2', WordExample[]> = {
    A1: [],
    A2: [],
    B1: [],
    B2: [],
  };

  for (const ex of examples) {
    const trText = ex.tr?.[explainLang];
    if (!trText) continue;

    const level = evaluateExampleLevel(ex.text);
    if (groupedExamples[level].length < 2) {
      groupedExamples[level].push({
        level,
        text: ex.text,
        translation: trText,
      });
    }
  }

  const finalExamples: WordExample[] = [
    ...groupedExamples.A1,
    ...groupedExamples.A2,
    ...groupedExamples.B1,
    ...groupedExamples.B2,
  ];

  // 4. Синонимы и антонимы
  const allSynonyms = Array.from(new Set([...synonyms, ...(resolved?.syn || [])])).slice(0, 10);
  const allAntonyms = Array.from(new Set(antonyms)).slice(0, 6);

  // 5. Правила грамматики и управление
  const { grammarNotes, governance, grammarPoints } = buildGrammarNotes(
    lemma,
    lang,
    resolved?.pos,
    nounEntry?.g,
    nounEntry?.pl,
    verbEntry?.aux,
    explainLang,
  );

  // 6. Источники
  const finalSources: DictSourceRef[] = dictSources.length > 0 ? [...dictSources] : [
    { id: 'wiktionary', name: 'Kaikki / Wiktionary', url: 'https://kaikki.org' },
    { id: 'tatoeba', name: 'Tatoeba (CC-BY)', url: 'https://tatoeba.org' },
  ];
  if (lang === 'de') {
    finalSources.push({ id: 'openthesaurus', name: 'OpenThesaurus (LGPL)', url: 'https://www.openthesaurus.de' });
  }

  return {
    lemma,
    language: lang,
    partOfSpeech: pos,
    article,
    plural,
    transcription,
    meanings,
    declension,
    conjugation,
    governance,
    examples: finalExamples,
    synonyms: allSynonyms,
    antonyms: allAntonyms,
    phrases: [],
    grammarNotes,
    grammar: grammarPoints.length > 0 ? grammarPoints : undefined,
    dictSources: finalSources,
    audioUrl,
    cefrLevel,
    frequencyRank,
  };
}
