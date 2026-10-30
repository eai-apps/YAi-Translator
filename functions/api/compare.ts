/**
 * POST /api/compare — «Как переводят другие»: один и тот же текст во всех подключённых
 * обычных переводчиках сразу. ИИ здесь не участвует.
 *
 * Кэш — отдельно для каждого сервиса (ключ kind=translate, текст «compare|сервис|текст»):
 * если сегодня упал один сервис, ответы остальных всё равно попадут в кэш.
 * Сервис из поля exclude (тот, что дал основной перевод) в списке не повторяется.
 */
import { CLASSIC_PROVIDERS } from '../../shared/types';
import type { CompareItem, CompareResponse, ProviderId } from '../../shared/types';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireLanguage, requireSourceLanguage, requireText } from '../_lib/request';
import type { LanguageCode, SourceLanguage } from '../../shared/types';
import { readCache, writeCache } from '../_lib/cache';
import { errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { isClassicConfigured, translateClassic } from '../_lib/classic';
import { bump } from '../_lib/stats';

/** Один сервис: сначала кэш этого сервиса, затем настоящий запрос. */
async function translateOne(
  env: Env,
  provider: ProviderId,
  text: string,
  sourceLang: SourceLanguage,
  targetLang: LanguageCode,
  signal: AbortSignal,
): Promise<string | null> {
  const key = await buildCacheKey({ kind: 'translate', text: `compare|${provider}|${text}`, sourceLang, targetLang });
  const cached = await readCache<{ text: string }>(env, key);
  if (cached?.text) return cached.text;

  const result = await translateClassic({ env, text, sourceLang, targetLang, signal }, [provider]);
  if (!result?.text) return null;
  await writeCache(env, key, 'translate', { text: result.text });
  return result.text;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const text = requireText(body.text);
    const sourceLang = requireSourceLanguage(body.sourceLang);
    const targetLang = requireLanguage(body.targetLang);
    const exclude = typeof body.exclude === 'string' ? body.exclude : null;

    const env = context.env;
    const candidates = await Promise.all(
      CLASSIC_PROVIDERS.filter((id) => id !== exclude).map(async (id) => ({
        id,
        configured: await isClassicConfigured(env, id),
      })),
    );
    const providers = candidates.filter((item) => item.configured).map((item) => item.id);

    // Все сервисы работают параллельно: медленный не ждёт остальных.
    const items: CompareItem[] = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        text: await translateOne(env, provider, text, sourceLang, targetLang, context.request.signal),
      })),
    );

    void bump(env, ['compare']);
    const response: CompareResponse = { items };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
