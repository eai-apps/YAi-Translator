/**
 * Навигация с клавиатуры и пульта Android TV (D-pad стрелки + Enter) (Часть 19).
 * Поддерживает пространственное перемещение фокуса между интерактивными элементами.
 */
import { useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]';

function isVisible(el: HTMLElement): boolean {
  if (el.offsetParent === null && el.tagName !== 'BODY') return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

export function useSpatialNavigation(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const isArrow = key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight';

      if (!isArrow && key !== 'Enter') return;

      const active = document.activeElement as HTMLElement | null;

      if (active?.tagName === 'SELECT' || active?.isContentEditable || active?.getAttribute('role') === 'slider') return;
      // При вводе текста в input/textarea не перехватываем обычное движение курсора
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        const input = active as HTMLInputElement | HTMLTextAreaElement;
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
          return;
        }
        if (active.tagName === 'TEXTAREA') {
          const atTop = input.selectionStart === 0 && input.selectionEnd === 0;
          const atBottom = input.selectionStart === input.value.length;
          if (key === 'ArrowUp' && !atTop) return;
          if (key === 'ArrowDown' && !atBottom) return;
        }
      }

      if (key === 'Enter') {
        if (active && active.getAttribute('tabindex') === '0' && active.tagName !== 'BUTTON' && active.tagName !== 'A') {
          e.preventDefault();
          active.click();
        }
        return;
      }

      const allElements = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
      if (allElements.length === 0) return;

      if (!active || active === document.body || !allElements.includes(active)) {
        e.preventDefault();
        allElements[0].focus();
        return;
      }

      const curRect = active.getBoundingClientRect();
      const curCenterX = curRect.left + curRect.width / 2;
      const curCenterY = curRect.top + curRect.height / 2;

      let bestElement: HTMLElement | null = null;
      let minDistance = Number.POSITIVE_INFINITY;

      for (const el of allElements) {
        if (el === active || el.contains(active) || active.contains(el)) continue;

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = centerX - curCenterX;
        const dy = centerY - curCenterY;

        let isValidDirection = false;
        let dist = 0;

        switch (key) {
          case 'ArrowDown':
            if (dy > 4) {
              isValidDirection = true;
              dist = dy * 2 + Math.abs(dx) * 3;
            }
            break;
          case 'ArrowUp':
            if (dy < -4) {
              isValidDirection = true;
              dist = -dy * 2 + Math.abs(dx) * 3;
            }
            break;
          case 'ArrowRight':
            if (dx > 4) {
              isValidDirection = true;
              dist = dx * 2 + Math.abs(dy) * 3;
            }
            break;
          case 'ArrowLeft':
            if (dx < -4) {
              isValidDirection = true;
              dist = -dx * 2 + Math.abs(dy) * 3;
            }
            break;
        }

        if (isValidDirection && dist < minDistance) {
          minDistance = dist;
          bestElement = el;
        }
      }

      if (bestElement) {
        e.preventDefault();
        bestElement.focus();
        bestElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
