/** Чтение лексикона и примеров через штатный binding статики Pages. */
import type { Env } from './env';
import type { LanguageCode, WordCard } from '../../shared/types';
import { getLexiconPrefix, isLexiconRef, type LexiconChunk, type ExampleChunk } from '../../shared/lexicon';
import { assembleWordCard } from '../../shared/cardAssembler';

async function asset<T>(env: Env, pathname: string, signal: AbortSignal): Promise<T | null> {
  if (!env.ASSETS) return null;
  try {
    const response = await env.ASSETS.fetch(new Request(`https://assets.local${pathname}`, { signal }));
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
    return await response.json() as T;
  } catch { return null; }
}

export async function staticWordCard(env: Env, word: string, lang: LanguageCode, explainLang: LanguageCode, signal: AbortSignal): Promise<WordCard | null> {
  let lemma = word.trim().replace(/^(der|die|das|the|a|an)\s+/i, '');
  if (!lemma || /\s/.test(lemma)) return null;
  for (let depth = 0; depth < 3; depth++) {
    const prefix = getLexiconPrefix(lemma);
    const chunk = await asset<LexiconChunk>(env, `/lex/${lang}/${encodeURIComponent(prefix)}.json`, signal);
    if (!chunk) return null;
    const key = [lemma, lemma.toLowerCase(), lemma[0].toUpperCase() + lemma.slice(1)].find(k => chunk[k]);
    if (!key) return null;
    const entry = chunk[key];
    if (isLexiconRef(entry)) { lemma = entry.lemma; continue; }
    const examples = await asset<ExampleChunk>(env, `/ex/${lang}/${encodeURIComponent(prefix)}.json`, signal);
    return assembleWordCard({ lemma: key, lang, explainLang, entry, examples: examples?.[key] ?? examples?.[key.toLowerCase()] ?? [] });
  }
  return null;
}
