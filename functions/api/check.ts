/**
 * POST /api/check — проверка правописания и грамматики через LanguageTool (этап 18, версия 0.20.0).
 * Кэш в D1 на 1 день (86400 с) и ограничение частоты (~20 запросов/мин).
 * При превышении лимита или сбое тихо отключается без ошибок пользователю.
 */
import type { CheckResponse, Correction, CorrectionType, SourceLanguage } from '../../shared/types';
import { allowRequest } from '../_lib/requestRate';
import type { Env } from '../_lib/env';
import { buildCacheKey, requireText, requireUiLanguage, requireSourceLanguage } from '../_lib/request';
import { readCache, writeCache } from '../_lib/cache';
import { errorResponse, getClientIp, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { bump } from '../_lib/stats';
import { withTimeoutSignal } from '../_lib/utils';

const CHECK_CACHE_TTL = 86_400; // 1 день
const LT_TIMEOUT_MS = 4_000; // 4 секунды
const LT_RATE_LIMIT = 20; // макс. запросов в минуту на IP

/** Сопоставление языков приложения с кодами LanguageTool */
function mapLanguageToolLang(lang?: string): string {
  if (!lang || lang === 'auto') return 'auto';
  const clean = lang.toLowerCase();
  switch (clean) {
    case 'de':
      return 'de-DE';
    case 'en':
      return 'en-US';
    case 'ru':
      return 'ru-RU';
    case 'uk':
      return 'uk-UA';
    case 'fr':
      return 'fr';
    case 'es':
      return 'es';
    case 'it':
      return 'it';
    case 'pl':
      return 'pl-PL';
    case 'pt':
      return 'pt-PT';
    case 'nl':
      return 'nl';
    default:
      return 'auto';
  }
}

function mapIssueType(catId?: string, issueType?: string): CorrectionType {
  const cat = (catId || '').toUpperCase();
  const issue = (issueType || '').toLowerCase();

  if (cat.includes('TYPO') || cat.includes('SPELL') || issue.includes('misspelling')) return 'spelling';
  if (cat.includes('PUNCTUATION')) return 'punctuation';
  if (cat.includes('STYLE') || cat.includes('REDUNDANCY')) return 'style';
  if (cat.includes('WORD_ORDER') || issue.includes('word-order')) return 'word-order';
  if (cat.includes('CONFUSED_WORDS') || cat.includes('COLLOCATIONS')) return 'vocabulary';
  return 'grammar';
}

interface LtMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements?: Array<{ value: string }>;
  rule?: {
    id?: string;
    issueType?: string;
    category?: { id?: string; name?: string };
  };
}

interface LtResponse {
  matches?: LtMatch[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    requireText(body.text);
    const text = body.text as string;
    const checkUiLang = requireUiLanguage(body.uiLang ?? uiLang);
    const sourceLang: SourceLanguage = requireSourceLanguage(body.sourceLang || body.lang || 'auto');

    const env = context.env;
    const clientIp = getClientIp(context.request);

    // 1. Проверка кэша D1 на 1 день
    const cacheKey = await buildCacheKey({
      kind: 'check',
      text: `${text.length}:${text.search(/\S/)}:${text}`,
      sourceLang,
      uiLang: checkUiLang,
    });
    const cached = await readCache<CheckResponse>(env, cacheKey);
    if (cached) {
      void bump(env, ['check', 'languagetool', 'cache_hits', 'total']);
      return jsonResponse({ ...cached, cached: true });
    }

    // 2. Ограничение частоты (~20 запросов в минуту на IP)
    if (!(await allowRequest(env, 'languagetool', clientIp, LT_RATE_LIMIT))) {
      // При превышении лимита тихо возвращаем статус без ошибок
      return jsonResponse({
        correctedText: text,
        isCorrect: false,
        available: false,
        corrections: [],
        encouragement: '',
        provider: 'languagetool',
        cached: false,
      });
    }

    // 3. Запрос к публичному API LanguageTool
    const { signal: timeoutSignal, clear } = withTimeoutSignal(context.request.signal, LT_TIMEOUT_MS);
    let ltData: LtResponse | null = null;
    try {
      const formParams = new URLSearchParams();
      formParams.set('text', text.slice(0, 20_000));
      formParams.set('language', mapLanguageToolLang(sourceLang));

      const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'YAi-Translator/0.20 (+https://yai-translator.pages.dev/about)',
          Accept: 'application/json',
        },
        body: formParams.toString(),
        signal: timeoutSignal,
      });

      if (!res.ok) {
        // Лимит или временная недоступность — тихо возвращаем пустые исправления
        return jsonResponse({
          correctedText: text,
          isCorrect: false,
        available: false,
          corrections: [],
          encouragement: '',
          provider: 'languagetool',
          cached: false,
        });
      }

      ltData = (await res.json()) as LtResponse;
    } catch {
      // Сетевая ошибка или таймаут — тихо завершаем без падения интерфейса
      return jsonResponse({
        correctedText: text,
        isCorrect: false,
        available: false,
        corrections: [],
        encouragement: '',
        provider: 'languagetool',
        cached: false,
      });
    } finally {
      clear();
    }

    const matches = ltData?.matches ?? [];

    // Преобразуем совпадения в формат Correction
    const corrections: Correction[] = matches.map((m) => {
      const original = text.slice(m.offset, m.offset + m.length);
      const replacements = (m.replacements || []).map((r) => r.value).filter(Boolean).slice(0, 5);
      return {
        original,
        corrected: replacements[0] || original,
        explanation: m.message || m.shortMessage || 'Потенциальная неточность',
        type: mapIssueType(m.rule?.category?.id, m.rule?.issueType),
        offset: m.offset,
        length: m.length,
        replacements,
      };
    });

    // Формируем исправленный текст (заменяя с конца строки)
    const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset);
    let correctedText = text;
    for (const match of sortedMatches) {
      const best = match.replacements?.[0]?.value;
      if (best !== undefined) {
        correctedText =
          correctedText.slice(0, match.offset) +
          best +
          correctedText.slice(match.offset + match.length);
      }
    }

    const result: CheckResponse = {
      correctedText,
      isCorrect: corrections.length === 0,
      corrections,
      encouragement:
        corrections.length === 0
          ? checkUiLang === 'de'
            ? 'Keine Fehler gefunden!'
            : checkUiLang === 'en'
              ? 'No errors found!'
              : 'Ошибок не обнаружено!'
          : '',
      provider: 'languagetool',
      cached: false,
    };

    await writeCache(env, cacheKey, 'check', result, CHECK_CACHE_TTL);
    void bump(env, ['check', 'languagetool', 'total']);
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
