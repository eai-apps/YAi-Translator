/**
 * Тип записи словаря терминов (версия 0.6.0).
 * Сами термины — в grammarTermsData.ts, поиск по тексту — в grammarHighlight.ts.
 */
export interface GrammarTermEntry {
  slug: string;
  /** Точные варианты названия; латиница нечувствительна к регистру, кириллица важна. */
  aliases: string[];
  /** Шаблон для целого слова или фразы: «konjunktiv|a», «\\d+», «wechselpräposition\\w*». */
  patterns?: string[];
  /** Начало слова, к которому подставляются окончания (Perfekt → Perfekt, Perfekte, Perfekts). */
  stems?: string[];
  /** true — термин слишком общий («падеж», «Passiv»), в «Что важно знать» его не подчёркиваем. */
  skipInNotes?: boolean;
}
