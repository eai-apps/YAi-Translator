/**
 * Управление экранной клавиатурой в приложении и браузере.
 * В нативном приложении использует @capacitor/keyboard,
 * а также снимает фокус с активного элемента.
 */
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export async function hideKeyboard(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Keyboard.hide();
    } catch {
      // Игнорируем
    }
  }

  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
