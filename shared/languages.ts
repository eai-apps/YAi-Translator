/**
 * Список языков продукта — единственное место, где он задаётся.
 * Чтобы добавить язык, достаточно дописать одну строку в LANGUAGES.
 * Файл используют и фронтенд, и Pages Functions.
 */

export type LanguageCode = 'de' | 'ru' | 'uk' | 'en';

/** Языки, на которые переводится интерфейс. */
export type UiLanguage = 'ru' | 'de' | 'en';

export interface LanguageOption {
  code: LanguageCode;
  /** Название языка на нём самом. */
  nativeName: string;
  /** Короткий код для атрибута lang. */
  htmlLang: string;
  /** Код для speechSynthesis / SpeechRecognition. */
  speechCode: string;
  /** Показывать ли строку умлаутов над полем ввода. */
  hasUmlauts: boolean;
  /** Код для DeepL (null — DeepL этот язык не поддерживает). */
  deeplCode: string | null;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'de', nativeName: 'Deutsch', htmlLang: 'de', speechCode: 'de-DE', hasUmlauts: true, deeplCode: 'DE' },
  { code: 'ru', nativeName: 'Русский', htmlLang: 'ru', speechCode: 'ru-RU', hasUmlauts: false, deeplCode: 'RU' },
  { code: 'uk', nativeName: 'Українська', htmlLang: 'uk', speechCode: 'uk-UA', hasUmlauts: false, deeplCode: 'UK' },
  { code: 'en', nativeName: 'English', htmlLang: 'en', speechCode: 'en-US', hasUmlauts: false, deeplCode: 'EN-US' },
];

export const UI_LANGUAGES: UiLanguage[] = ['ru', 'de', 'en'];

export const LANGUAGE_CODES: LanguageCode[] = LANGUAGES.map((language) => language.code);

export function getLanguage(code: string): LanguageOption | undefined {
  return LANGUAGES.find((language) => language.code === code);
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_CODES.includes(value as LanguageCode);
}

export function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && UI_LANGUAGES.includes(value as UiLanguage);
}
