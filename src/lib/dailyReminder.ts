/**
 * Напоминание раз в день (только в сборке Android приложения):
 * Использует @capacitor/local-notifications.
 * По умолчанию выключено, время 19:00. Разрешение спрашивается ТОЛЬКО при включении.
 */
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { readStorage, writeStorage } from './storage';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "19:00"
}

const REMINDER_KEY = 'yai.dailyReminder';
const NOTIFICATION_ID = 777;

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  time: '19:00',
};

export function isReminderSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications');
}

export function readReminderSettings(): ReminderSettings {
  const stored = readStorage<Partial<ReminderSettings>>(REMINDER_KEY, {});
  return {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : DEFAULT_REMINDER_SETTINGS.enabled,
    time: typeof stored.time === 'string' && /^\d{2}:\d{2}$/.test(stored.time) ? stored.time : DEFAULT_REMINDER_SETTINGS.time,
  };
}

export async function writeReminderSettings(settings: ReminderSettings, bodyText?: string): Promise<boolean> {
  writeStorage(REMINDER_KEY, settings);

  if (!isReminderSupported()) return true;

  try {
    if (!settings.enabled) {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
      return true;
    }

    // Запрашиваем разрешение только при включении
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      writeStorage(REMINDER_KEY, { ...settings, enabled: false });
      return false;
    }

    const [hourStr, minuteStr] = settings.time.split(':');
    const hour = Number.isFinite(Number(hourStr)) ? Number(hourStr) : 19;
    const minute = parseInt(minuteStr, 10) || 0;

    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: 'YAi Translator',
          body: bodyText ?? 'Пора повторить слова! Серия ждёт 🔥',
          schedule: {
            on: { hour, minute },
            repeats: true,
            allowWhileIdle: true,
          },
        },
      ],
    });

    return true;
  } catch (_err) {
    return false;
  }
}
