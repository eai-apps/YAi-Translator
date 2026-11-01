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
    version: '0.15.0',
    date: '2026-11-01',
    items: {
      ru: [
        'Каждое слово перевода связано со словарём: под панелью перевода отображаются чипы слов из базы public/lex/de с цветным артиклем и переводом.',
        'Слова в тексте перевода выделены пунктирным подчёркиванием: нажатие мгновенно открывает карточку слова.',
        'Кнопка «+ В учёбу»: добавление слова в персональную колоду «Из переводов» в один клик.',
        'Понятный раздел «Учёба»: крупный статус повторения на сегодня, кнопка «Начать», статистика «Мои слова» и пошаговый старт для новичков.',
        'Удобные карточки повторения: крупное слово с артиклем, 3 большие кнопки снизу («Не помню / Трудно / Легко»), свайп влево/вправо.',
        'Понятный «Словарь»: мгновенный поиск без кнопки (немецкий или русский), Слово дня, история просмотров, алфавит и тематические наборы.',
      ],
      de: [
        'Jedes Übersetzungswort ist mit dem Lexikon verknüpft: Wort-Chips unter der Übersetzung mit farbigem Artikel und Übersetzung.',
        'Wörter im Übersetzungstext sind punktiert unterstrichen: Antippen öffnet sofort die Wortkarte.',
        '„+ Zum Lernen“-Button: Wort mit einem Klick zum persönlichen Deck „Aus Übersetzungen“ hinzufügen.',
        'Verständlicher Bereich „Lernen“: Großer Wiederholungsstatus für heute, „Starten“-Button, Fortschritt und Schritt-für-Schritt-Einführung.',
        'Bequeme Wiederholungskarten: Großes Wort mit Artikel, 3 große Daumentasten („Nicht gewusst / Schwer / Einfach“), Wischgesten.',
        'Verständliches „Wörterbuch“: Sofortsuche ohne Button (Deutsch oder Russisch), Wort des Tages, Verlauf, Alphabet und Themen.',
      ],
      en: [
        'Every translated word is connected to the lexicon: word chips under translation with colored articles and translations.',
        'Words in translated text are dotted-underlined: tapping instantly opens the word card.',
        '"+ To study" button: add any word to the personal "From translations" deck with a single tap.',
        'Clear "Study" section: large today review status, "Start" button, "My words" progress bar, and 3-step onboarding.',
        'Thumb-friendly review flashcards: large word with article, 3 big bottom buttons (Forgot / Hard / Easy), swipe left/right.',
        'Clear "Dictionary": instant search without submit button (German or Russian), Word of the Day, recent lookups, alphabet and topics.',
      ],
    },
  },
  {
    version: '0.14.1',
    date: '2026-11-01',
    items: {
      ru: [
        'Приложение: перевод снова работает — больше нет «Нет связи с сервером».',
        'Приложение: нижнее меню и кнопки больше не прячутся под кнопками Android «◀ ● ■».',
        'На телефоне Enter на клавиатуре сразу переводит и прячет клавиатуру.',
        'Страница «Приложения»: Android и Android TV — одна карточка (один APK), добавлен RuStore — скоро.',
      ],
      de: [
        'App: Übersetzen funktioniert wieder – kein „Keine Verbindung zum Server“ mehr.',
        'App: Das untere Menü liegt nicht mehr unter den Android-Tasten „◀ ● ■“.',
        'Auf dem Handy übersetzt Enter sofort und blendet die Tastatur aus.',
        'Seite „Apps“: Android und Android TV in einer Karte (eine APK), RuStore – bald.',
      ],
      en: [
        'App: translation works again — no more "No connection to server".',
        'App: the bottom menu no longer hides under the Android "◀ ● ■" buttons.',
        'On phones, Enter on the keyboard translates right away and hides the keyboard.',
        'Apps page: Android and Android TV merged into one card (one APK), RuStore — coming soon.',
      ],
    },
  },
  {
    version: '0.14.0',
    date: '2026-11-01',
    items: {
      ru: [
        'Полноценное мобильное приложение без браузерной рамки: экраны встроены внутри APK и работают мгновенно.',
        'Поддержка Android 15 edge-to-edge: правильные отступы под системный статус-бар и панель навигации.',
        'Новая шторка выбора языка снизу с быстрым поиском и недавними языками.',
        'Симметричная строка языков 1fr auto 1fr с кнопкой ⇄ строго по центру.',
        'Интерактивный свайп по карточке перевода: карточка следует за пальцем.',
        'Горизонтальная лента карточки слова (Яндекс-стиль): листание между значениями, формами, примерами и связями.',
        'Кнопка «Вставить» вынесена под поле ввода рядом с микрофоном; автоматическое скрытие клавиатуры.',
        'Обновление содержимого приложения «по воздуху» без необходимости переустановки APK.',
      ],
      de: [
        'Vollwertige App ohne Browser-Rahmen: Bildschirme sind direkt im APK integriert und starten sofort.',
        'Android 15 Edge-to-Edge-Unterstützung mit sicheren Abständen für Statusleiste und Navigation.',
        'Neues Sprachauswahl-Sheet von unten mit Schnellsuche und zuletzt verwendeten Sprachen.',
        'Symmetrische Sprachzeile (1fr auto 1fr) mit ⇄-Taste genau in der Mitte.',
        'Interaktives Wischen über die Übersetzungskarte: Karte folgt dem Finger.',
        'Horizontales Karussell für Wortkarten: Wischen zwischen Bedeutungen, Formen, Beispielen und Bezügen.',
        'Einfügen-Button unter dem Eingabefeld neben dem Mikrofon; automatische Tastatursteuerung.',
        'Over-the-Air-Inhaltsaktualisierung ohne Neuinstallation der APK.',
      ],
      en: [
        'Full standalone app without browser frame: screens are built into APK and launch instantly.',
        'Android 15 edge-to-edge support with safe area insets for status and navigation bars.',
        'New bottom sheet for language selection with fast search and recent languages.',
        'Symmetrical language bar (1fr auto 1fr) with centered ⇄ button.',
        'Interactive swipe on translation card: card follows the finger smoothly.',
        'Horizontal word card carousel: swipe between meanings, forms, examples, and relations.',
        'Paste button relocated beneath input next to microphone; automatic keyboard dismissal.',
        'Over-the-air bundle updates without reinstalling APK.',
      ],
    },
  },
  {
    version: '0.13.0',
    date: '2026-11-01',
    items: {
      ru: ['Карточка немецкого слова открывается мгновенно: артикль, мн. число, формы глагола и транскрипция — из своей базы (≈120 000 слов), пока ИИ готовит подробный разбор.', 'Самые частые слова (3000) готовятся заранее — их полная карточка открывается сразу.', 'Свайп по переводу снова листает историю (раньше мешали слова-кнопки).'],
      de: ['Die Wortkarte öffnet sich sofort: Artikel, Plural, Verbformen und Aussprache aus der eigenen Datenbank (≈120 000 Wörter), während die KI die ausführliche Analyse vorbereitet.', 'Die 3000 häufigsten Wörter werden vorab vorbereitet — ihre volle Karte öffnet sich sofort.', 'Wischen über die Übersetzung blättert wieder durch den Verlauf.'],
      en: ['German word cards open instantly: article, plural, verb forms and pronunciation from our own database (≈120,000 words) while AI prepares the full breakdown.', 'The 3,000 most frequent words are prepared in advance — their full card opens right away.', 'Swiping the translation browses history again.'],
    },
  },
  {
    version: '0.12.2',
    date: '2026-10-31',
    items: {
      ru: ['Новый раздел «Приложения» (слева в меню и в Профиле): скачать YAi Translator для Android и Android TV, установка на iPhone/iPad, версия приложения и обновления.'],
      de: ['Neuer Bereich „Apps“ (im Menü links und im Profil): YAi Translator für Android und Android TV herunterladen, Installation auf iPhone/iPad, App-Version und Updates.'],
      en: ['New “Apps” section (left menu and Profile): download YAi Translator for Android and Android TV, install on iPhone/iPad, app version and updates.'],
    },
  },
  {
    version: '0.12.1',
    date: '2026-10-31',
    items: {
      ru: ['Приложение Android обновляется само: экраны и функции берутся с сайта. В «Профиль → О приложении» — версия и «Проверить обновления».', 'Без интернета приложение показывает понятный экран «Нет интернета» с кнопкой «Повторить».'],
      de: ['Die Android-App aktualisiert sich selbst: Bildschirme und Funktionen kommen von der Website. Unter „Profil“ — Version und „Nach Updates suchen“.', 'Ohne Internet zeigt die App einen klaren Bildschirm „Keine Verbindung“ mit „Erneut“.'],
      en: ['The Android app updates itself: screens and features come from the website. In Profile — version and “Check for updates”.', 'Without internet the app shows a clear “No connection” screen with “Retry”.'],
    },
  },
  {
    version: '0.12.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Листание переводов свайпом влево/вправо, кнопками ‹ › и клавишами Alt+←/Alt+→.',
        'Синхронизация адреса (?q=...&from=...&to=...): кнопки «Назад» и «Вперёд» перебирают предыдущие переводы.',
        'Кнопка «История» в шапке перевода с быстрым поиском, открытием и очисткой.',
        'Озвучка в Android-приложении через нативный движок Text-to-Speech.',
        '«Перевести в YAi» из контекстного меню выделения текста и меню «Поделиться» любого приложения Android.',
        'Серия дней активности 🔥 и ежедневное напоминание (в приложении).',
        'Карточка «Повтори 5 слов из истории» после каждых 10 переводов слов.',
        'Поделиться красивой карточкой перевода (1080×1350) в соцсетях.',
        'Чипс «Вставить» для быстрой вставки из буфера обмена в пустое поле.',
      ],
      de: [
        'Übersetzungsverlauf durchblättern: Wischen, ‹ ›-Tasten und Alt+←/Alt+→.',
        'Adresszeilensynchronisierung (?q=...): Vor- und Zurück-Buttons wechseln Übersetzungen.',
        'Verlauf-Button in der Kopfzeile mit Schnellsuche, Öffnen und Leeren.',
        'Sprachausgabe in der Android-App über die native Text-to-Speech-Engine.',
        '„In YAi übersetzen“ aus dem Textauswahl- und Teilen-Menü jeder Android-App.',
        'Tagesserie 🔥 und tägliche Erinnerung (in der App).',
        '„5 Wörter aus dem Verlauf wiederholen“-Karte nach jeweils 10 Wortübersetzungen.',
        'Übersetzung als ansprechende Bildkarte (1080×1350) teilen.',
        '„Einfügen“-Chip für schnelles Einfügen aus der Zwischenablage.',
      ],
      en: [
        'Swipe navigation through translation history, ‹ › buttons, and Alt+←/Alt+→ shortcuts.',
        'URL synchronization (?q=...): browser Back and Forward buttons navigate through translations.',
        'History drawer button in the header with search, open, and clear options.',
        'In-app speech synthesis via native Text-to-Speech engine on Android.',
        '“Translate in YAi” from text selection context menu and share sheet in any Android app.',
        'Activity day streak 🔥 and daily reminder (in-app).',
        '“Review 5 words from history” card after every 10 word translations.',
        'Share beautiful translation card image (1080×1350).',
        'Quick “Paste” chip for one-tap clipboard paste into empty input.',
      ],
    },
  },
  {
    version: '0.11.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Универсальное Android-приложение (Capacitor): один APK для телефонов, планшетов и Android TV.',
        'Поддержка Android TV и пульта (D-pad): видимый контрастный фокус у кнопок, вкладок и полей, Leanback-баннер 320×180.',
        'Нативная кнопка «Назад»: закрытие открытых окон/диалогов, переход назад по истории и сворачивание на главной.',
        'Стилизация статус-бара по теме оформления и плавное скрытие сплэш-экрана.',
        'Проверка обновлений без магазина приложений через version.json.',
        'Автоматическая сборка и релиз APK в GitHub Actions.',
      ],
      de: [
        'Universelle Android-App (Capacitor): eine APK für Smartphones, Tablets und Android TV.',
        'Unterstützung für Android TV und Fernbedienung (D-Pad): sichtbarer Fokus, Leanback-Banner 320×180.',
        'Nativer Zurück-Button: Schließen von Dialogen, Zurücknavigieren und Minimieren auf der Startseite.',
        'Statusleisten-Anpassung an das Theme und Splash-Screen-Integration.',
        'Update-Prüfung ohne Store über version.json.',
        'Automatische APK-Erstellung und Releases in GitHub Actions.',
      ],
      en: [
        'Universal Android app (Capacitor): single APK for phones, tablets and Android TV.',
        'Android TV & D-pad remote support: prominent focus outlines, Leanback 320×180 banner.',
        'Native back button handling: closes dialogs, navigates back and minimizes on home.',
        'Theme-matching status bar coloring and splash screen handling.',
        'Store-less update checks via version.json.',
        'Automated APK release workflow in GitHub Actions.',
      ],
    },
  },
  {
    version: '0.10.2',
    date: '2026-10-31',
    items: {
      ru: ['«Суперточный перевод (ИИ Pro)»: кроме перевода — 3 лёгких примера с озвучкой и один цепляющий совет, карточка выделена.'],
      de: ['„Extra-genaue Übersetzung (KI Pro)“: dazu 3 einfache Beispiele mit Vorlesen und ein einprägsamer Tipp, die Karte ist hervorgehoben.'],
      en: ['“Super-accurate (AI Pro)”: plus 3 easy examples with audio and one catchy tip; the card is highlighted.'],
    },
  },
  {
    version: '0.10.1',
    date: '2026-10-31',
    items: {
      ru: ['«Точный перевод (ИИ)» и «Суперточный перевод (ИИ Pro)» — теперь режимы: выбрали один раз, и все переводы и карточки слов идут через него.', 'Выбор нейросети в «Быстрый перевод ▾» больше не сбрасывается сам.', 'Платные нейросети сайта не тратят бесплатные попытки дня — у них свой бюджет токенов.'],
      de: ['„Genaue Übersetzung (KI)“ und „Extra-genaue Übersetzung (KI Pro)“ sind jetzt Modi: einmal wählen, und alle Übersetzungen und Wortkarten laufen darüber.', 'Die KI-Auswahl springt nicht mehr von selbst zurück.', 'Bezahlte KI-Modelle der Website verbrauchen keine kostenlosen Tagesversuche.'],
      en: ['“Accurate (AI)” and “Super-accurate (AI Pro)” are now modes: pick once and all translations and word cards use them.', 'The AI choice no longer resets by itself.', 'Paid site models no longer use up the free daily attempts.'],
    },
  },
  {
    version: '0.10.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Админка: карточки платных подключений с таблицей моделей, статус-точками, временем ответа, кнопкой «Проверить все» и выбором модели по умолчанию.',
        'Новый режим перевода «Точный перевод (ИИ) Pro» через модель по умолчанию сайта.',
        'Выбор нейросети на странице «Спросить у AI» и в диалоге словаря («Бесплатно», «Pro», модели сайта, свой ключ).',
        'Боковое меню: отображение логина вошедшего пользователя с зелёной точкой или «Гость · Войти».',
        'Словарь без ИИ для гостей: качественный перевод ru → de через ru.wiktionary с артиклями, de.wiktionary (формы, падежи), OpenThesaurus и Tatoeba без английских толкований.',
      ],
      de: [
        'Admin: Karten für kostenpflichtige Verbindungen mit Modelltabelle, Statuspunkten, Latenz, „Alle testen“ und Standardmodell-Auswahl.',
        'Neuer Übersetzungsmodus „Genaue Übersetzung (KI) Pro“ über das Standardmodell der Website.',
        'Auswahl des KI-Modells auf der Seite „KI fragen“ und im Wörterbuch-Chat („Kostenlos“, „Pro“, Website-Modelle, eigener Schlüssel).',
        'Seitenleiste: Anzeige des angemeldeten Benutzers mit grünem Punkt oder „Gast · Anmelden“.',
        'Wörterbuch ohne KI für Gäste: Hochwertige ru → de Übersetzungen über ru.wiktionary mit Artikeln, de.wiktionary (Formen, Fälle), OpenThesaurus und Tatoeba ohne englische Definitionen.',
      ],
      en: [
        'Admin: Paid connection cards with models table, status dots, latency, “Test all” button, and default model selection.',
        'New translation mode “Accurate translation (AI) Pro” using the site default model.',
        'AI model selector on “Ask AI” page and dictionary chat (“Free”, “Pro”, site models, personal key).',
        'Sidebar: Shows logged-in username with green dot or “Guest · Sign in”.',
        'No-AI dictionary for guests: High-quality ru → de lookup via ru.wiktionary with articles, de.wiktionary (forms, cases), OpenThesaurus, and Tatoeba without English definitions.',
      ],
    },
  },
  {
    version: '0.9.4',
    date: '2026-10-31',
    items: {
      ru: ['Под переводом видно, какая нейросеть ответила (например, deepseek-v4.1-flash), а не «OpenAI».', 'Админка: кнопка «Проверить» у платной нейросети показывает время ответа и ответ модели.'],
      de: ['Unter der Übersetzung steht das antwortende KI-Modell (z. B. deepseek-v4.1-flash) statt „OpenAI“.', 'Admin: „Prüfen“ bei bezahlter KI zeigt Antwortzeit und Antwort des Modells.'],
      en: ['The translation shows which model answered (e.g. deepseek-v4.1-flash) instead of “OpenAI”.', 'Admin: “Test” on a paid model shows response time and the model reply.'],
    },
  },
  {
    version: '0.9.3',
    date: '2026-10-31',
    items: {
      ru: [
        'Нейросети сайта (Claude, ChatGPT, DeepSeek, Qwen…) можно выбрать прямо в списке «Быстрый перевод ▾» — после входа.',
        'В админке к одному ключу можно подключить сразу несколько нейросетей галочками; исправлена загрузка списка моделей.',
        'Под заголовком «Перевод» для гостей — что даёт бесплатная регистрация.',
      ],
      de: [
        'KI-Modelle der Website (Claude, ChatGPT, DeepSeek, Qwen…) direkt in der Liste „Schnelle Übersetzung ▾“ wählbar — nach Anmeldung.',
        'Im Admin-Bereich mehrere Modelle pro Schlüssel ankreuzbar; das Laden der Modellliste wurde repariert.',
        'Für Gäste unter „Übersetzen“: was die kostenlose Registrierung bringt.',
      ],
      en: [
        'Site AI models (Claude, ChatGPT, DeepSeek, Qwen…) can be picked right in the “Fast translation ▾” list — after sign-in.',
        'Admin: tick several models per key; loading the model list is fixed.',
        'Guests see what free sign-up gives under the “Translate” heading.',
      ],
    },
  },
  {
    version: '0.9.2',
    date: '2026-10-31',
    items: {
      ru: ['Платная нейросеть: выберите сервис из списка, вставьте ключ — и выберите любую нейросеть из полного списка с поиском и ценами.'],
      de: ['Bezahlte KI: Dienst aus der Liste wählen, Schlüssel einfügen und ein beliebiges Modell aus der vollständigen Liste mit Suche und Preisen wählen.'],
      en: ['Paid AI: pick the service from a list, paste your key and choose any model from the full list with search and prices.'],
    },
  },
  {
    version: '0.9.1',
    date: '2026-10-31',
    items: {
      ru: [
        'Платные нейросети: подключение любых OpenAI-совместимых сервисов (OpenRouter, DeepSeek, OpenAI) на сайте и в профиле.',
        'Маршрутизация и лимиты токенов: дневные и месячные квоты, автоматическое переключение.',
        'Раздел «Где купить ключ от 1$» с пошаговой инструкцией подключения.',
        'Бонусы за регистрацию: 50 запросов к ИИ в день вместо 5, история до 1000 записей и доступ к общим сетям.',
      ],
      de: [
        'Kostenpflichtige KI-Netzwerke: Anbindung beliebiger OpenAI-kompatibler Dienste (OpenRouter, DeepSeek, OpenAI).',
        'Routing und Token-Limits: tägliche und monatliche Quoten mit automatischer Umschaltung.',
        'Bereich „Wo Schlüssel ab 1$ kaufen“ mit Schritt-für-Schritt-Anleitung.',
        'Registrierungsboni: 50 KI-Anfragen pro Tag statt 5, Verlauf bis zu 1000 Einträge.',
      ],
      en: [
        'Paid AI networks: connect any OpenAI-compatible provider (OpenRouter, DeepSeek, OpenAI).',
        'Routing and token limits: daily and monthly quotas with automatic fallback.',
        '“Where to buy key from $1” section with step-by-step setup guide.',
        'Registration benefits: 50 AI requests per day instead of 5, history up to 1000 entries.',
      ],
    },
  },
  {
    version: '0.9.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Голосовой ввод через Cloudflare Workers AI Whisper: диктовка с точной расстановкой знаков препинания и заглавных букв.',
        'Словарь «в одном окне»: панель общения с ИИ прямо под карточкой слова с кликабельными подсказками.',
      ],
      de: [
        'Spracheingabe über Cloudflare Workers AI Whisper: Diktat mit Satzzeichen und Großschreibung.',
        'Wörterbuch im selben Fenster: KI-Chat direkt unter der Wortkarte mit klickbaren Wörtern.',
      ],
      en: [
        'Voice input via Cloudflare Workers AI Whisper: dictation with punctuation and capitalization.',
        'Dictionary in one window: interactive AI tutor chat directly below the word card.',
      ],
    },
  },
  {
    version: '0.8.3',
    date: '2026-10-31',
    items: {
      ru: [
        'Новый заголовок экрана «Перевод»: фирменный шрифт и короткое описание, что умеет переводчик.',
        'При переводе на немецкий словарь в карточке показывает немецкие слова с артиклем и русским переводом под каждым: «die Tätigkeit — деятельность».',
        'Грамматика слова подробнее: 4–6 пунктов, в каждом 3–4 примера A1–B2.',
        'Номер версии в меню показывается один раз — внизу.',
      ],
      de: [
        'Neue Überschrift auf „Übersetzen“: eigene Schrift und ein kurzer Satz, was der Übersetzer kann.',
        'Beim Übersetzen ins Deutsche zeigt das Wörterbuch deutsche Wörter mit Artikel und kurzer Übersetzung.',
        'Ausführlichere Grammatik: 4–6 Punkte mit je 3–4 Beispielen A1–B2.',
        'Die Versionsnummer steht im Menü nur noch einmal — unten.',
      ],
      en: [
        'New heading on "Translate": a display font and a short line about what the translator does.',
        'When translating into German, the dictionary lists German words with article and a short translation under each.',
        'More detailed grammar: 4–6 points with 3–4 A1–B2 examples each.',
        'The version number is shown once in the menu — at the bottom.',
      ],
    },
  },
  {
    version: '0.8.2',
    date: '2026-10-31',
    items: {
      ru: [
        'Поле ввода стало ниже и растёт вместе с текстом — перевод стоит сразу под словом, без пустого места.',
        'Убрано пояснение под заголовком «Перевод»: всё на экране поднялось выше.',
        'Перевод у синонимов, антонимов и однокоренных слов теперь всегда на языке интерфейса — и при переводе с русского на немецкий.',
      ],
      de: [
        'Das Eingabefeld ist niedriger und wächst mit dem Text — die Übersetzung steht direkt darunter.',
        'Der Hinweis unter der Überschrift „Übersetzen“ ist weg: alles rückt nach oben.',
        'Verwandte Wörter werden immer in der Sprache der Oberfläche übersetzt.',
      ],
      en: [
        'The input box is shorter and grows with your text — the translation sits right below it.',
        'The hint under the "Translate" heading is gone, so everything moves up.',
        'Related words are always glossed in the interface language, also when translating into German.',
      ],
    },
  },
  {
    version: '0.8.1',
    date: '2026-10-31',
    items: {
      ru: [
        'Экран «Перевод» как в Яндексе: на широком экране слева поле ввода и сразу под ним перевод, справа «Как переводят другие» и перевод AI на всю высоту — пустых мест больше нет.',
        'Связанные слова (синонимы, антонимы, однокоренные) теперь с коротким переводом: «bringen — приносить».',
        'Вкладка «Грамматика» — как в хорошем учебнике: 3–5 пунктов про это слово и 2–4 примера уровней A1–B2 с подсветкой, озвучкой и переводом.',
        'В примерах новый фильтр «Как ещё сказать»: то же самое другими словами.',
        'Словарь ищет слово на любом из 12 языков; есть выбор языка слова и языка перевода.',
        'Свои списки слов «Учёба → Мои списки»: как плейлисты, с учёбой и упражнениями только по списку. Меню «В карточки ▾» есть в карточке слова, под переводом, в избранном и истории.',
        'Боковое меню на компьютере прокручивается, тема и язык — компактными кнопками, версия всегда видна.',
      ],
      de: [
        'Übersetzer wie bei Yandex: Eingabe mit der Übersetzung direkt darunter, rechts „Wie andere übersetzen“ und die KI-Übersetzung über die ganze Höhe.',
        'Verwandte Wörter mit kurzer Übersetzung: „bringen — bringen“.',
        'Reiter „Grammatik“ wie im Lehrbuch: 3–5 Punkte zu diesem Wort und 2–4 Beispiele A1–B2 mit Markierung, Vorlesen und Übersetzung.',
        'Neuer Filter bei den Beispielen: „Anders gesagt“.',
        'Das Wörterbuch sucht Wörter in allen 12 Sprachen und erlaubt Sprachwahl.',
        'Eigene Wortlisten unter „Lernen → Meine Listen“ mit Übungen nur für diese Liste.',
        'Die Seitenleiste ist scrollbar, Thema und Sprache kompakt, die Version immer sichtbar.',
      ],
      en: [
        'Translator like Yandex: input with the translation right below it, "How others translate" and the AI translation on the right.',
        'Related words now show a short translation: "bringen — to bring".',
        'The Grammar tab is textbook-style: 3–5 points about this word and 2–4 examples A1–B2 with highlighting, audio and translation.',
        'New "Other ways to say" filter in the examples.',
        'The dictionary searches words in all 12 languages and lets you pick the languages.',
        'Your own word lists under "Learn → My lists", with review and practice for one list only.',
        'The desktop sidebar scrolls, theme and language switches are compact, the version is always visible.',
      ],
    },
  },
  {
    version: '0.8.0',
    date: '2026-10-31',
    items: {
      ru: [
        'Экран перевода как в Яндекс Переводчике: крупное поле, пилюля «Быстрый перевод ▾» (быстрый, точный через ИИ, выбор сервиса) и меню «⋯».',
        'Карточка слова по вкладкам: Словарь · Примеры · Формы · Связанные слова. В заголовке — транскрипция и главные формы (holte, geholt).',
        'Переводы в словаре — кнопки: нажмите «получать», и слово переведётся обратно.',
        'Примеры с фильтром по значениям, искомое слово подсвечено и в немецком, и в переводе.',
        'Формы глагола: прошедшее / настоящее / будущее — Partizip, Präsens, Konjunktiv I и II, Imperativ, Perfekt, Futur. Таблицы склонения прилагательных.',
        'Подсказки при наборе слова (Wiktionary и ваша история).',
        'Новые настройки: история вкл/выкл, определять язык, подсказки, «Enter для перевода», офлайн-режим, справка.',
      ],
      de: [
        'Übersetzer wie bei Yandex: großes Eingabefeld, Auswahl „Schnelle Übersetzung ▾“ (schnell, genau mit KI, Dienst wählen) und Menü „⋯“.',
        'Wortkarte mit Reitern: Wörterbuch · Beispiele · Formen · Verwandte Wörter. Im Kopf Lautschrift und Hauptformen (holte, geholt).',
        'Übersetzungen im Wörterbuch sind Schaltflächen: Tippen übersetzt das Wort zurück.',
        'Beispiele mit Filter nach Bedeutung, das gesuchte Wort ist markiert.',
        'Verbformen: Vergangenheit / Gegenwart / Zukunft — Partizip, Präsens, Konjunktiv I und II, Imperativ, Perfekt, Futur. Adjektivdeklination.',
        'Vorschläge beim Tippen (Wiktionary und Ihr Verlauf).',
        'Neue Einstellungen: Verlauf an/aus, Sprache erkennen, Vorschläge, „Enter zum Übersetzen“, Offline, Hilfe.',
      ],
      en: [
        'Translator screen like Yandex Translate: large input, "Quick translation ▾" pill (quick, accurate with AI, choose a service) and a "⋯" menu.',
        'Word card with tabs: Dictionary · Examples · Forms · Related. Header shows transcription and main forms (holte, geholt).',
        'Dictionary translations are buttons: tap one to translate it back.',
        'Examples with a meaning filter, the word is highlighted in both languages.',
        'Verb forms: past / present / future — Partizip, Präsens, Konjunktiv I and II, Imperativ, Perfekt, Futur. Adjective declension tables.',
        'Suggestions while typing (Wiktionary and your history).',
        'New settings: history on/off, detect language, suggestions, "Enter to translate", offline mode, help.',
      ],
    },
  },
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
