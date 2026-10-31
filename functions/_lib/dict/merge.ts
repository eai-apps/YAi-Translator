/**
 * Дополнение карточки ИИ данными словарей (этап 4): синонимы OpenThesaurus, примеры Tatoeba,
 * переводы PONS, толкования DWDS. Данные ИИ не затираются — новые только добавляются.
 */
import type { DictEntry, WordResponse } from '../../../shared/types';

export function mergeDictionaryData(card: WordResponse['card'], dict: DictEntry | null): void {
  if (!dict) return;

  // Синонимы: сначала от ИИ, затем из OpenThesaurus (дубликаты убираем)
  const known = new Set(card.synonyms.map((word) => word.toLowerCase()));
  for (const synonym of dict.synonyms) {
    if (known.has(synonym.toLowerCase())) continue;
    known.add(synonym.toLowerCase());
    card.synonyms.push(synonym);
  }

  // Переводы из двуязычного словаря — только если ИИ не дал ни одного
  if (dict.senses.length > 0) {
    if (card.meanings.length === 0) {
      const pons = dict.senses.filter((sense) => sense.translation);
      if (pons.length > 0) {
        card.meanings = pons.map((sense) => ({
          sense: sense.definition,
          translations: (sense.translation ?? '').split(',').map((part) => part.trim()).filter(Boolean),
          note: null,
        }));
      }
    }
    // Часть речи и род — если ИИ не определил
    if (card.article === null && dict.gender) card.article = dict.gender;
    if (card.plural === null && dict.plural) card.plural = dict.plural;
    if (card.transcription === null && dict.transcription) card.transcription = dict.transcription;
  }

  card.dictSources = dict.sources;
}
