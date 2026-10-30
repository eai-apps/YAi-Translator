/**
 * Цепочка обычных переводчиков (без ИИ). Порядок задан в shared/types.ts → CLASSIC_PROVIDERS
 * и повторён в config.ts → CLASSIC.order.
 * Если сервис не умеет определять язык, подставляем язык, угаданный по тексту.
 */
import type { ProviderId, SiteKeyProvider } from '../../../shared/types';
import { CLASSIC } from '../config';
import type { Env } from '../env';
import { hasAnyKey } from '../keypool';
import { deeplTranslator } from './deepl';
import { guessLanguage } from './detect';
import { googleTranslator } from './google';
import { laraTranslator } from './lara';
import { m2m100Translator } from './m2m100';
import { microsoftTranslator } from './microsoft';
import { myMemoryTranslator } from './mymemory';
import type { ClassicInput, ClassicResult, ClassicTranslator } from './types';

const TRANSLATORS: Record<string, ClassicTranslator> = {
  deepl: deeplTranslator,
  lara: laraTranslator,
  microsoft: microsoftTranslator,
  google: googleTranslator,
  mymemory: myMemoryTranslator,
  m2m100: m2m100Translator,
};

/** Сервисы, у которых ключи могут лежать в пуле (переменные Cloudflare и админка). */
const POOLED: SiteKeyProvider[] = ['deepl', 'lara', 'microsoft', 'google'];

function pooled(id: ProviderId): SiteKeyProvider | null {
  return (POOLED as string[]).includes(id) ? (id as SiteKeyProvider) : null;
}

/** Настроен ли конкретный переводчик (есть ключ или binding). */
export async function isClassicConfigured(env: Env, id: ProviderId): Promise<boolean> {
  const translator = TRANSLATORS[id];
  if (!translator) return false;
  const pool = pooled(id);
  if (pool) return hasAnyKey(env, pool);
  return translator.isConfigured(env);
}

/** Какие обычные переводчики сейчас настроены (для /api/health). */
export async function configuredClassic(env: Env): Promise<Partial<Record<ProviderId, boolean>>> {
  const result: Partial<Record<ProviderId, boolean>> = {};
  await Promise.all(
    CLASSIC.order.map(async (id) => {
      result[id] = await isClassicConfigured(env, id);
    }),
  );
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
    if (!translator || !(await isClassicConfigured(input.env, id))) continue;

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
