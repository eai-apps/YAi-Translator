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

/** «ИИ Pro»: перевод + 3 примера и совет; без примеров ответ всё равно принимаем (совет и примеры — бонус). */
export function validateTranslatePro(raw: unknown): TranslateCore | null {
  const core = validateTranslate(raw);
  if (!core || !isRecord(raw)) return core;
  const examples = asArray(raw.examples, 3)
    .map((item) => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 300);
      return text ? { text, translation: asText(item.translation, 300) ?? '' } : null;
    })
    .filter((item): item is { text: string; translation: string } => item !== null);
  const tip = asText(raw.tip, 400) || null;
  return examples.length > 0 || tip ? { ...core, pro: { examples, tip } } : core;
}
