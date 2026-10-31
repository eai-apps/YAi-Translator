/**
 * Хук для обработки горизонтальных свайпов (влево/вправо) на элементе.
 * Порог срабатывания: ~60px по горизонтали, и горизонталь > вертикали в 1.5 раза.
 * Не срабатывает на полях ввода, кнопках, словах-кнопках и лентах чипсов.
 */
import { useEffect, useRef } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

// Не игнорируем кнопки и слова-кнопки: весь текст перевода состоит из них (pick.tsx), и свайп по нему
// не работал. Нажатие без сдвига пальца свайпом не считается, поэтому кнопки по-прежнему нажимаются.
const IGNORE_SELECTOR = 'textarea, input, select, [data-swipe-ignore], [data-chips]';

export function useSwipe<T extends HTMLElement>(
  elementRef: React.RefObject<T>,
  options: UseSwipeOptions,
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let validTouch = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        validTouch = false;
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && target.closest(IGNORE_SELECTOR)) {
        validTouch = false;
        return;
      }
      validTouch = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!validTouch || e.changedTouches.length === 0) return;
      validTouch = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const threshold = optionsRef.current.threshold ?? 60;

      // Горизонтальный свайп: порог >= 60 px и горизонталь больше вертикали в 1.5 раза
      if (absDx >= threshold && absDx > absDy * 1.5) {
        if (dx < 0) {
          optionsRef.current.onSwipeLeft?.();
        } else {
          optionsRef.current.onSwipeRight?.();
        }
      }
    };

    const onTouchCancel = () => {
      validTouch = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [elementRef]);
}
