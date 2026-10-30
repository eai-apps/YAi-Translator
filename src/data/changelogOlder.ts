/**
 * История версий: версии 0.1.0–0.3.0 (готовая часть).
 * Новые версии сверху; подключается из changelog.ts.
 */
import type { ChangelogEntry } from './changelog';

export const OLDER_VERSIONS: ChangelogEntry[] = [
  {
    version: '0.3.0',
    date: '2026-10-30',
    items: {
      ru: [
        'Аккаунт по логину и паролю: один логин на всех ваших устройствах.',
        'Избранное и история синхронизируются между устройствами.',
        'Ключи ИИ можно хранить в аккаунте — они шифруются и работают везде.',
        'Проверка сервисов сайта настоящими запросами.',
      ],
      de: [
        'Konto mit Login und Passwort: ein Login für alle deine Geräte.',
        'Favoriten und Verlauf werden zwischen Geräten abgeglichen.',
        'KI-Schlüssel können im Konto liegen — verschlüsselt und überall nutzbar.',
        'Prüfung der Dienste der Seite mit echten Anfragen.',
      ],
      en: [
        'Account with login and password: one login on all your devices.',
        'Favorites and history sync between devices.',
        'AI keys can be stored in the account — encrypted and working everywhere.',
        'Site services can be checked with real requests.',
      ],
    },
  },
  {
    version: '0.2.0',
    date: '2026-10-30',
    items: {
      ru: [
        'Сначала обычные переводчики, ИИ — по кнопке «Спросить у AI».',
        'Выбор переводчика и сравнение сервисов.',
        'Полная карточка слова с грамматическими пояснениями и примерами A2–B2.',
        'База данных D1 подключена, таблицы создаются сами.',
      ],
      de: [
        'Zuerst normale Übersetzer, KI nur auf „KI fragen“.',
        'Übersetzer wählen und Dienste vergleichen.',
        'Vollständige Wortkarte mit Grammatikhinweisen und Beispielen A2–B2.',
        'Die D1-Datenbank ist verbunden, Tabellen entstehen automatisch.',
      ],
      en: [
        'Classic translators first, AI only on the “Ask AI” button.',
        'Pick a translator and compare services.',
        'Full word card with grammar notes and A2–B2 examples.',
        'The D1 database is connected, tables are created automatically.',
      ],
    },
  },
  {
    version: '0.1.0',
    date: '2026-10-30',
    items: {
      ru: [
        'Переводчик, словарь и учебник немецкого.',
        'Автоопределение языка, обмен языками, умлауты, голосовой ввод и озвучка.',
        'Карточка слова: склонение, спряжение, примеры и выражения.',
        'История, избранное и установка приложения на телефон.',
      ],
      de: [
        'Übersetzer, Wörterbuch und Deutschlernapp.',
        'Spracherkennung, Sprachtausch, Umlaute, Spracheingabe und Vorlesen.',
        'Wortkarte: Deklination, Konjugation, Beispiele und Wendungen.',
        'Verlauf, Favoriten und Installation auf dem Handy.',
      ],
      en: [
        'Translator, dictionary and German tutor.',
        'Language detection, language swap, umlauts, voice input and speech.',
        'Word card: declension, conjugation, examples and expressions.',
        'History, favorites and installing the app on a phone.',
      ],
    },
  },
];;
