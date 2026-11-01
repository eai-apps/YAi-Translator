/**
 * Модуль оптического распознавания текста (OCR) с фото и картинок (Часть 17).
 * Использует Tesseract.js (Apache-2.0).
 * Языки: deu, eng, rus, ukr, fra, spa, ita, pol и др.
 * Загрузка языковых моделей происходит лениво по требованию.
 */
// Загрузка tesseract.js происходит лениво при вызове функции распознавания
import type { LanguageCode, SourceLanguage } from '../../shared/types';

export interface OcrProgress {
  status: string;
  progress: number; // 0..1
}

function tesseractLangCode(lang: SourceLanguage | LanguageCode): string {
  switch (lang) {
    case 'de':
      return 'deu';
    case 'en':
      return 'eng';
    case 'ru':
      return 'rus';
    case 'uk':
      return 'ukr';
    case 'fr':
      return 'fra';
    case 'es':
      return 'spa';
    case 'it':
      return 'ita';
    case 'pl':
      return 'pol';
    case 'nl':
      return 'nld';
    case 'tr':
      return 'tur';
    case 'auto':
    default:
      // Для автоопределения или немецкого по умолчанию берём пару deu+eng
      return 'deu+eng';
  }
}

/**
 * Распознаёт текст на изображении (File, Blob или URL).
 */
export async function recognizeTextFromImage(
  imageSource: File | Blob | string,
  lang: SourceLanguage | LanguageCode = 'auto',
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const ocrLang = tesseractLangCode(lang);

  const worker = await createWorker(ocrLang, 1, {
    logger: (m) => {
      if (onProgress && typeof m.progress === 'number') {
        onProgress({
          status: m.status ?? 'recognizing',
          progress: Math.max(0, Math.min(1, m.progress)),
        });
      }
    },
  });

  try {
    const { data } = await worker.recognize(imageSource);
    const rawText = data.text ?? '';
    // Очищаем лишние переносы и пробелы
    const cleaned = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    return cleaned;
  } finally {
    try {
      await worker.terminate();
    } catch {
      // Игнорируем ошибки остановки воркера
    }
  }
}
