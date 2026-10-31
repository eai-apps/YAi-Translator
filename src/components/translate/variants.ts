import type { WordResponse, TranslateResponse } from '../../../shared/types';

/** «Ещё варианты» под переводом: все переводы из карточки слова, кроме основного (до 8). */
export function extractMoreVariants(word: WordResponse | null | undefined, shown: TranslateResponse | null): string[] {
  const card = word?.card;
  const main = (shown?.translatedText ?? '').trim().toLowerCase();
  if (!card || !shown) return [];
  const seen = new Set<string>([main]);
  const list: string[] = [];
  for (const meaning of card.meanings) {
    for (const value of meaning.translations) {
      const key = value.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push(value.trim());
    }
  }
  return list.slice(0, 8);
}
