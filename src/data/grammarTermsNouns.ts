/**
 * Словарь терминов: артикли, существительные, падежи, прилагательные, местоимения. (версия 0.6.0).
 * Результат собирается в словарь тем в grammarTermsData.ts; поиск по тексту — в grammarTerms.ts.
 */
import type { GrammarTermEntry } from './grammarTermTypes';

export const TERMS_NOUNS: GrammarTermEntry[] = [
  {
    slug: 'definite-articles',
    aliases: [
      'bestimmter Artikel',
      'bestimmte Artikel',
      'определённый артикль',
      'Определенный артикль',
      'definite article',
      'definite articles',
    ],
    patterns: ['определённ\\w* артикл\\w*', 'определенн\\w* артикл\\w*'],
  },

  {
    slug: 'indefinite-articles',
    aliases: ['unbestimmter Artikel', 'неопределённый артикль', 'неопределенный артикль', 'indefinite article'],
    patterns: ['неопределённ\\w* артикл\\w*', 'неопределенн\\w* артикл\\w*'],
  },

  {
    slug: 'negative-article-kein',
    aliases: ['Negativartikel', 'kein-Artikel', 'kein', 'отрицательный артикль', 'negative article'],
  },

  {
    slug: 'possessive-articles',
    aliases: ['Possessivartikel', 'притяжательный артикль', 'possessive article', 'possessive articles'],
    patterns: ['притяжательн\\w* артикл\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'noun-gender',
    aliases: ['Genus', 'grammatisches Geschlecht', 'род существительного', 'род существительных', 'noun gender', 'gender of nouns'],
    patterns: ['род\\w* существительн\\w*'],
  },

  {
    slug: 'noun-plurals',
    aliases: ['Plural', 'Mehrzahl', 'множественное число', 'plural forms', 'plural form', 'noun plurals'],
    patterns: ['множественн\\w* числ\\w*', 'Plural\\w*'],
    stems: ['Plural'],
  },

  {
    slug: 'n-declension',
    aliases: ['n-Deklination', 'n-declension', 'weak noun', 'слабое склонение существительных', 'n-склонение'],
    patterns: ['слаб\\w* склонени\\w* существительн\\w*', 'n-склонени\\w*'],
  },

  {
    slug: 'cases-overview',
    aliases: ['Kasus', 'Fälle', 'падеж', 'падежи', 'case', 'cases', 'grammatical case'],
    skipInNotes: true,
  },

  { slug: 'nominativ', aliases: ['Nominativ', 'номинатив', 'Nominativs', 'именительный падеж', 'nominative', 'nominative case'], patterns: ['именительн\\w* падеж\\w*', 'Nominativ\\w*'] },

  { slug: 'akkusativ', aliases: ['Akkusativ', 'аккузатив', 'винительный падеж', 'akkusative', 'accusative case'], patterns: ['винительн\\w* падеж\\w*', 'Akkusativ\\w*'] },

  { slug: 'dativ', aliases: ['Dativ', 'датив', 'дательный падеж', 'dative', 'dative case'], patterns: ['дательн\\w* падеж\\w*', 'Dativ\\w*'] },

  { slug: 'genitiv', aliases: ['Genitiv', 'генитив', 'родительный падеж', 'genitive', 'genitive case'], patterns: ['родительн\\w* падеж\\w*', 'Genitiv\\w*'] },

  {
    slug: 'adjectives-overview',
    aliases: ['Adjektivdeklination', 'Adjektiv', 'склонение прилагательных', 'adjective declension', 'adjective'],
    patterns: ['склонени\\w* прилагательн\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'weak-declension',
    aliases: ['schwache Deklination', 'schwache Adjektivdeklination', 'слабое склонение', 'weak declension', 'weak adjective declension'],
    patterns: ['слаб\\w* склонени\\w* прилагательн\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'strong-declension',
    aliases: ['starke Deklination', 'starke Adjektivdeklination', 'сильное склонение', 'strong declension', 'strong adjective declension'],
    patterns: ['сильн\\w* склонени\\w* прилагательн\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'mixed-declension',
    aliases: ['gemischte Deklination', 'gemischte Adjektivdeklination', 'смешанное склонение', 'mixed declension', 'mixed adjective declension'],
    patterns: ['смешанн\\w* склонени\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'adjective-comparison',
    aliases: ['Komparativ', 'Superlativ', 'Steigerung', 'степени сравнения', 'сравнительная степень', 'превосходная степень', 'comparative', 'superlative'],
    patterns: ['степен\\w* сравнени\\w*', 'сравнительн\\w* степен\\w*', 'превосходн\\w* степен\\w*'],
  },

  {
    slug: 'personal-pronouns',
    aliases: ['Personalpronomen', 'личные местоимения', 'личное местоимение', 'personal pronoun', 'personal pronouns'],
    patterns: ['личн\\w* местоимени\\w*'],
  },

  {
    slug: 'reflexive-pronouns',
    aliases: ['Reflexivpronomen', 'возвратное местоимение', 'возвратные местоимения', 'reflexive pronoun'],
    patterns: ['возвратн\\w* местоимени\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'demonstrative-pronouns',
    aliases: ['Demonstrativpronomen', 'der, die, das als Pronomen', 'указательные местоимения', 'указательное местоимение', 'demonstrative pronoun'],
    patterns: ['указательн\\w* местоимени\\w*'],
    skipInNotes: true,
  },

  {
    slug: 'relative-pronouns',
    aliases: ['Relativpronomen', 'относительное местоимение', 'относительные местоимения', 'relative pronoun'],
    patterns: ['относительн\\w* местоимени\\w*'],
  },

  {
    slug: 'indefinite-pronouns',
    aliases: ['Indefinitpronomen', 'man', 'неопределённое местоимение', 'неопределенные местоимения', 'indefinite pronoun'],
    patterns: ['неопределённ\\w* местоимени\\w*', 'неопределенн\\w* местоимени\\w*'],
    skipInNotes: true,
  },
];
