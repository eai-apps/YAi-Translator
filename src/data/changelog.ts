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
    version: '0.7.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Вкладка «Учёба» больше не «Скоро»: слова из переводчика теперь запоминаются надолго — карточки, повторение и упражнения.',
        'Кнопка «В карточки» в карточке слова, в словаре и рядом со звёздочкой на экране «Перевод».',
        'Повторение по интервалам 1 → 3 → 7 → 16 → 35 дней: «Не помню», «Трудно», «Помню», «Легко», режим «наоборот» и озвучка.',
        'Пять упражнений из ваших же карточек, без ИИ: артикль, множественное число, перевод, аудирование и сборка предложения.',
        'Восемь готовых наборов A1–A2 по 20 слов — артикли и множественное число сверены по Wiktionary.',
        'Слово дня — одно на всех, с кнопками «Знаю» и «Не знаю», серия дней и цель дня (10 / 20 / 30).',
        '«Мои карточки»: поиск, фильтр, экспорт в CSV и Anki, добавление всех избранных слов одним нажатием.',
      ],
      de: [
        'Der Reiter „Lernen“ ist kein „Bald“-Bildschirm mehr: Wörter aus dem Übersetzer bleiben jetzt im Kopf — Karten, Wiederholung und Übungen.',
        'Die Schaltfläche „In Karten“ in der Wortkarte, im Wörterbuch und neben dem Stern im Übersetzer.',
        'Wiederholung mit Abständen 1 → 3 → 7 → 16 → 35 Tage: „Weiß nicht“, „Schwer“, „Kenne ich“, „Leicht“, dazu die umgekehrte Seite und Vorlesen.',
        'Fünf Übungen aus deinen eigenen Karten, ohne KI: Artikel, Plural, Übersetzung, Hören und Satz bauen.',
        'Acht fertige Sets A1–A2 mit je 20 Wörtern — Artikel und Plural nach Wiktionary geprüft.',
        'Wort des Tages — für alle gleich, mit „Kenne ich“ und „Weiß nicht“, Serie der Tage und Tagesziel (10 / 20 / 30).',
        '„Meine Karten“: Suche, Filter, Export nach CSV und Anki, alle Favoriten mit einem Tippen hinzufügen.',
      ],
      en: [
        'The “Learn” tab is no longer a “Coming soon” screen: words from the translator now stick — cards, review and exercises.',
        'An “Add to cards” button in the word card, in the dictionary and next to the star in the translator.',
        'Spaced review with intervals 1 → 3 → 7 → 16 → 35 days: “Forgot”, “Hard”, “Good”, “Easy”, plus reverse mode and pronunciation.',
        'Five exercises built from your own cards, no AI: article, plural, translation, listening and sentence building.',
        'Eight ready-made A1–A2 sets of 20 words — articles and plurals checked against Wiktionary.',
        'Word of the day — the same for everyone, with “I know it” and “Not sure”, a day streak and a daily goal (10 / 20 / 30).',
        '“My cards”: search, filters, CSV and Anki export, and adding all favourites in one tap.',
      ],
    },
  },
  {
    version: '0.6.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Новый справочник грамматики: 69 тем немецкого — от артиклей и падежей до Konjunktiv II и Wechselpräpositionen.',
        'Названия тем в разборе, в карточке слова и в ответах учителя стали ссылками: нажмите «Konjunktiv II» — и правило откроется в окне, не уводя со страницы.',
        'Каждое правило готовится ИИ один раз и сохраняется в базе — следующим посетителям оно показывается сразу.',
        'У каждого правила — примеры, типичные ошибки и ссылки на Wikibooks, Deutsche Welle, Goethe-Institut и DWDS.',
        'Поиск по темам и фильтр по уровню A1–C1.',
        'Новая страница «Спросить у AI»: учитель отвечает на ваш вопрос на вашем языке, с примерами и ссылками на правила.',
        'Ответ на одинаковый вопрос не тратит лимит: он хранится 90 дней и общий для всех.',
        'В админке — вкладка «Грамматика»: список тем, статус, правка текста, «Перегенерировать» и «Добавить тему».',
      ],
      de: [
        'Neues Grammatik-Nachschlagewerk: 69 deutsche Themen — von Artikeln und Fällen bis Konjunktiv II und Wechselpräpositionen.',
        'Themennamen in der Analyse, in der Wortkarte und in den Antworten des Lehrers sind Links: Tippe auf „Konjunktiv II“ – die Regel öffnet sich im Fenster, ohne die Seite zu verlassen.',
        'Jede Regel wird einmal von der KI erstellt und in der Datenbank gespeichert — die nächsten Besucher sehen sie sofort.',
        'Zu jeder Regel: Beispiele, typische Fehler und Links zu Wikibooks, Deutsche Welle, Goethe-Institut und DWDS.',
        'Suche nach Themen und Filter nach Niveau A1–C1.',
        'Neue Seite „KI fragen“: Der Lehrer antwortet in deiner Sprache, mit Beispielen und Links zu den Regeln.',
        'Eine gleiche Frage kostet kein Limit mehr: Die Antwort liegt 90 Tage und gilt für alle.',
        'Im Adminbereich der Reiter „Grammatik“: Themenliste, Status, Text bearbeiten, „Neu erstellen“ und „Thema hinzufügen“.',
      ],
      en: [
        'New grammar reference: 69 German topics — from articles and cases to Konjunktiv II and two-way prepositions.',
        'Topic names in the analysis, the word card and the teacher’s answers are links: tap “Konjunktiv II” and the rule opens in a window without leaving the page.',
        'Every rule is written by the AI once and stored in the database — the next visitors see it instantly.',
        'Each rule comes with examples, typical mistakes and links to Wikibooks, Deutsche Welle, Goethe-Institut and DWDS.',
        'Search across topics and a level filter A1–C1.',
        'New “Ask AI” page: a teacher answers your question in your language, with examples and links to the rules.',
        'Asking the same question costs no limit: the answer is kept for 90 days and shared by everyone.',
        'A “Grammar” tab in the admin area: topic list, status, text editing, “Regenerate” and “Add a topic”.',
      ],
    },
  },
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
