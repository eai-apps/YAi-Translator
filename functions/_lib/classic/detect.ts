/**
 * Простое определение языка без ИИ — для сервисов, которые сами его не определяют.
 * Работает для наших языков: немецкий, русский, украинский, английский.
 */
import type { LanguageCode } from '../../../shared/types';
import { isLanguageCode } from '../../../shared/languages';

const GERMAN_WORDS = new Set([
  'der', 'die', 'das', 'und', 'ist', 'ich', 'nicht', 'ein', 'eine', 'mit', 'auf', 'für', 'sie', 'wir',
  'zu', 'den', 'dem', 'des', 'von', 'auch', 'es', 'sich', 'wie', 'aber', 'habe', 'bin', 'heute', 'mein',
]);
const ENGLISH_WORDS = new Set([
  'the', 'and', 'is', 'are', 'you', 'not', 'with', 'for', 'this', 'that', 'have', 'was', 'what', 'to',
  'of', 'in', 'it', 'my', 'we', 'they', 'be', 'can', 'will', 'do', 'how', 'where', 'today', 'hello',
]);

export function guessLanguage(text: string): LanguageCode | null {
  const sample = text.toLowerCase();

  // Кириллица: украинский отличаем по буквам і, ї, є, ґ.
  if (/[а-яё]/.test(sample) || /[іїєґ]/.test(sample)) {
    return /[іїєґ]/.test(sample) ? pick('uk') : pick('ru');
  }
  if (/[äöüß]/.test(sample)) return pick('de');

  const words = sample.match(/\p{L}+/gu) ?? [];
  let german = 0;
  let english = 0;
  for (const word of words) {
    if (GERMAN_WORDS.has(word)) german += 1;
    if (ENGLISH_WORDS.has(word)) english += 1;
  }
  if (german > english) return pick('de');
  if (english > german) return pick('en');
  // Одно незнакомое латинское слово: в нашем приложении чаще всего это немецкий.
  return words.length > 0 ? pick('de') : null;
}

function pick(code: string): LanguageCode | null {
  return isLanguageCode(code) ? code : null;
}
