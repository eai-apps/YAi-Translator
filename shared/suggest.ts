/**
 * Подсказки при наборе одного слова (этап 8).
 * GET /api/suggest?q=hol&lang=de → словарь Wiktionary (opensearch), кэш в D1 на 30 дней.
 */
export interface SuggestResponse {
  /** До 6 слов, начинающихся (или совпадающих) с введённого текста. */
  items: string[];
  /** Сколько слов сейчас в кэше D1 — отдаётся только для кнопки в настройках. */
  cachedWords?: number;
}
