/**
 * Хук для горизонтального свайпа с интерактивным следованием за пальцем (этап 12):
 * - Во время движения пальца возвращает dragOffset (в пикселях) и isDragging.
 * - Карточка едет прямо за пальцем.
 * - Если жест вертикальный (скролл страницы), свайп отменяется.
 * - По завершении жеста с достаточным смещением срабатывает onSwipeLeft / onSwipeRight.
 */
import { useEffect, useRef, useState } from 'react';
import { hapticImpact } from '../lib/haptics';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

const IGNORE_SELECTOR = 'textarea, input, select, [data-swipe-ignore], [data-chips]';

export function useSwipe<T extends HTMLElement>(
  elementRef: React.RefObject<T>,
  options: UseSwipeOptions,
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && target.closest(IGNORE_SELECTOR)) {
        active = false;
        return;
      }
      active = true;
      isHorizontal = null;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setIsDragging(false);
      setDragOffset(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length === 0) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = currentX - startX;
      const dy = currentY - startY;

      // Если направление ещё не определено
      if (isHorizontal === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          if (Math.abs(dx) >= Math.abs(dy) * 1.2) {
            isHorizontal = true;
            setIsDragging(true);
          } else {
            // Вертикальный скролл — отменяем жест
            isHorizontal = false;
            active = false;
            setIsDragging(false);
            setDragOffset(0);
            return;
          }
        } else {
          return;
        }
      }

      if (isHorizontal) {
        // Ограничиваем максимальное смещение для естественного ощущения сопротивления
        const damped = Math.sign(dx) * Math.min(Math.abs(dx), 180);
        setDragOffset(damped);
      }
    };

    const finishSwipe = (currentX: number, currentY: number) => {
      if (!active) return;
      active = false;

      const dx = currentX - startX;
      const dy = currentY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = optionsRef.current.threshold ?? 55;

      setIsDragging(false);
      setDragOffset(0);

      if (isHorizontal && absDx >= threshold && absDx > absDy * 1.2) {
        void hapticImpact();
        if (dx < 0) {
          optionsRef.current.onSwipeLeft?.();
        } else {
          optionsRef.current.onSwipeRight?.();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        finishSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else {
        active = false;
        setIsDragging(false);
        setDragOffset(0);
      }
    };

    const onTouchCancel = () => {
      active = false;
      setIsDragging(false);
      setDragOffset(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [elementRef]);

  return { dragOffset, isDragging };
}
