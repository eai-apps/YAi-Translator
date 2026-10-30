/** POST /api/explain — грамматический разбор текста на языке интерфейса. */
import type { ExplainResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText, requireUiLanguage } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { errorResponse, getClientIp, getHeaderKeys, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { resolveUserKeys } from '../_lib/auth/keys';
import { createLimitGuard } from '../_lib/usage';
import { buildExplainPrompt } from '../_lib/prompts';
import { runJsonTask } from '../_lib/router';
import { validateExplain } from '../_lib/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);
    const explainUiLang = requireUiLanguage(body.uiLang ?? uiLang);

    const env = context.env;
    // Ключи: заголовки X-User-* важнее, затем ключи из аккаунта (если вошёл).
    const userKeys = await resolveUserKeys(env, context.request, getHeaderKeys(context.request));

    const cacheKey = await buildCacheKey({
      kind: 'explain',
      text,
      sourceLang,
      targetLang,
      uiLang: explainUiLang,
    });
    const cached = await readCache<ExplainResponse>(env, cacheKey);
    if (cached) return jsonResponse({ ...cached, cached: true });

    // Дневной лимит считается, только когда дело доходит до общих ключей сайта.
    const limitGuard = createLimitGuard(env, getClientIp(context.request));

    const prompt = buildExplainPrompt({ text, sourceLang, targetLang, uiLang: explainUiLang });
    const { data, provider } = await runJsonTask({
      env,
      prompt,
      userKeys,
      signal: context.request.signal,
      beforeShared: limitGuard,
      validate: validateExplain,
    });

    const result: ExplainResponse = { ...data, provider, cached: false };
    await writeCache(env, cacheKey, 'explain', result);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
