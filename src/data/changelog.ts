/**
 * История версий для страницы «О приложении» и окна «Что нового».
 * Новые версии сверху. Версии 0.1.0–0.3.0 — в changelogOlder.ts.
 */
import type { UiLanguage } from '../../shared/languages';
import { OLDER_VERSIONS } from './changelogOlder';

export interface ChangelogEntry {
  version: string;
  /** Дата в формате ГГГГ-ММ-ДД. */
  date: string;
  items: Record<UiLanguage, string[]>;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.5.0',
    date: '2026-10-30',
    items: {
      ru: [
        'Карточка слова собирается из настоящих словарей — Wiktionary, OpenThesaurus, Tatoeba, PONS и DWDS — и работает даже без ИИ.',
        'К примерам A1–B2 добавилась вкладка «Из жизни»: живые предложения с переводом от сообщества Tatoeba.',
        'Синонимы дополняются из OpenThesaurus, значение по-немецки — из DWDS.',
        'Внизу карточки указано, откуда взяты данные, со ссылками на источники.',
        'Новая страница «Ресурсы»: проверенные бесплатные сайты для словарей, грамматики, аудирования, экзаменов и жизни в Германии.',
        'В админке — вкладка «Ресурсы»: добавить, изменить, скрыть и упорядочить ссылки.',
      ],
      de: [
        'Die Wortkarte wird aus echten Wörterbüchern zusammengestellt — Wiktionary, OpenThesaurus, Tatoeba, PONS und DWDS — und funktioniert auch ohne KI.',
        'Zu den Beispielen A1–B2 gibt es den Reiter „Aus dem Leben“: echte Sätze mit Übersetzungen aus der Tatoeba-Gemeinschaft.',
        'Synonyme ergänzt OpenThesaurus, die Bedeutung auf Deutsch kommt vom DWDS.',
        'Unten an der Karte stehen die Quellen mit Links.',
        'Neue Seite „Ressourcen“: geprüfte kostenlose Seiten für Wörterbücher, Grammatik, Hören, Prüfungen und Alltag in Deutschland.',
        'Im Adminbereich der Reiter „Ressourcen“: Links hinzufügen, bearbeiten, verbergen und ordnen.',
      ],
      en: [
        'The word card is now built from real dictionaries — Wiktionary, OpenThesaurus, Tatoeba, PONS and DWDS — and works even without AI.',
        'The A1–B2 examples got a “From real life” tab: genuine sentences with translations from the Tatoeba community.',
        'Synonyms come from OpenThesaurus, the German meaning from DWDS.',
        'The bottom of the card lists the sources with links.',
        'New “Resources” page: checked free sites for dictionaries, grammar, listening, exams and life in Germany.',
        'A “Resources” tab in the admin area: add, edit, hide and reorder links.',
      ],
    },
  },
  {
    version: '0.4.0',
    date: '2026-10-30',
    items: {
      ru: [
        '12 языков перевода: добавились французский, испанский, итальянский, португальский, польский, нидерландский, турецкий и арабский.',
        'Арабский текст пишется справа налево — поля и перевод учитывают это.',
        'Новый переводчик Lara Translate.',
        'Резервные ключи: если один закончился, сайт сам берёт следующий.',
        'Блок «Как переводят другие» под переводом: сравните варианты и подставьте лучший в один клик.',
        'Админка: статистика и график за 30 дней, ключи сайта, дневной лимит, баннер-объявление, блокировка пользователей.',
        'Страница «О приложении» с историей версий и окно «Что нового» после обновления.',
      ],
      de: [
        '12 Übersetzungssprachen: Neu sind Französisch, Spanisch, Italienisch, Portugiesisch, Polnisch, Niederländisch, Türkisch und Arabisch.',
        'Arabischer Text läuft von rechts nach links — Eingabe und Übersetzung berücksichtigen das.',
        'Neuer Übersetzer: Lara Translate.',
        'Ersatzschlüssel: Ist ein Schlüssel aufgebraucht, nimmt die Seite automatisch den nächsten.',
        'Block „Wie andere übersetzen“ unter der Übersetzung: Varianten vergleichen und die beste mit einem Klick einsetzen.',
        'Admin: Statistik und Grafik für 30 Tage, Schlüssel der Seite, Tageslimit, Banner, Sperren von Benutzern.',
        'Seite „Über die App“ mit Versionsverlauf und Fenster „Was ist neu“ nach dem Update.',
      ],
      en: [
        '12 translation languages: French, Spanish, Italian, Portuguese, Polish, Dutch, Turkish and Arabic are new.',
        'Arabic text runs right to left — the input and the translation follow it.',
        'New translator: Lara Translate.',
        'Reserve keys: when one key runs out, the site takes the next one by itself.',
        '“How others translate it” block under the translation: compare variants and use the best one in one click.',
        'Admin: statistics and a 30-day chart, site keys, daily limit, banner announcement, blocking users.',
        '“About” page with the version history and a “What’s new” window after an update.',
      ],
    },
  },
  ...OLDER_VERSIONS,
];

/** Самая новая версия — первая в списке. */
export const LATEST_VERSION = CHANGELOG[0].version;

/** Пункты истории на языке интерфейса. */
export function changelogItems(uiLang: UiLanguage): Array<{ version: string; date: string; items: string[] }> {
  return CHANGELOG.map((entry) => ({ version: entry.version, date: entry.date, items: entry.items[uiLang] }));
}
