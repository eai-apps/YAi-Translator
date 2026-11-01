/**
 * POST /api/admin/warm — прогрев карточек популярных немецких слов (этап 11).
 * Вызывается по cron раз в сутки или вручную с секретом WARM_TOKEN.
 * Использует только бесплатные ключи сайта, пишет карточки в D1-кэш.
 */
import type { WordResponse } from '../../../shared/types';
import { WARM_WORDS } from '../../../shared/warmWords';
import type { Env } from '../../_lib/env';
import { LIMITS } from '../../_lib/config';
import { readSetting, writeSetting, SETTINGS_KEYS } from '../../_lib/settings';
import { requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, jsonResponse, readJsonBody } from '../../_lib/http';
import { buildCacheKey } from '../../_lib/request';
import { readCache, writeCache } from '../../_lib/cache';
import { buildWordPrompt } from '../../_lib/prompts';
import { runJsonTask } from '../../_lib/router';
import { validateWordCard } from '../../_lib/validate';
import { buildDictEntry } from '../../_lib/dict';
import { mergeDictionaryData } from '../../_lib/dict/merge';

async function checkWarmAuth(env: Env, request: Request): Promise<void> {
  const auth = request.headers.get('Authorization') ?? '';
  if (env.WARM_TOKEN && auth === `Bearer ${env.WARM_TOKEN}`) {
    return;
  }
  const admin = await requireAdmin(env, request).catch(() => null);
  if (admin) return;
  throw new ApiError('UNAUTHORIZED', 401);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;
  try {
    await checkWarmAuth(env, context.request);

    const rawBody: Record<string, unknown> = await readJsonBody(context.request).catch(() => ({}));
    const rawBatch = rawBody.batchSize;
    const batchSize =
      typeof rawBatch === 'number' && rawBatch > 0
        ? Math.min(Math.floor(rawBatch), 100)
        : 40;

    const cursor = (await readSetting<number>(env, SETTINGS_KEYS.warmCardsCursor)) ?? 0;
    const safeCursor = cursor >= WARM_WORDS.length ? 0 : cursor;
    const slice = WARM_WORDS.slice(safeCursor, safeCursor + batchSize);

    let warmed = 0;
    let skipped = 0;
    let errors = 0;

    // Прогрев запускает только админ или cron с WARM_TOKEN — дневной лимит гостя (5 в день по IP сервера GitHub)
    // к нему не применяем, иначе прогревалось бы не больше 5 карточек в сутки.

    for (const word of slice) {
      if (context.request.signal.aborted) break;
      try {
        const cacheKey = await buildCacheKey({
          kind: 'word',
          text: word,
          sourceLang: 'de',
          targetLang: 'ru',
          uiLang: 'ru',
        });

        const cached = await readCache<WordResponse>(env, cacheKey);
        if (cached) {
          skipped++;
          continue;
        }

        const dictPromise = buildDictEntry(env, word, 'de', 'ru', context.request.signal).catch(() => null);
        const prompt = buildWordPrompt({ word, sourceLang: 'de', targetLang: 'ru', uiLang: 'ru' });

        const { data, provider } = await runJsonTask({
          env,
          prompt,
          userKeys: {},
          signal: context.request.signal,
          validate: validateWordCard,
          isRegistered: true,
          only: ['gemini', 'groq', 'workersai'],
        });

        mergeDictionaryData(data, await dictPromise);

        const result: WordResponse = { card: data, provider, cached: false };
        await writeCache(env, cacheKey, 'word', result, LIMITS.wordCacheTtlSeconds);
        warmed++;
      } catch (err) {
        console.warn(`[warm] Ошибка прогрева слова "${word}":`, err instanceof Error ? err.message : err);
        errors++;
      }
    }

    const nextCursor = (safeCursor + slice.length) % WARM_WORDS.length;
    await writeSetting(env, SETTINGS_KEYS.warmCardsCursor, nextCursor);

    return jsonResponse({
      ok: true,
      cursor: nextCursor,
      total: WARM_WORDS.length,
      processed: slice.length,
      warmed,
      skipped,
      errors,
    });
  } catch (error) {
    return errorResponse(error, 'ru');
  }
};
