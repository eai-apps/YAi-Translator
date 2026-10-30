/** Проверка ответа «Проверить мой немецкий»: исправленный текст и список ошибок. */
import type { CheckResponse, Correction } from '../../../shared/types';
import { asArray, asEnum, asText, CORRECTION_TYPES, isRecord } from './helpers';

export type CheckCore = Omit<CheckResponse, 'provider' | 'cached'>;

export function validateCheck(raw: unknown): CheckCore | null {
  if (!isRecord(raw)) return null;
  const correctedText = asText(raw.correctedText, 8000);
  if (!correctedText) return null;

  const corrections = asArray(raw.corrections, 30)
    .map((item): Correction | null => {
      if (!isRecord(item)) return null;
      const corrected = asText(item.corrected, 400);
      const explanation = asText(item.explanation, 800);
      if (!corrected || !explanation) return null;
      return {
        original: asText(item.original, 400),
        corrected,
        explanation,
        type: asEnum(item.type, CORRECTION_TYPES, 'grammar'),
      };
    })
    .filter((item): item is Correction => item !== null);

  return {
    correctedText,
    // Если модель нашла ошибки, текст не может считаться правильным.
    isCorrect: raw.isCorrect === true && corrections.length === 0,
    corrections,
    encouragement: asText(raw.encouragement, 400),
  };
}
