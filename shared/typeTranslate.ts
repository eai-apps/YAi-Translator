/** Перевод: запрос, ответ, сравнение переводчиков (версия 0.6.0). Выделено из shared/types.ts. */
import type { LanguageCode } from './languages';
import type { SourceLanguage, TranslationStyle } from './typeCore';
import type { ProviderId } from './typeTasks';

export interface TranslateRequest {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  /**
   * 'classic' (по умолчанию) — обычные переводчики без ИИ; ИИ подключается, только если все они молчат.
   * 'ai' — кнопка «Спросить у AI»: перевод ИИ с альтернативами.
   */
  mode?: 'classic' | 'ai';
  /** Конкретный обычный переводчик, выбранный пользователем (иначе — по очереди). */
  provider?: ProviderId;
}

export interface CompareRequest {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  /** Сервис, который дал основной перевод: в списке он не повторяется. */
  exclude?: ProviderId;
}

export interface CompareItem {
  provider: ProviderId;
  text: string | null;
}

export interface CompareResponse {
  items: CompareItem[];
}

export interface AlternativeTranslation {
  style: TranslationStyle;
  text: string;
}

export interface TranslateResponse {
  translatedText: string;
  alternatives: AlternativeTranslation[];
  /** Язык, определённый автоматически (null, если он был выбран вручную). */
  detectedLang: LanguageCode | null;
  provider: ProviderId;
  cached: boolean;
}

export interface TranscribeResponse {
  text: string;
}
