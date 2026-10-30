/** Общие типы «обычных» переводчиков (без ИИ): Microsoft, Google, MyMemory, M2M100, DeepL. */
import type { LanguageCode, ProviderId, SourceLanguage } from '../../../shared/types';
import type { Env } from '../env';

export interface ClassicInput {
  env: Env;
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  signal: AbortSignal;
}

export interface ClassicResult {
  text: string;
  /** Язык, который определил сервис (если умеет). */
  detectedLang: LanguageCode | null;
}

export interface ClassicTranslator {
  id: ProviderId;
  /** Настроен ли сервис (есть ключ или binding). */
  isConfigured(env: Env): boolean;
  /** Умеет ли сервис сам определять язык; если нет — язык угадываем сами. */
  supportsAutoDetect: boolean;
  /** null — сервис не справился, пробуем следующий. */
  translate(input: ClassicInput): Promise<ClassicResult | null>;
}
