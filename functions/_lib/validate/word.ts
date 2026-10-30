/** Проверка карточки слова: значения, артикль, склонение, спряжение, примеры. */
import type {
  DeclensionRow,
  WordCard,
  WordExample,
} from '../../../shared/types';
import { isLanguageCode } from '../../../shared/languages';
import { asArray, asEnum, asStringList, asText, CASES, isRecord, LEVELS, POS } from './helpers';

export type WordCore = WordCard;

export function validateWordCard(raw: unknown): WordCore | null {
  const source = isRecord(raw) && isRecord(raw.card) ? raw.card : raw;
  if (!isRecord(source)) return null;

  const meanings = asArray(source.meanings, 5)
    .map((item) => {
      if (!isRecord(item)) return null;
      const translations = asStringList(item.translations, 5);
      if (translations.length === 0) return null;
      return {
        sense: asText(item.sense, 160),
        translations,
        note: asText(item.note, 400) || null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  if (meanings.length === 0) return null;

  const declensionRows = asArray(source.declension, 4)
    .map((item): DeclensionRow | null => {
      if (!isRecord(item)) return null;
      const grammaticalCase = CASES.find((value) => value === item.grammaticalCase);
      if (!grammaticalCase) return null;
      const singular = asText(item.singular, 120);
      const plural = asText(item.plural, 120);
      if (!singular) return null;
      return { grammaticalCase, singular, plural };
    })
    .filter((item): item is DeclensionRow => item !== null);

  const conjugationRaw = isRecord(source.conjugation) ? source.conjugation : null;
  const toForms = (value: unknown) =>
    asArray(value, 6)
      .map((item) => {
        if (!isRecord(item)) return null;
        const pronoun = asText(item.pronoun, 40);
        const form = asText(item.form, 120);
        return pronoun && form ? { pronoun, form } : null;
      })
      .filter((item): item is { pronoun: string; form: string } => item !== null);

  const praesens = conjugationRaw ? toForms(conjugationRaw.praesens) : [];
  const praeteritum = conjugationRaw ? toForms(conjugationRaw.praeteritum) : [];
  const conjugation =
    praesens.length > 0
      ? {
          praesens,
          praeteritum,
          perfekt: asText(conjugationRaw?.perfekt, 160),
          auxiliary: asEnum(conjugationRaw?.auxiliary, ['haben', 'sein'] as const, 'haben'),
        }
      : null;

  const examples = asArray(source.examples, 8)
    .map((item): WordExample | null => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 400);
      if (!text) return null;
      return {
        level: asEnum(item.level, LEVELS, 'A1'),
        text,
        translation: asText(item.translation, 400),
      };
    })
    .filter((item): item is WordExample => item !== null);

  const phrases = asArray(source.phrases, 6)
    .map((item) => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 240);
      return text ? { text, translation: asText(item.translation, 240) } : null;
    })
    .filter((item): item is { text: string; translation: string } => item !== null);

  return {
    lemma: asText(source.lemma, 120) || asText(source.word, 120),
    language: isLanguageCode(source.language) ? source.language : 'de',
    partOfSpeech: asEnum(source.partOfSpeech, POS, 'other'),
    article:
      source.article === 'der' || source.article === 'die' || source.article === 'das'
        ? source.article
        : null,
    plural: asText(source.plural, 120) || null,
    transcription: asText(source.transcription, 120) || null,
    meanings,
    declension: declensionRows.length > 0 ? declensionRows : null,
    conjugation,
    governance: asStringList(source.governance, 8),
    examples,
    synonyms: asStringList(source.synonyms, 8),
    antonyms: asStringList(source.antonyms, 8),
    phrases,
  };
}
