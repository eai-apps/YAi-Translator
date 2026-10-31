/**
 * Хук для навигации по истории переводов свайпом, кнопками ‹ › и горячими клавишами Alt+← / Alt+→.
 * Свайп вправо = предыдущий (более старый) перевод.
 * Свайп влево = следующий (более новый) перевод.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageCode, SourceLanguage } from '../../shared/types';
import type { HistoryItem } from './useHistory';

interface UseHistoryBrowseOptions {
  items: HistoryItem[];
  currentText: string;
  currentSource: SourceLanguage;
  currentTarget: LanguageCode;
  onSelect: (item: HistoryItem) => void;
}

export function useHistoryBrowse({
  items,
  currentText,
  currentSource,
  currentTarget,
  onSelect,
}: UseHistoryBrowseOptions) {
  const [browseIndex, setBrowseIndex] = useState<number | null>(null);
  const [counterText, setCounterText] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const counterTimerRef = useRef<number | null>(null);
  const slideTimerRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (counterTimerRef.current) window.clearTimeout(counterTimerRef.current);
      if (slideTimerRef.current) window.clearTimeout(slideTimerRef.current);
    };
  }, []);

  const showCounter = useCallback((index: number, total: number) => {
    if (counterTimerRef.current) window.clearTimeout(counterTimerRef.current);
    setCounterText(`${index + 1} / ${total}`);
    counterTimerRef.current = window.setTimeout(() => {
      setCounterText(null);
    }, 1200);
  }, []);

  const triggerSlide = useCallback((direction: 'left' | 'right') => {
    if (slideTimerRef.current) window.clearTimeout(slideTimerRef.current);
    setSlideDirection(direction);
    slideTimerRef.current = window.setTimeout(() => {
      setSlideDirection(null);
    }, 180);
  }, []);

  // Номер в истории имеет смысл, только пока на экране тот же перевод: человек ввёл новый
  // текст или история пополнилась — начинаем листать заново от текущего текста.
  const browsing =
    browseIndex !== null && items[browseIndex]?.text.trim() === currentText.trim() ? browseIndex : null;

  // Переход к более старому переводу (свайп вправо / Alt+← / кнопка ‹)
  const goPrev = useCallback(() => {
    if (items.length === 0) return;
    let nextIndex: number;
    if (browsing === null) {
      const found = items.findIndex(
        (it) =>
          it.text.trim().toLowerCase() === currentText.trim().toLowerCase() &&
          it.sourceLang === currentSource &&
          it.targetLang === currentTarget,
      );
      nextIndex = found >= 0 ? found + 1 : 0;
    } else {
      nextIndex = browsing + 1;
    }

    if (nextIndex >= items.length) return;

    setBrowseIndex(nextIndex);
    triggerSlide('right');
    showCounter(nextIndex, items.length);
    onSelectRef.current(items[nextIndex]);
  }, [items, browsing, currentText, currentSource, currentTarget, triggerSlide, showCounter]);

  // Переход к более новому переводу (свайп влево / Alt+→ / кнопка ›)
  const goNext = useCallback(() => {
    if (items.length === 0 || browsing === null || browsing <= 0) return;
    const nextIndex = browsing - 1;

    setBrowseIndex(nextIndex);
    triggerSlide('left');
    showCounter(nextIndex, items.length);
    onSelectRef.current(items[nextIndex]);
  }, [items, browsing, triggerSlide, showCounter]);

  // Клавиатурные сокращения Alt+← и Alt+→
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      // В полях ввода Alt+стрелки двигают курсор — не перехватываем.
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || target.closest('textarea, input, select'))) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext]);

  const canPrev = items.length > 0 && (browsing === null ? true : browsing < items.length - 1);
  const canNext = items.length > 0 && browsing !== null && browsing > 0;

  return {
    goPrev,
    goNext,
    canPrev,
    canNext,
    counterText,
    slideDirection,
  };
}
