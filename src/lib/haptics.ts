/**
 * Безопасная работа с виброоткликом устройства.
 * В мобильном приложении вызывает нативный @capacitor/haptics.
 * В обычном браузере использует navigator.vibrate (если поддерживается) или молчит.
 */
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export async function hapticImpact(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
      return;
    } catch {
      // Игнорируем ошибки устройства
    }
  }

  // Fallback для мобильных браузеров
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(style === ImpactStyle.Heavy ? 30 : 15);
    } catch {
      // Игнорируем
    }
  }
}

export async function hapticSelection(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.selectionChanged();
      return;
    } catch {
      // Игнорируем
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(10);
    } catch {
      // Игнорируем
    }
  }
}
