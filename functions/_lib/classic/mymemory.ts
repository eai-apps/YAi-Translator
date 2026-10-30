/**
 * MyMemory — бесплатный переводчик без ключа.
 * Лимит: 5 000 символов в день, с адресом почты (MYMEMORY_EMAIL) — 50 000.
 * Один запрос — не больше 500 байт, поэтому длинный текст режем по предложениям.
 */
import { CLASSIC } from '../config';
import { readCache, writeCache } from '../cache';
import type { Env } from '../env';
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  quotaFinished?: boolean;
  responseDetails?: string;
}

/**
 * MyMemory считает лимит по IP. У Cloudflare один IP на тысячи чужих сайтов, поэтому общий лимит
 * быстро кончается (ответ 429 «NEXT AVAILABLE IN 11 HOURS 28 MINUTES»). Тогда сервер «отдыхает»
 * от MyMemory до указанного времени, а фронтенд переводит через MyMemory прямо из браузера
 * пользователя (src/lib/myMemoryBrowser.ts) — у каждого человека свой лимит.
 */
const REST_KEY = 'mymemory:resting';

async function isResting(env: Env): Promise<boolean> {
  return (await readCache<boolean>(env, REST_KEY)) === true;
}

/** Из «NEXT AVAILABLE IN 11 HOURS 28 MINUTES 00 SECONDS» — секунды до сброса (по умолчанию 1 час). */
export function restSecondsFrom(details: string): number {
  const match = /IN\s+(\d+)\s+HOURS?\s+(\d+)\s+MINUTES?/i.exec(details);
  if (!match) return 3600;
  return Math.max(60, Number(match[1]) * 3600 + Number(match[2]) * 60);
}

async function startResting(env: Env, details: string): Promise<void> {
  await writeCache(env, REST_KEY, 'translate', true, restSecondsFrom(details));
}

/** Делит текст на куски до maxBytes, стараясь резать по концу предложения. */
export function splitIntoChunks(text: string, maxBytes: number): string[] {
  const encoder = new TextEncoder();
  const sentences = text.match(/[^.!?\n]+[.!?\n]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current + sentence;
    if (encoder.encode(candidate).length <= maxBytes) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    // Очень длинное предложение режем по словам.
    if (encoder.encode(sentence).length > maxBytes) {
      let piece = '';
      for (const word of sentence.split(/(\s+)/)) {
        if (encoder.encode(piece + word).length > maxBytes) {
          if (piece) chunks.push(piece);
          piece = word;
        } else {
          piece += word;
        }
      }
      current = piece;
    } else {
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}

export const myMemoryTranslator: ClassicTranslator = {
  id: 'mymemory',
  supportsAutoDetect: false,
  isConfigured: () => true,

  async translate({ env, text, sourceLang, targetLang, signal }) {
    if (sourceLang === 'auto') return null; // язык подставляет вызывающий код
    if (await isResting(env)) return null; // общий лимит Cloudflare исчерпан — не ждём зря
    const chunks = splitIntoChunks(text, CLASSIC.myMemoryMaxBytes);
    if (chunks.length > CLASSIC.myMemoryMaxChunks) return null;

    const parts: string[] = [];
    for (const chunk of chunks) {
      const url = new URL(CLASSIC.myMemoryUrl);
      url.searchParams.set('q', chunk);
      url.searchParams.set('langpair', `${sourceLang}|${targetLang}`);
      if (env.MYMEMORY_EMAIL) url.searchParams.set('de', env.MYMEMORY_EMAIL);

      const { signal: timeoutSignal, clear } = withTimeoutSignal(signal, CLASSIC.timeoutMs);
      try {
        const response = await fetch(url.toString(), {
          signal: timeoutSignal,
          headers: { 'User-Agent': CLASSIC.userAgent, Accept: 'application/json' },
        });
        const data = (await response.json().catch(() => ({}))) as MyMemoryResponse;
        const translated = data.responseData?.translatedText?.trim();
        if (!response.ok || data.quotaFinished || String(data.responseStatus) !== '200' || !translated) {
          // Причину пишем в журнал Cloudflare, чтобы было видно, почему MyMemory отказал.
          if (response.status === 429 || data.quotaFinished || String(data.responseStatus) === '429') {
            await startResting(env, `${data.responseDetails ?? ''} ${translated ?? ''}`);
          }
          console.warn(
            `MyMemory отказал: HTTP ${response.status}, status ${String(data.responseStatus)}, ` +
              `quotaFinished=${String(data.quotaFinished)}, details=${data.responseDetails ?? ''}`,
          );
          return null;
        }
        // При исчерпании лимита MyMemory иногда отвечает текстом-предупреждением.
        if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) {
          if (/FREE TRANSLATIONS/i.test(translated)) await startResting(env, translated);
          return null;
        }
        parts.push(translated);
      } catch {
        return null;
      } finally {
        clear();
      }
    }
    const joined = parts.join(' ');
    // MyMemory иногда возвращает исходный текст без перевода — это не перевод, пусть ответят другие.
    const normalize = (value: string) => value.toLowerCase().replace(/[\s.,!?;:'"«»„“”-]+/g, ' ').trim();
    if (normalize(joined) === normalize(text)) return null;
    return { text: joined, detectedLang: null };
  },
};
