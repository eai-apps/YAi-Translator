/**
 * Цепочка обычных переводчиков (без ИИ). Порядок задан в config.ts → CLASSIC.order.
 * Если сервис не умеет определять язык, подставляем язык, угаданный по тексту.
 */
import type { ProviderId } from '../../../shared/types';
import { CLASSIC } from '../config';
import type { Env } from '../env';
import { deeplTranslator } from './deepl';
import { guessLanguage } from './detect';
import { googleTranslator } from './google';
import { m2m100Translator } from './m2m100';
import { microsoftTranslator } from './microsoft';
import { myMemoryTranslator } from './mymemory';
import type { ClassicInput, ClassicResult, ClassicTranslator } from './types';

const TRANSLATORS: Record<string, ClassicTranslator> = {
  deepl: deeplTranslator,
  microsoft: microsoftTranslator,
  google: googleTranslator,
  mymemory: myMemoryTranslator,
  m2m100: m2m100Translator,
};

/** Настроен ли конкретный переводчик (есть ключ или binding). */
export function isClassicConfigured(env: Env, id: ProviderId): boolean {
  return TRANSLATORS[id]?.isConfigured(env) ?? false;
}

/** Какие обычные переводчики сейчас настроены (для /api/health). */
export function configuredClassic(env: Env): Partial<Record<ProviderId, boolean>> {
  const result: Partial<Record<ProviderId, boolean>> = {};
  for (const id of CLASSIC.order) result[id] = TRANSLATORS[id]?.isConfigured(env) ?? false;
  return result;
}

export async function translateClassic(
  input: ClassicInput,
  /** Какие сервисы пробовать (по умолчанию — все из CLASSIC.order, по порядку). */
  ids: readonly ProviderId[] = CLASSIC.order,
): Promise<(ClassicResult & { provider: ProviderId }) | null> {
  const guessed = input.sourceLang === 'auto' ? guessLanguage(input.text) : null;

  for (const id of ids) {
    const translator = TRANSLATORS[id];
    if (!translator || !translator.isConfigured(input.env)) continue;

    let sourceLang = input.sourceLang;
    if (sourceLang === 'auto' && !translator.supportsAutoDetect) {
      if (!guessed) continue;
      sourceLang = guessed;
    }
    // Исходный и целевой язык совпали — переводить нечего, этот сервис пропускаем.
    if (sourceLang === input.targetLang) continue;

    const result = await translator.translate({ ...input, sourceLang });
    if (result) {
      return {
        ...result,
        detectedLang: result.detectedLang ?? (input.sourceLang === 'auto' ? guessed : null),
        provider: translator.id,
      };
    }
  }
  return null;
}
