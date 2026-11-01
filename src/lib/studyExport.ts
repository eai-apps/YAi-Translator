/**
 * Экспорт карточек и готовых наборов (этапы 6 и 20):
 * CSV для Excel/Google Таблиц и формат для Anki (слово;перевод;пример).
 * Файлы содержат артикль и пример употребления.
 */
import type { StudyCard, StudyDeck, StudyList } from '../../shared/study';
import type { UiLanguage } from '../../shared/languages';
import { deckTranslation } from '../../shared/study';

function wordWithArticle(card: StudyCard): string {
  return card.article ? `${card.article} ${card.lemma}` : card.lemma;
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** CSV с точкой с запятой: так Excel с русской локалью открывает файл сразу. */
export function buildCsv(cards: StudyCard[]): string {
  const rows = [['Слово', 'Перевод', 'Артикль', 'Множественное число', 'Пример']];
  for (const card of cards) {
    rows.push([
      card.lemma,
      card.translations.join(', '),
      card.article ?? '',
      card.plural ?? '',
      card.example ? `${card.example.text} — ${card.example.translation}` : '',
    ]);
  }
  return `\ufeff${rows.map((row) => row.map(quote).join(';')).join('\r\n')}\r\n`;
}

/** Текст для Anki: три колонки (слово;перевод;пример), разделитель — точка с запятой. */
export function buildAnki(cards: StudyCard[]): string {
  const lines = ['#separator:Semicolon', '#html:false', '#tags:yai-translator'];
  for (const card of cards) {
    const word = wordWithArticle(card);
    const trans = card.translations.join(', ');
    const example = card.example ? `${card.example.text} — ${card.example.translation}` : '';
    lines.push(`${quote(word)};${quote(trans)};${quote(example)}`);
  }
  return `\ufeff${lines.join('\r\n')}\r\n`;
}

function download(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Даём браузеру время начать скачивание, затем освобождаем память.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Скачивает файл с карточками; format = 'csv' или 'anki'. */
export function downloadStudyCards(cards: StudyCard[], format: 'csv' | 'anki', day: string): void {
  if (cards.length === 0) return;
  if (format === 'csv') {
    download(`yai-karten-${day}.csv`, buildCsv(cards), 'text/csv');
    return;
  }
  download(`yai-anki-${day}.csv`, buildAnki(cards), 'text/csv');
}

/** Экспорт готовой колоды в CSV для Anki (слово;перевод;пример). */
export function exportDeckToAnkiCsv(deck: StudyDeck, uiLang: UiLanguage): void {
  const lines = ['#separator:Semicolon', '#html:false', '#tags:yai-deck'];
  for (const word of deck.words) {
    const spoken = word.article ? `${word.article} ${word.lemma}` : word.lemma;
    const trans = deckTranslation(word, uiLang);
    const example = word.example ? `${word.example.text} — ${word.example.translation}` : '';
    lines.push(`${quote(spoken)};${quote(trans)};${quote(example)}`);
  }
  download(`${deck.id}-anki.csv`, `\ufeff${lines.join('\r\n')}\r\n`, 'text/csv');
}

/** Экспорт пользовательского списка слов в CSV для Anki (слово;перевод;пример). */
export function exportListToAnkiCsv(list: StudyList, cards: StudyCard[]): void {
  const map = new Map<string, StudyCard>();
  for (const card of cards) map.set(card.id, card);
  const listCards = list.cardIds.map((id) => map.get(id)).filter((c): c is StudyCard => Boolean(c));
  const safeTitle = list.title.replace(/[^\wа-яёА-ЯЁ-]/gi, '_');
  download(`list-${safeTitle}-anki.csv`, buildAnki(listCards), 'text/csv');
}
