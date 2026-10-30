/**
 * Список языков продукта — единственное место, где он задаётся.
 * Чтобы добавить язык, достаточно дописать одну строку в LANGUAGES.
 * Файл используют и фронтенд, и Pages Functions.
 */

export type LanguageCode = 'de' | 'ru' | 'uk' | 'en' | 'fr' | 'es' | 'it' | 'pt' | 'pl' | 'nl' | 'tr' | 'ar';

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
  /** Восточные языки пишутся справа налево: текст получает dir="rtl". */
  rtl: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'de', nativeName: 'Deutsch', htmlLang: 'de', speechCode: 'de-DE', hasUmlauts: true, deeplCode: 'DE', rtl: false },
  { code: 'ru', nativeName: 'Русский', htmlLang: 'ru', speechCode: 'ru-RU', hasUmlauts: false, deeplCode: 'RU', rtl: false },
  { code: 'uk', nativeName: 'Українська', htmlLang: 'uk', speechCode: 'uk-UA', hasUmlauts: false, deeplCode: 'UK', rtl: false },
  { code: 'en', nativeName: 'English', htmlLang: 'en', speechCode: 'en-US', hasUmlauts: false, deeplCode: 'EN-US', rtl: false },
  { code: 'fr', nativeName: 'Français', htmlLang: 'fr', speechCode: 'fr-FR', hasUmlauts: false, deeplCode: 'FR', rtl: false },
  { code: 'es', nativeName: 'Español', htmlLang: 'es', speechCode: 'es-ES', hasUmlauts: false, deeplCode: 'ES', rtl: false },
  { code: 'it', nativeName: 'Italiano', htmlLang: 'it', speechCode: 'it-IT', hasUmlauts: false, deeplCode: 'IT', rtl: false },
  { code: 'pt', nativeName: 'Português', htmlLang: 'pt', speechCode: 'pt-PT', hasUmlauts: false, deeplCode: 'PT-PT', rtl: false },
  { code: 'pl', nativeName: 'Polski', htmlLang: 'pl', speechCode: 'pl-PL', hasUmlauts: false, deeplCode: 'PL', rtl: false },
  { code: 'nl', nativeName: 'Nederlands', htmlLang: 'nl', speechCode: 'nl-NL', hasUmlauts: false, deeplCode: 'NL', rtl: false },
  { code: 'tr', nativeName: 'Türkçe', htmlLang: 'tr', speechCode: 'tr-TR', hasUmlauts: false, deeplCode: 'TR', rtl: false },
  { code: 'ar', nativeName: 'العربية', htmlLang: 'ar', speechCode: 'ar-SA', hasUmlauts: false, deeplCode: 'AR', rtl: true },
];

/** Языки, которые всегда показываются в выборе сверху. */
export const PINNED_LANGUAGE_CODES: LanguageCode[] = ['de', 'ru', 'uk', 'en'];

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

/** Направление текста для языка: 'rtl' только у арабского. */
export function textDirection(code: string): 'ltr' | 'rtl' {
  return getLanguage(code)?.rtl ? 'rtl' : 'ltr';
}

/** Языки для списков выбора: сначала закреплённые, затем остальные в порядке LANGUAGES. */
export function groupedLanguages(): { pinned: LanguageOption[]; other: LanguageOption[] } {
  return {
    pinned: LANGUAGES.filter((language) => PINNED_LANGUAGE_CODES.includes(language.code)),
    other: LANGUAGES.filter((language) => !PINNED_LANGUAGE_CODES.includes(language.code)),
  };
}
