import { reverseCardDirection } from '../../shared/cardDirection';
/** POST /api/word — карточка слова: значения, артикль, склонение, спряжение, примеры. */
import type { DictEntry, LanguageCode, WordResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { guessLanguage } from '../../shared/detect';
import { staticWordCard } from '../_lib/staticWord';
import { translateClassic } from '../_lib/classic';
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
import { mergeDictionaryData } from '../_lib/dict/merge';
import { paidRequiresLogin, resolveAiModel } from '../_lib/paid/pick';
import { getStoredWordCard, saveStoredWordCard } from '../_lib/wordStore';
import { assembleWordCard } from '../../shared/cardAssembler';

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

/** Очистка леммы от артиклей der/die/das/the/a/an для ключа карточки */
function cleanLemma(raw: string): string {
  return raw.trim().replace(/^(der|die|das|the|a|an)\s+/i, '').trim();
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

    const actualSource = sourceLang === 'auto' ? guessLanguage(word) ?? 'de' : sourceLang;
    const reverse = reverseCardDirection(actualSource, targetLang);
    const studyLang = reverse ? targetLang : actualSource;
    const explainLang = reverse ? actualSource : targetLang;
    let studyLemma = cleanLemma(word);
    if (reverse) {
      // Перевод из тела запроса не доверяется для записи общего склада: получаем эквивалент на сервере.
      const translated = await translateClassic({ env, text: word, sourceLang: actualSource, targetLang, signal: context.request.signal });
      studyLemma = cleanLemma(translated?.text ?? '');
    }
    if (!studyLemma) throw new ApiError('NO_PROVIDERS', 503);

    // 1. Проверяем постоянный склад карточек word_cards в D1 (одна карточка на слово для обоих направлений)
    if (studyLemma) {
      const stored = await getStoredWordCard(env, studyLemma, studyLang, explainLang);
      if (stored) {
        void bump(env, ['word', 'total', 'cache_hits']);
        return jsonResponse({ ...stored, cached: true });
      }
    }

    // Ключи: заголовки X-User-* важнее, затем ключи из аккаунта (если вошёл).
    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));

    // Словари и ИИ идут параллельно: страница не ждёт два запроса по очереди.
    const dictLang = studyLang;
    const dictPromise =
      dictLang === explainLang
        ? Promise.resolve(null)
        : lookupDict(env, studyLemma, dictLang, explainLang, context.request.signal).catch(() => null);

    const cacheKey = await buildCacheKey({ kind: 'word', text: word, sourceLang, targetLang, uiLang });
    const cached = await readCache<WordResponse>(env, cacheKey);
    if (cached) {
      const dict = await dictPromise;
      const card = { ...cached.card, dictSources: dict?.sources ?? cached.card.dictSources };
      void bump(env, ['word', 'total', 'cache_hits']);
      return jsonResponse({ ...cached, card, cached: true });
    }

    const session = await findRequestSession(env, context.request);
    const pickedModel = await resolveAiModel(env, body.aiModel);
    const aiModel = pickedModel && (session || !(await paidRequiresLogin(env))) ? pickedModel : undefined;
    const limitGuard = createLimitGuard(env, getClientIp(context.request), session?.userId);

    const prompt = buildWordPrompt({ word: studyLemma, sourceLang: studyLang, targetLang: explainLang,
      uiLang: explainLang === 'ru' || explainLang === 'de' || explainLang === 'en' ? explainLang : uiLang });

    try {
      const { data, provider } = await runJsonTask({
        env,
        prompt,
        userKeys,
        signal: context.request.signal,
        beforeShared: limitGuard,
        validate: validateWordCard,
        isRegistered: Boolean(session),
        ...(aiModel ? { only: ['paid' as const], sharedPaidPick: aiModel } : {}),
      });

      // Синонимы, примеры «из жизни», переводы и толкования из словарей.
      const dict = await dictPromise;
      mergeDictionaryData(data, dict);

      const result: WordResponse = { card: data, provider, cached: false };
      await writeCache(env, cacheKey, 'word', result, LIMITS.wordCacheTtlSeconds);

      // Сохраняем навсегда в склад карточек D1 для обоих направлений
      const cardLemma = cleanLemma(data.lemma || studyLemma);
      const cardLang = data.language || studyLang;
      if (cardLang === studyLang) await saveStoredWordCard(env, cardLemma, cardLang, explainLang, data, provider);

      void bump(env, ['word', 'total', 'ai_requests']);
      return jsonResponse(result);
    } catch (aiError) {
      if (context.request.signal.aborted) throw aiError;
      const staticCard = await staticWordCard(env, studyLemma, studyLang, explainLang, context.request.signal);
      if (staticCard) return jsonResponse({ card: staticCard, provider: 'dict', cached: false });
      // ИИ недоступен или исчерпан лимит — собираем полную карточку из открытых словарей без ошибки
      const dict = await dictPromise;
      const assembledTranslations = dict?.senses.map((s) => s.translation).filter((s): s is string => Boolean(s)) ?? [];
      const assembledExamples = (dict?.examples ?? []).map((e) => ({
        text: e.text,
        tr: { [explainLang]: e.translation || undefined },
      }));

      const assembledCard = assembleWordCard({
        lemma: studyLemma || word,
        lang: studyLang,
        explainLang,
        translations: assembledTranslations,
        examples: assembledExamples,
        synonyms: dict?.synonyms ?? [],
        dictSources: dict?.sources,
      });

      // Неполный ответ словаря не занимает вечный склад и не блокирует будущий разбор ИИ.

      void bump(env, ['word', 'total', 'dict_fallback']);
      return jsonResponse({
        card: assembledCard,
        provider: 'dict',
        cached: false,
      });
    }
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
