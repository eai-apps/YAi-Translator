/**
 * Экспорт карточек (этап 6): CSV для Excel/Google Таблиц и текст для Anki.
 * Оба файла содержат артикль: без него немецкое слово бесполезно учить.
 */
import type { StudyCard } from '../../shared/study';

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

/** Текст для Anki: строка «der Tisch;стол», разделитель точка с запятой. */
export function buildAnki(cards: StudyCard[]): string {
  const lines = ['#separator:Semicolon', '#html:false'];
  for (const card of cards) {
    lines.push(`${wordWithArticle(card)};${card.translations.join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
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
  download(`yai-anki-${day}.txt`, buildAnki(cards), 'text/plain');
}
