/**
 * POST /api/admin/warm — прогрев карточек популярных немецких и английских слов (этап 15Б, версия 0.17.5).
 * Вызывается по cron ночью или вручную из админки.
 * Использует бесплатные ключи сайта, сохраняет карточки навсегда в D1 `word_cards`.
 */
import type { WordResponse } from '../../../shared/types';
import { TOTAL_WARM_TASKS, getWarmTaskAt } from '../../../shared/warmWords';
import type { Env } from '../../_lib/env';
import { LIMITS } from '../../_lib/config';
import { readSetting, writeSetting, SETTINGS_KEYS } from '../../_lib/settings';
import { requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, jsonResponse, readJsonBody } from '../../_lib/http';
import { buildCacheKey } from '../../_lib/request';
import { writeCache } from '../../_lib/cache';
import { buildWordPrompt } from '../../_lib/prompts';
import { runJsonTask } from '../../_lib/router';
import { validateWordCard } from '../../_lib/validate';
import { buildDictEntry } from '../../_lib/dict';
import { mergeDictionaryData } from '../../_lib/dict/merge';
import { getStoredWordCard, saveStoredWordCard } from '../../_lib/wordStore';

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
        ? Math.min(Math.floor(rawBatch), 20)
        : 20;

    const cursor = (await readSetting<number>(env, SETTINGS_KEYS.warmCardsCursor)) ?? 0;
    const safeCursor = cursor >= TOTAL_WARM_TASKS ? 0 : cursor;

    let warmed = 0;
    let skipped = 0;
    let errors = 0;
    let processed = 0;

    for (let i = 0; i < batchSize; i++) {
      if (context.request.signal.aborted) break;
      processed++;
      const taskIndex = (safeCursor + i) % TOTAL_WARM_TASKS;
      const task = getWarmTaskAt(taskIndex);

      try {
        // Проверяем, есть ли уже карточка в постоянном складе
        const stored = await getStoredWordCard(env, task.lemma, task.lang, task.explainLang);
        if (stored) {
          skipped++;
          continue;
        }

        const dictPromise = buildDictEntry(env, task.lemma, task.lang, task.explainLang, context.request.signal).catch(() => null);
        const promptUiLang = (task.explainLang === 'uk' ? 'ru' : task.explainLang) as 'ru' | 'de' | 'en';
        const prompt = buildWordPrompt({
          word: task.lemma,
          sourceLang: task.lang,
          targetLang: task.explainLang,
          uiLang: promptUiLang,
        });

        let cardData;
        let cardProvider: any = 'dict';

        try {
          // Прогрев не расходует дневной лимит пользователей (beforeShared намеренно не передаётся)
          const aiResult = await runJsonTask({
            env,
            prompt,
            userKeys: {},
            signal: context.request.signal,
            validate: validateWordCard,
            isRegistered: true,
            only: ['gemini', 'groq', 'workersai'],
          });
          cardData = aiResult.data;
          cardProvider = aiResult.provider;
          const dict = await dictPromise;
          mergeDictionaryData(cardData, dict);
        } catch (error) {
          // Недоступность ИИ не заполняет склад пустыми карточками.
          throw error;
        }

        // Сохраняем навсегда в D1 word_cards
        await saveStoredWordCard(env, task.lemma, task.lang, task.explainLang, cardData, cardProvider);

        // Пишем также в cache
        const cacheKey = await buildCacheKey({
          kind: 'word',
          text: task.lemma,
          sourceLang: task.lang,
          targetLang: task.explainLang,
          uiLang: promptUiLang,
        });
        const result: WordResponse = { card: cardData, provider: cardProvider, cached: false };
        await writeCache(env, cacheKey, 'word', result, LIMITS.wordCacheTtlSeconds);

        warmed++;
      } catch (err) {
        console.warn(`[warm] Ошибка прогрева слова "${task.lemma}":`, err instanceof Error ? err.message : err);
        errors++;
        break;
      }
    }

    const nextCursor = (safeCursor + processed - errors) % TOTAL_WARM_TASKS;
    await writeSetting(env, SETTINGS_KEYS.warmCardsCursor, nextCursor);

    return jsonResponse({
      ok: true,
      cursor: nextCursor,
      total: TOTAL_WARM_TASKS,
      processed,
      warmed,
      skipped,
      errors,
    });
  } catch (error) {
    return errorResponse(error, 'ru');
  }
};
