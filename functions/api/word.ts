/** POST /api/word — карточка слова: значения, артикль, склонение, спряжение, примеры. */
import type { DictEntry, LanguageCode, WordResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { LIMITS } from '../_lib/config';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { ApiError, errorResponse, getClientIp, getHeaderKeys, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { findRequestSession, resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { buildWordPrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { bump } from '../_lib/stats';
import { validateWordCard } from '../_lib/validate';
import { buildDictEntry } from '../_lib/dict';

/** Карточка из словарей для дополнения ответа ИИ; ошибка любого источника не ломает ответ ИИ. */
function lookupDict(
  env: Env,
  word: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  signal: AbortSignal,
): Promise<DictEntry | null> {
  return buildDictEntry(env, word, sourceLang, targetLang, signal);
}

/**
 * Дополнение карточки ИИ данными словарей (этап 4): синонимы OpenThesaurus, примеры Tatoeba,
 * переводы PONS, толкования DWDS. Данные ИИ не затираются — новые только добавляются.
 */
function mergeDictionaryData(card: WordResponse['card'], dict: DictEntry | null): void {
  if (!dict) return;

  // Синонимы: сначала от ИИ, затем из OpenThesaurus (дубликаты убираем).
  const known = new Set(card.synonyms.map((word) => word.toLowerCase()));
  for (const synonym of dict.synonyms) {
    if (known.has(synonym.toLowerCase())) continue;
    known.add(synonym.toLowerCase());
    card.synonyms.push(synonym);
  }

  // Переводы из двуязычного словаря — только если ИИ не дал ни одного.
  if (dict.senses.length > 0) {
    if (card.meanings.length === 0) {
      const pons = dict.senses.filter((sense) => sense.translation);
      if (pons.length > 0) {
        card.meanings = pons.map((sense) => ({
          sense: sense.definition,
          translations: (sense.translation ?? '').split(',').map((part) => part.trim()).filter(Boolean),
          note: null,
        }));
      }
    }
    // Часть речи и род — если ИИ не определил.
    if (card.article === null && dict.gender) card.article = dict.gender;
    if (card.plural === null && dict.plural) card.plural = dict.plural;
    if (card.transcription === null && dict.transcription) card.transcription = dict.transcription;
  }

  card.dictSources = dict.sources;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const word = requireText(body.word, LIMITS.maxWordLength);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      throw new ApiError('VALIDATION', 400);
    }

    const env = context.env;
    // Ключи: заголовки X-User-* важнее, затем ключи из аккаунта (если вошёл).
    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));

    // Словари и ИИ идут параллельно: страница не ждёт два запроса по очереди.
    const dictLang = sourceLang === 'auto' ? (targetLang === 'de' ? 'ru' : 'de') : sourceLang;
    const dictPromise =
      dictLang === targetLang
        ? Promise.resolve(null)
        : lookupDict(env, word, dictLang, targetLang, context.request.signal).catch(() => null);

    const cacheKey = await buildCacheKey({ kind: 'word', text: word, sourceLang, targetLang, uiLang });
    const cached = await readCache<WordResponse>(env, cacheKey);
    if (cached) {
      // Источники словарей указываются по свежему ответу словарей (в кэше карточки их нет).
      const dict = await dictPromise;
      const card = { ...cached.card, dictSources: dict?.sources ?? cached.card.dictSources };
      void bump(env, ['word', 'total', 'cache_hits']);
      return jsonResponse({ ...cached, card, cached: true });
    }

    const session = await findRequestSession(env, context.request);
    // Дневной лимит считается, только когда дело доходит до общих ключей сайта.
    const limitGuard = createLimitGuard(env, getClientIp(context.request), session?.userId);

    const prompt = buildWordPrompt({ word, sourceLang, targetLang, uiLang });
    const { data, provider } = await runJsonTask({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateWordCard,
      isRegistered: Boolean(session),
    });

    // Синонимы, примеры «из жизни», переводы и толкования из словарей.
    mergeDictionaryData(data, await dictPromise);

    const result: WordResponse = { card: data, provider, cached: false };
    await writeCache(env, cacheKey, 'word', result, LIMITS.wordCacheTtlSeconds);
    void bump(env, ['word', 'total', 'ai_requests']);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
