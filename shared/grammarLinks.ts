/**
 * Проверенные ссылки на открытые источники для тем справочника (файл `links.ts`).
 * Здесь только адреса и подписи — чужой текст не копируем.
 * Коды: wb — Wikibooks «German» (CC BY-SA), dw — Deutsche Welle «Learn German», gt — Goethe-Institut (DE/EN),
 * dwds — DWDS. Код gtr необязательный: страница на русском сайте Goethe.
 *
 * Страницы Wikibooks с разделами (#…) можно открыть; проверить их кодом
 * нельзя — сервер ставит 404. Статусы проверены 31.10.2026: Wikibooks 200,
 * DW 200, Goethe 403 (закрыт для роботов, в браузере открывается).
 */

export interface GrammarTopicLink {
  /** Название источника: «Wikibooks», «Deutsche Welle», «Goethe-Institut», «DWDS». */
  title: string;
  url: string;
}

type LinkCode =
  | 'wbGrammar'
  | 'wbVerbs'
  | 'wbPresent'
  | 'wbPerfect'
  | 'wbPraeteritum'
  | 'wbFuture'
  | 'wbModals'
  | 'wbPrefixes'
  | 'wbReflexive'
  | 'wbPronouns'
  | 'wbPersonal'
  | 'wbNouns'
  | 'wbGender'
  | 'wbPlurals'
  | 'wbAdjectives'
  | 'wbAdverbs'
  | 'wbCases'
  | 'wbGenitive'
  | 'wbSentences'
  | 'wbSyntax'
  | 'wbQuestions'
  | 'wbMidfield'
  | 'wbSubordinate'
  | 'wbRelative'
  | 'wbInfinitive'
  | 'wbSubConj'
  | 'wbCoordConj'
  | 'wbPrepositions'
  | 'wbTwoWay'
  | 'wbDativePrep'
  | 'wbImperative'
  | 'wbStemChanging'
  | 'wbLessons'
  | 'dwGrammar'
  | 'dwCourse'
  | 'dwVocabulary'
  | 'dwExercises'
  | 'goetheGrammar'
  | 'goetheGrammarEn'
  | 'dwdsDictionary';

const WIKIBOOKS = 'https://en.wikibooks.org/wiki/German/Grammar/';

const LINKS: Record<LinkCode, GrammarTopicLink> = {
  wbGrammar: { title: 'Wikibooks', url: 'https://en.wikibooks.org/wiki/German/Grammar' },
  wbVerbs: { title: 'Wikibooks', url: `${WIKIBOOKS}Verbs` },
  wbPresent: { title: 'Wikibooks', url: `${WIKIBOOKS}Verbs#Present_Tense` },
  wbPerfect: { title: 'Wikibooks', url: `${WIKIBOOKS}Verbs#Perfect_Tense` },
  wbPraeteritum: { title: 'Wikibooks', url: `${WIKIBOOKS}The_simple_past_tense` },
  wbFuture: { title: 'Wikibooks', url: `${WIKIBOOKS}Future_tense` },
  wbModals: { title: 'Wikibooks', url: `${WIKIBOOKS}Modal_auxiliary_verbs` },
  wbPrefixes: { title: 'Wikibooks', url: `${WIKIBOOKS}Prefixed_verbs` },
  wbReflexive: { title: 'Wikibooks', url: `${WIKIBOOKS}Reflexive_pronouns` },
  wbPronouns: { title: 'Wikibooks', url: `${WIKIBOOKS}Pronouns` },
  wbPersonal: { title: 'Wikibooks', url: `${WIKIBOOKS}Personal_pronouns` },
  wbNouns: { title: 'Wikibooks', url: `${WIKIBOOKS}Nouns` },
  wbGender: { title: 'Wikibooks', url: `${WIKIBOOKS}Noun_gender` },
  wbPlurals: { title: 'Wikibooks', url: `${WIKIBOOKS}Noun_plurals` },
  wbAdjectives: { title: 'Wikibooks', url: `${WIKIBOOKS}Declining_adjectives` },
  wbAdverbs: { title: 'Wikibooks', url: `${WIKIBOOKS}Adjectives_and_Adverbs` },
  wbCases: { title: 'Wikibooks', url: `${WIKIBOOKS}Cases` },
  wbGenitive: { title: 'Wikibooks', url: `${WIKIBOOKS}Possessives_and_the_genitive_case` },
  wbSentences: { title: 'Wikibooks', url: `${WIKIBOOKS}Sentences` },
  wbSyntax: { title: 'Wikibooks', url: `${WIKIBOOKS}Sentences#Syntax_of_Interrogatives_and_Imperatives` },
  wbQuestions: { title: 'Wikibooks', url: `${WIKIBOOKS}Polar_questions` },
  wbMidfield: { title: 'Wikibooks', url: `${WIKIBOOKS}Sentences#Order_of_phrases_-_Reihenfolge_der_Satzglieder` },
  wbSubordinate: { title: 'Wikibooks', url: `${WIKIBOOKS}Sentences#Subordinate_Clauses` },
  wbRelative: { title: 'Wikibooks', url: `${WIKIBOOKS}Sentences#Relative_Clauses` },
  wbInfinitive: { title: 'Wikibooks', url: `${WIKIBOOKS}Sentences#Infinitive_Clauses` },
  wbSubConj: { title: 'Wikibooks', url: `${WIKIBOOKS}Subordinating_conjunctions` },
  wbCoordConj: { title: 'Wikibooks', url: `${WIKIBOOKS}Coordinating_conjunctions` },
  wbPrepositions: { title: 'Wikibooks', url: `${WIKIBOOKS}Prepositions_and_Postpositions` },
  wbTwoWay: { title: 'Wikibooks', url: `${WIKIBOOKS}Prepositions_with_accusative_and_dative` },
  wbDativePrep: { title: 'Wikibooks', url: `${WIKIBOOKS}Dative_prepositions` },
  wbImperative: { title: 'Wikibooks', url: `${WIKIBOOKS}Imperatives` },
  wbStemChanging: { title: 'Wikibooks', url: `${WIKIBOOKS}Stem-changing_verbs` },
  wbLessons: { title: 'Wikibooks', url: 'https://en.wikibooks.org/wiki/German/Lessons' },
  dwGrammar: { title: 'Deutsche Welle', url: 'https://learngerman.dw.com/de/grammatik/s-13559254' },
  dwCourse: { title: 'Deutsche Welle', url: 'https://learngerman.dw.com/de/kurs/s-9367337' },
  dwVocabulary: { title: 'Deutsche Welle', url: 'https://learngerman.dw.com/de/vokabeln/s-9277774' },
  dwExercises: { title: 'Deutsche Welle', url: 'https://learngerman.dw.com/de/uebungen/s-9277547' },
  goetheGrammar: { title: 'Goethe-Institut', url: 'https://www.goethe.de/de/spr/ueb/gra.html' },
  goetheGrammarEn: { title: 'Goethe-Institut', url: 'https://www.goethe.de/en/spr/ueb/gra.html' },
  dwdsDictionary: { title: 'DWDS', url: 'https://www.dwds.de' },
};

/** Какие ссылки показывать у каждой темы (1–2 адреса, как требует задание). */
const TOPIC_LINKS: Record<string, LinkCode[]> = {
  'definite-articles': ['wbNouns', 'dwGrammar'],
  'indefinite-articles': ['wbNouns', 'dwCourse'],
  'negative-article-kein': ['wbGrammar', 'dwCourse'],
  'possessive-articles': ['wbPronouns', 'wbGenitive'],
  'noun-gender': ['wbGender', 'dwdsDictionary'],
  'noun-plurals': ['wbPlurals', 'dwdsDictionary'],
  'n-declension': ['wbNouns', 'dwGrammar'],
  'cases-overview': ['wbCases', 'wbGrammar'],
  nominativ: ['wbCases', 'wbGrammar'],
  akkusativ: ['wbCases', 'wbTwoWay'],
  dativ: ['wbCases', 'wbDativePrep'],
  genitiv: ['wbGenitive', 'wbCases'],
  'adjectives-overview': ['wbAdverbs', 'dwGrammar'],
  'weak-declension': ['wbAdjectives', 'dwGrammar'],
  'strong-declension': ['wbAdjectives', 'dwGrammar'],
  'mixed-declension': ['wbAdjectives', 'dwGrammar'],
  'adjective-comparison': ['wbAdverbs', 'wbGrammar'],
  'personal-pronouns': ['wbPersonal', 'dwGrammar'],
  'reflexive-pronouns': ['wbReflexive', 'dwGrammar'],
  'demonstrative-pronouns': ['wbPronouns', 'wbGrammar'],
  'relative-pronouns': ['wbRelative', 'wbPronouns'],
  'indefinite-pronouns': ['wbPronouns', 'dwGrammar'],
  praesens: ['wbPresent', 'wbStemChanging'],
  perfekt: ['wbPerfect', 'dwGrammar'],
  'perfekt-haben-sein': ['wbPerfect', 'wbVerbs'],
  praeteritum: ['wbPraeteritum', 'dwGrammar'],
  plusquamperfekt: ['wbPraeteritum', 'wbPerfect'],
  'futur-1': ['wbFuture', 'wbVerbs'],
  'futur-2': ['wbFuture', 'wbVerbs'],
  'partizip-2': ['wbPerfect', 'wbVerbs'],
  'tenses-overview': ['wbVerbs', 'dwGrammar'],
  'konjunktiv-1': ['wbVerbs', 'goetheGrammar'],
  'konjunktiv-2': ['wbVerbs', 'goetheGrammar'],
  'konjunktiv-2-wuerde': ['wbVerbs', 'goetheGrammar'],
  'konjunktiv-2-haette-waere': ['wbVerbs', 'goetheGrammarEn'],
  'konjunktiv-2-modal': ['wbModals', 'goetheGrammar'],
  imperativ: ['wbImperative', 'wbSyntax'],
  'indirekte-rede': ['wbSubordinate', 'goetheGrammar'],
  passiv: ['wbVerbs', 'goetheGrammar'],
  vorgangspassiv: ['wbVerbs', 'goetheGrammar'],
  zustandspassiv: ['wbVerbs', 'goetheGrammarEn'],
  modalverben: ['wbModals', 'dwGrammar'],
  'reflexive-verbs': ['wbReflexive', 'dwGrammar'],
  'separable-verbs': ['wbPrefixes', 'wbVerbs'],
  'inseparable-verbs': ['wbPrefixes', 'dwdsDictionary'],
  'strong-verbs': ['wbVerbs', 'wbPraeteritum'],
  'verbs-with-prepositions': ['wbPrepositions', 'dwdsDictionary'],
  'word-order-main-clause': ['wbSentences', 'dwGrammar'],
  'word-order-subordinate': ['wbSubordinate', 'wbSubConj'],
  'word-order-questions': ['wbQuestions', 'wbSyntax'],
  tekamolo: ['wbMidfield', 'wbSentences'],
  'negation-nicht-kein': ['wbGrammar', 'dwCourse'],
  'relative-clauses': ['wbRelative', 'wbSubordinate'],
  'infinitive-with-zu': ['wbInfinitive', 'wbSentences'],
  'conjunctions-weil-denn-da': ['wbSubConj', 'wbCoordConj'],
  'conjunctions-obwohl-trotzdem': ['wbSubConj', 'wbCoordConj'],
  'conjunctions-dass': ['wbSubConj', 'wbSubordinate'],
  'conjunctions-ob': ['wbQuestions', 'wbSubConj'],
  'conjunctions-wenn-als': ['wbSubConj', 'wbSubordinate'],
  'conjunctions-damit-um-zu': ['wbSubConj', 'wbInfinitive'],
  'conjunctions-overview': ['wbCoordConj', 'wbSubConj'],
  'prepositions-akkusativ': ['wbPrepositions', 'wbTwoWay'],
  'prepositions-dativ': ['wbDativePrep', 'wbPrepositions'],
  wechselpraepositionen: ['wbTwoWay', 'dwGrammar'],
  'prepositions-genitiv': ['wbGenitive', 'wbPrepositions'],
  numbers: ['wbGrammar', 'dwdsDictionary'],
  'telling-time': ['wbGrammar', 'dwdsDictionary'],
  'polite-forms': ['wbPersonal', 'dwCourse'],
  'academic-language': ['wbLessons', 'goetheGrammar'],
};

/** Страницы со ссылками на отдельные разделы (…#…) проверить запросом нельзя: отдаём базовую. */
export function checkableUrl(url: string): string {
  return url.split('#')[0];
}

/** Ссылки темы: две подобранные страницы; незнакомая тема получает общий справочник. */
export function grammarTopicLinks(slug: string): GrammarTopicLink[] {
  const codes = TOPIC_LINKS[slug] ?? ['wbGrammar', 'dwGrammar'];
  return codes.map((code) => LINKS[code]);
}

/** Коды всех источников справочника (для справочника источников на «О приложении»). */
export const GRAMMAR_SOURCES: GrammarTopicLink[] = [LINKS.wbGrammar, LINKS.dwGrammar, LINKS.goetheGrammar, LINKS.dwdsDictionary];
