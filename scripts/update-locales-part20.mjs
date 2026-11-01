/**
 * Обновление локалей ru/de/en для Части 20:
 * аккаунт, синхронизация, экспорт/импорт, удаление аккаунта, админка и Что нового.
 */
import fs from 'fs';

const ruPath = 'src/locales/ru.json';
const dePath = 'src/locales/de.json';
const enPath = 'src/locales/en.json';

const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newKeys = {
  account: {
    syncTitle: {
      ru: 'Синхронизация',
      de: 'Synchronisierung',
      en: 'Synchronization',
    },
    lastSyncTime: {
      ru: 'Синхронизировано: {{time}}',
      de: 'Synchronisiert: {{time}}',
      en: 'Synced: {{time}}',
    },
    neverSynced: {
      ru: 'Ещё не синхронизировано',
      de: 'Noch nicht synchronisiert',
      en: 'Not synced yet',
    },
    syncJustNow: {
      ru: 'только что',
      de: 'gerade eben',
      en: 'just now',
    },
    syncNow: {
      ru: 'Синхронизировать сейчас',
      de: 'Jetzt synchronisieren',
      en: 'Sync now',
    },
    deleteAccount: {
      ru: 'Удалить аккаунт',
      de: 'Konto löschen',
      en: 'Delete account',
    },
    deleteTitle: {
      ru: 'Удаление аккаунта',
      de: 'Konto löschen',
      en: 'Delete account',
    },
    deleteWarning: {
      ru: 'Все ваши данные (история переводов, карточки учёбы, ключи API) будут безвозвратно удалены из базы данных. Это действие нельзя отменить.',
      de: 'Alle Ihre Daten (Übersetzungsverlauf, Lernkarten, API-Schlüssel) werden unwiderruflich aus der Datenbank gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
      en: 'All your data (translation history, flashcards, API keys) will be permanently deleted from the database. This action cannot be undone.',
    },
    deleteConfirmPassword: {
      ru: 'Введите ваш пароль для подтверждения:',
      de: 'Geben Sie Ihr Passwort zur Bestätigung ein:',
      en: 'Enter your password to confirm:',
    },
    deleteConfirmBtn: {
      ru: 'Удалить аккаунт навсегда',
      de: 'Konto endgültig löschen',
      en: 'Delete account permanently',
    },
    backupTitle: {
      ru: 'Резервная копия и перенос данных',
      de: 'Datensicherung & Übertragung',
      en: 'Backup & Data Transfer',
    },
    backupHint: {
      ru: 'Скачайте полную копию своих данных (история, карточки учёбы, списки и настройки) в формате JSON или перенесите их с другого устройства без сервера.',
      de: 'Laden Sie eine vollständige Kopie Ihrer Daten (Verlauf, Lernkarten, Listen und Einstellungen) als JSON herunter oder übertragen Sie sie ohne Server.',
      en: 'Download a full backup of your data (history, flashcards, lists, and settings) in JSON format or transfer them from another device without a server.',
    },
    exportBtn: {
      ru: 'Скачать мои данные (JSON)',
      de: 'Meine Daten herunterladen (JSON)',
      en: 'Download my data (JSON)',
    },
    importBtn: {
      ru: 'Импортировать из файла',
      de: 'Aus Datei importieren',
      en: 'Import from file',
    },
    exportSuccess: {
      ru: 'Файл резервной копии успешно скачан.',
      de: 'Sicherungsdatei erfolgreich heruntergeladen.',
      en: 'Backup file downloaded successfully.',
    },
    exportError: {
      ru: 'Не удалось создать файл резервной копии.',
      de: 'Sicherungsdatei konnte nicht erstellt werden.',
      en: 'Failed to generate backup file.',
    },
    importSuccess: {
      ru: 'Данные успешно импортированы: {{history}} переводов, {{cards}} карточек.',
      de: 'Daten erfolgreich importiert: {{history}} Übersetzungen, {{cards}} Karten.',
      en: 'Data successfully imported: {{history}} translations, {{cards}} cards.',
    },
    importError: {
      ru: 'Неверный формат файла резервной копии.',
      de: 'Ungültiges Sicherungsdateiformat.',
      en: 'Invalid backup file format.',
    },
  },
  admin: {
    overview: {
      dailyTableTitle: {
        ru: 'Посуточная статистика',
        de: 'Tägliche Statistiken',
        en: 'Daily Statistics',
      },
      dailyTableHint: {
        ru: 'История переводов, посетителей, новых пользователей, ошибок и ответивших сервисов по дням.',
        de: 'Verlauf von Übersetzungen, Besuchern, neuen Nutzern, Fehlern und antwortenden Diensten nach Tagen.',
        en: 'History of translations, visitors, new users, errors, and responding services by day.',
      },
      colDate: {
        ru: 'Дата',
        de: 'Datum',
        en: 'Date',
      },
      colTranslations: {
        ru: 'Переводы',
        de: 'Übersetzungen',
        en: 'Translations',
      },
      colVisitors: {
        ru: 'Посетители',
        de: 'Besucher',
        en: 'Visitors',
      },
      colNewUsers: {
        ru: 'Новые польз.',
        de: 'Neue Nutzer',
        en: 'New Users',
      },
      colErrors: {
        ru: 'Ошибки',
        de: 'Fehler',
        en: 'Errors',
      },
      colTranslators: {
        ru: 'Ответившие сервисы',
        de: 'Antwortende Dienste',
        en: 'Responding Services',
      },
    },
    settings: {
      whatsNewTitle: {
        ru: 'Окно «Что нового»',
        de: '«Was gibt\'s Neues»-Fenster',
        en: '«What\'s New» Window',
      },
      whatsNewHint: {
        ru: 'Текст обновления, который пользователи увидят во всплывающем окне после релиза.',
        de: 'Aktualisierungstext, den Benutzer nach der Veröffentlichung im Popup sehen.',
        en: 'Release notes text shown to users in a popup after an update.',
      },
      whatsNewEnabled: {
        ru: 'Показывать окно после обновления',
        de: 'Fenster nach Aktualisierung anzeigen',
        en: 'Show window after update',
      },
      whatsNewVersion: {
        ru: 'Версия',
        de: 'Version',
        en: 'Version',
      },
      whatsNewRu: {
        ru: 'Текст на русском',
        de: 'Text auf Russisch',
        en: 'Russian text',
      },
      whatsNewDe: {
        ru: 'Текст на немецком',
        de: 'Text auf Deutsch',
        en: 'German text',
      },
      whatsNewEn: {
        ru: 'Текст на английском',
        de: 'Text auf Englisch',
        en: 'English text',
      },
    },
  },
  whatsNew: {
    title: {
      ru: 'Что нового в версии {{version}}',
      de: 'Was gibt\'s Neues in Version {{version}}',
      en: 'What\'s new in version {{version}}',
    },
    dismiss: {
      ru: 'Понятно',
      de: 'Verstanden',
      en: 'Got it',
    },
  },
};

function deepAssign(target, source, lang) {
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === 'object' && ('ru' in val || 'de' in val || 'en' in val)) {
      target[key] = val[lang];
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (!target[key]) target[key] = {};
      deepAssign(target[key], val, lang);
    }
  }
}

deepAssign(ru, newKeys, 'ru');
deepAssign(de, newKeys, 'de');
deepAssign(en, newKeys, 'en');

fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2) + '\n', 'utf8');
fs.writeFileSync(dePath, JSON.stringify(de, null, 2) + '\n', 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');

console.log('Successfully updated ru.json, de.json, en.json with Part 20 keys!');
