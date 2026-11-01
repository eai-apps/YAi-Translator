/**
 * POST /api/admin/recreate-card — пересоздание карточки слова в складе D1 (этап 15Б, версия 0.17.5).
 * Удаляет старую карточку из word_cards и кэша, заново запрашивает у ИИ и сохраняет.
 */
import type { WordResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, jsonResponse, readJsonBody } from '../../_lib/http';
import { buildWordPrompt } from '../../_lib/prompts';
import { runJsonTask } from '../../_lib/router';
import { validateWordCard } from '../../_lib/validate';
import { buildDictEntry } from '../../_lib/dict';
import { mergeDictionaryData } from '../../_lib/dict/merge';
import { saveStoredWordCard } from '../../_lib/wordStore';
import { buildCacheKey, requireLanguage, requireText } from '../../_lib/request';
import { writeCache } from '../../_lib/cache';
import { LIMITS } from '../../_lib/config';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const env = context.env;
  try {
    await requireAdmin(env, context.request);

    const body: Record<string, unknown> = await readJsonBody(context.request).catch(() => ({}));
    const word = requireText(body.word, LIMITS.maxWordLength);
    const lang = requireLanguage(body.lang ?? 'de');
    const explainLang = requireLanguage(body.explainLang ?? 'ru');

    if (!word) {
      throw new ApiError('VALIDATION', 400);
    }

    // 1. Удаляем старую версию карточки из постоянного склада
    // Старую карточку сохраняем до успешного ответа ИИ.

    // 2. Словари
    const dictPromise = buildDictEntry(env, word, lang, explainLang, context.request.signal).catch(() => null);

    // 3. Запрос к ИИ
    const promptUiLang = (explainLang === 'uk' ? 'ru' : explainLang) as 'ru' | 'de' | 'en';
    const prompt = buildWordPrompt({
      word,
      sourceLang: lang,
      targetLang: explainLang,
      uiLang: promptUiLang,
    });

    let cardData;
    let cardProvider: any = 'dict';

    try {
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
      throw error;
    }

    // Сохраняем в постоянный склад D1
    await saveStoredWordCard(env, word, lang, explainLang, cardData, cardProvider);

    // Записываем в кэш
    const cacheKey = await buildCacheKey({
      kind: 'word',
      text: word,
      sourceLang: lang,
      targetLang: explainLang,
      uiLang: promptUiLang,
    });
    const result: WordResponse = { card: cardData, provider: cardProvider, cached: false };
    await writeCache(env, cacheKey, 'word', result, LIMITS.wordCacheTtlSeconds);

    return jsonResponse({
      ok: true,
      card: cardData,
      provider: cardProvider,
    });
  } catch (error) {
    return errorResponse(error, 'ru');
  }
};
