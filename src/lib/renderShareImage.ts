/**
 * Генерация красивой картинки перевода 1080×1350 (Instagram/Telegram 4:5) на Canvas 2D.
 * Без сторонних библиотек. В приложении / на телефоне — navigator.share(file), на ПК — скачивание PNG.
 */
import type { LanguageCode, SourceLanguage } from '../../shared/types';
import { getLanguage } from '../../shared/languages';

interface ShareImageOptions {
  sourceText: string;
  translatedText: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  article?: 'der' | 'die' | 'das' | null;
}

const ARTICLE_HEX: Record<'der' | 'die' | 'das', string> = {
  der: '#3b82f6', // синий
  die: '#ef4444', // красный
  das: '#10b981', // зелёный
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function shareTranslationImage(options: ShareImageOptions): Promise<void> {
  const { sourceText, translatedText, sourceLang, targetLang, article } = options;
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Фон: глубокий стильный градиент с мягким сине-фиолетовым свечением
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c0f17');
  bgGrad.addColorStop(0.5, '#121622');
  bgGrad.addColorStop(1, '#0e111a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Свечение сверху слева
  const glow1 = ctx.createRadialGradient(160, 160, 20, 160, 160, 480);
  glow1.addColorStop(0, 'rgba(109, 146, 255, 0.16)');
  glow1.addColorStop(1, 'rgba(109, 146, 255, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  // Свечение снизу справа
  const glow2 = ctx.createRadialGradient(900, 1150, 30, 900, 1150, 450);
  glow2.addColorStop(0, 'rgba(192, 108, 240, 0.14)');
  glow2.addColorStop(1, 'rgba(192, 108, 240, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // 2. Внутренняя карточка с мягким контуром
  const cardX = 64;
  const cardY = 64;
  const cardW = width - 128;
  const cardH = height - 128;
  const radius = 36;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = 'rgba(25, 30, 44, 0.72)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();
  ctx.restore();

  // 3. Шапка: фирменный логотип YAi + заголовок
  // Иконка 72x72
  const iconX = cardX + 54;
  const iconY = cardY + 54;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(iconX, iconY, 72, 72, 18);
  const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + 72, iconY + 72);
  iconGrad.addColorStop(0, '#4f75ff');
  iconGrad.addColorStop(1, '#9b51e0');
  ctx.fillStyle = iconGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Y', iconX + 36, iconY + 38);
  ctx.restore();

  // Название и сайт
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('YAi Translator', iconX + 92, iconY + 6);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px Inter, system-ui, sans-serif';
  ctx.fillText('yai-translator.pages.dev', iconX + 92, iconY + 44);

  // Разделитель шапки
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 54, iconY + 104);
  ctx.lineTo(cardX + cardW - 54, iconY + 104);
  ctx.stroke();

  // 4. Исходный текст
  const contentX = cardX + 54;
  const contentW = cardW - 108;
  let cursorY = iconY + 150;

  const srcLangName = (sourceLang === 'auto' ? 'Авто' : getLanguage(sourceLang)?.nativeName ?? sourceLang).toUpperCase();
  ctx.fillStyle = '#6d92ff';
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillText(srcLangName, contentX, cursorY);
  cursorY += 40;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '38px Inter, system-ui, sans-serif';
  const srcLines = wrapText(ctx, sourceText.trim(), contentW).slice(0, 5);
  for (const line of srcLines) {
    ctx.fillText(line, contentX, cursorY);
    cursorY += 52;
  }

  // 5. Стрелочка-переход
  cursorY += 24;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '32px Inter, system-ui, sans-serif';
  ctx.fillText('↓', contentX, cursorY);
  cursorY += 56;

  // 6. Язык цели и перевод
  const tgtLangName = (getLanguage(targetLang)?.nativeName ?? targetLang).toUpperCase();
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillText(tgtLangName, contentX, cursorY);
  cursorY += 44;

  // Перевод с артиклем
  ctx.font = 'bold 56px Inter, system-ui, sans-serif';
  if (article && ARTICLE_HEX[article]) {
    ctx.fillStyle = ARTICLE_HEX[article];
    const artText = `${article} `;
    ctx.fillText(artText, contentX, cursorY);
    const artWidth = ctx.measureText(artText).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(translatedText.trim(), contentX + artWidth, cursorY);
  } else {
    ctx.fillStyle = '#ffffff';
    const tgtLines = wrapText(ctx, translatedText.trim(), contentW).slice(0, 5);
    for (const line of tgtLines) {
      ctx.fillText(line, contentX, cursorY);
      cursorY += 72;
    }
  }

  // 7. Подвал карточки
  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.font = '22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Учи немецкий и переводи с YAi Translator', width / 2, cardY + cardH - 50);

  // 8. Экспорт и передача
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;

  const file = new File([blob], 'yai-translation.png', { type: 'image/png' });

  // Проверка navigator.canShare
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({
        title: 'YAi Translator',
        text: `${sourceText} → ${translatedText}`,
        files: [file],
      });
      return;
    } catch {
      // Пользователь закрыл системный диалог или отменил — ничего страшного
      return;
    }
  }

  // Фолбэк: скачивание PNG файла
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'yai-translation.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
