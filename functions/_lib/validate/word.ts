/** Проверка карточки слова: значения, артикль, склонение, спряжение, примеры (этап 8: формы и подсветка). */
import type {
  Conjugation,
  DeclensionRow,
  Imperative,
  VerbForm,
  WordCard,
  WordExample,
} from '../../../shared/types';
import { isLanguageCode } from '../../../shared/languages';
import { isGermanGrammarSlug } from '../../../shared/grammarTopics';
import { asArray, asEnum, asStringList, asText, CASES, isRecord, LEVELS, POS } from './helpers';

export type WordCore = WordCard;

/** 6 форм с подлежащими; короче — не форма, а мусор. */
function toForms(value: unknown): VerbForm[] {
  return asArray(value, 6)
    .map((item) => {
      if (!isRecord(item)) return null;
      const pronoun = asText(item.pronoun, 40);
      const form = asText(item.form, 120);
      return pronoun && form ? { pronoun, form } : null;
    })
    .filter((item): item is VerbForm => item !== null);
}

/** Partizip II из строки Perfekt («hat gemacht» → «gemacht»), если ИИ не прислал отдельно. */
function partizip2FromPerfekt(perfekt: string): string {
  const parts = perfekt.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function toImperative(value: unknown): Imperative | null {
  if (!isRecord(value)) return null;
  const du = asText(value.du, 120);
  const ihr = asText(value.ihr, 120);
  const sie = asText(value.sie, 120);
  return du || ihr || sie ? { du, ihr, sie } : null;
}

function toConjugation(value: unknown): Conjugation | null {
  const raw = isRecord(value) ? value : null;
  if (!raw) return null;
  const praesens = toForms(raw.praesens);
  if (praesens.length === 0) return null;
  const perfekt = asText(raw.perfekt, 160);
  const konjunktiv2 = toForms(raw.konjunktiv2);
  return {
    praesens,
    praeteritum: toForms(raw.praeteritum),
    perfekt,
    auxiliary: asEnum(raw.auxiliary, ['haben', 'sein'] as const, 'haben'),
    partizip2: asText(raw.partizip2, 120) || partizip2FromPerfekt(perfekt) || null,
    ...(konjunktiv2.length > 0 ? { konjunktiv2 } : {}),
    imperativ: toImperative(raw.imperativ),
  };
}

/**
 * Подсветка примера: кусок должен реально стоять в предложении (валидатор «если не найден — без подсветки»).
 * Перевод-кусок ищется в переводе без учёта регистра; нет его — подсвечивается только немецкая часть.
 */
function toMatch(value: unknown, text: string, translation: string): WordExample['match'] {
  if (!isRecord(value)) return null;
  const source = asText(value.source, 200);
  const target = asText(value.target, 200);
  if (!source || !text.toLowerCase().includes(source.toLowerCase())) return null;
  return {
    source,
    target: target && translation.toLowerCase().includes(target.toLowerCase()) ? target : '',
  };
}

export function validateWordCard(raw: unknown): WordCore | null {
  const source = isRecord(raw) && isRecord(raw.card) ? raw.card : raw;
  if (!isRecord(source)) return null;

  const meanings = asArray(source.meanings, 6)
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

  const conjugation = toConjugation(source.conjugation);

  const examples = asArray(source.examples, 10)
    .map((item): WordExample | null => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 400);
      if (!text) return null;
      const translation = asText(item.translation, 400);
      const senseNumber = Number(item.sense);
      return {
        level: asEnum(item.level, LEVELS, 'A2'),
        text,
        translation,
        match: toMatch(item.match, text, translation),
        sense:
          Number.isInteger(senseNumber) && senseNumber >= 1 && senseNumber <= meanings.length
            ? senseNumber
            : null,
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
    // Однокоренные слова (этап 8: вкладка «Связанные слова»).
    family: asStringList(source.family, 10),
    phrases,
    grammarNotes: asArray(source.grammarNotes, 6)
      .map((item) => asText(item, 400))
      .filter((item) => item.length > 0),
    // Темы справочника для пояснений «Что важно знать» (этап 5).
    grammarTopics: [
      ...new Set(
        asArray(source.grammarTopics, 8)
          .map((item) => asText(item, 80))
          .filter((item) => isGermanGrammarSlug(item)),
      ),
    ],
  };
}
