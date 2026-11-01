import type { LanguageCode } from './languages';

/** Немецкая/английская карточка остаётся той же при обратном направлении перевода. */
export function reverseCardDirection(source: LanguageCode, target: LanguageCode): boolean {
  if (source === 'de') return false;
  if (target === 'de') return true;
  if (source === 'en') return false;
  if (target === 'en') return true;
  return (source === 'ru' || source === 'uk') && target !== 'ru' && target !== 'uk';
}
