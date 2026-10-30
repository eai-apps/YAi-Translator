/**
 * MyMemory — бесплатный переводчик без ключа.
 * Лимит: 5 000 символов в день, с адресом почты (MYMEMORY_EMAIL) — 50 000.
 * Один запрос — не больше 500 байт, поэтому длинный текст режем по предложениям.
 */
import { CLASSIC } from '../config';
import { withTimeoutSignal } from '../utils';
import type { ClassicTranslator } from './types';

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  quotaFinished?: boolean;
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
        const response = await fetch(url.toString(), { signal: timeoutSignal });
        const data = (await response.json().catch(() => ({}))) as MyMemoryResponse;
        const translated = data.responseData?.translatedText?.trim();
        if (!response.ok || data.quotaFinished || String(data.responseStatus) !== '200' || !translated) {
          return null;
        }
        // При исчерпании лимита MyMemory иногда отвечает текстом-предупреждением.
        if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) return null;
        parts.push(translated);
      } catch {
        return null;
      } finally {
        clear();
      }
    }
    return { text: parts.join(' '), detectedLang: null };
  },
};
