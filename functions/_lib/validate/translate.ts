/** Проверка обычного перевода: основной текст и 2–3 альтернативы. */
import type { TranslateResponse, TranslationStyle } from '../../../shared/types';
import { isLanguageCode } from '../../../shared/languages';
import { asArray, asEnum, asText, isRecord, STYLES } from './helpers';

export type TranslateCore = Omit<TranslateResponse, 'provider' | 'cached'>;

export function validateTranslate(raw: unknown): TranslateCore | null {
  if (!isRecord(raw)) return null;
  const translatedText = asText(raw.translatedText, 8000);
  if (!translatedText) return null;

  // Одинаковые стили и дубли основного перевода отбрасываем.
  const seenStyles = new Set<string>();
  const alternatives = asArray(raw.alternatives, 5)
    .map((item) => {
      if (!isRecord(item)) return null;
      const style = asEnum(item.style, STYLES, 'neutral');
      const text = asText(item.text, 8000);
      if (!text || text === translatedText || seenStyles.has(style)) return null;
      seenStyles.add(style);
      return { style, text };
    })
    .filter((item): item is { style: TranslationStyle; text: string } => item !== null)
    .slice(0, 3);

  return {
    translatedText,
    alternatives,
    detectedLang: isLanguageCode(raw.detectedLang) ? raw.detectedLang : null,
  };
}
