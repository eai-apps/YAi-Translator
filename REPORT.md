# Версия 0.6.0 — этап 5: справочник грамматики и «Спросить у AI»

Дата: 31.10.2026 · Версия: **0.6.0** · Автор этапа: DeepSeek

Сделано по `tasks/STAGE5.md`. Не менялись: логотип (`src/components/layout/Logo.tsx`, `public/logo.svg`),
логика аккаунтов (`functions/_lib/auth/*`), `deeplUrl()` и `wrangler.toml` (временная правка для проверки восстановлена),
логика перевода. Админка только дополнена вкладкой, аккаунты и история переводов — новой вкладкой «Грамматика»
в меню и новым полем `topics` в разборе.

Два файла разложены на части, потому что стали длиннее 250 строк (правило из `AGENTS.md`):
`shared/types.ts` → `shared/typeCore.ts`, `typeTasks.ts`, `typeTranslate.ts`, `typeWord.ts`, `typeAccount.ts`
(`types.ts` по-прежнему единственная точка импорта — всё реэкспортируется, ни один импорт в проекте не менялся).
Список 69 тем → пять файлов `shared/grammarTopicsGroup1…5.ts`; словарь терминов → четыре файла
`src/data/grammarTerms*.ts`. Два файла длиннее 250 строк были **до меня** и не трогались:
`src/hooks/useTranslator.ts` (297 строк — его кроме меня пишет Claude) и `src/components/layout/icons.tsx` (273).

---

## Этап 5 — что сделано

### 1. Справочник грамматики `/grammar`

- **Меню.** В боковом меню на широком экране появились пункты **«Грамматика»** (между «Словарём» и «Учёбой»)
  и **«Спросить у AI»** (`src/components/layout/navItems.ts`: `useNavItems` — 5 нижних вкладок,
  `useSidebarItems` — те же 5 плюс грамматика и AI). Нижняя панель осталась из 5 вкладок; на телефоне
  кнопка **«Справочник грамматики»** добавлена на страницу «Учёба» (`src/pages/LearnPage.tsx`).
- **Страница** (`src/pages/GrammarPage.tsx`, ленивая): слева список тем, справа правило выбранной темы.
  Тема хранится в адресе — `/grammar/konjunktiv-2` можно сохранить или отправить кому угодно.
- **Поиск и фильтр**: поиск по трём названиям (русское, немецкое, английское), фильтр по уровню A1–C1
  и счётчик найденных тем; поиск и уровень сохраняются в адресе (`?q=…&level=B1`).
  Темы сгруппированы по 14 разделам (артикли, падежи, времена, наклонения, залог, союзы, предлоги…).
- **Карточка темы** (`src/components/grammar/GrammarTopicView.tsx`) — ровно структура `body_json`:
  «Коротко», «Когда нужно», «Как образуется» (правило + пример + перевод), «Примеры» (с уровнями),
  «Исключения», «Типичные ошибки» (как не надо / как надо / почему), «Смотрите также» и внизу
  **«Подробнее в открытых источниках»**. Термины внутри текста — ссылки (`GrammarLinkedText`).

### 2. Таблица и начальный список тем

- `grammar_topics(slug PK, lang, level, category, title_ru, title_de, title_en, body_json, source,
  source_url, updated_at, edited_by)` — в `functions/_lib/schema.ts` (создаётся автоматически)
  и в `migrations/0005_grammar.sql`.
- **69 тем немецкого** (в задании требовалось не меньше 60). Список совпадает в трёх местах —
  проверил скриптом (`sql == seed == shared`, 69 = 69 = 69):
  - `shared/grammarTopics.ts` — общий массив + проверки (`GRAMMAR_CATEGORIES`, `GRAMMAR_LEVELS`, `isGermanGrammarSlug`),
    сами темы — в пяти файлах `shared/grammarTopicsGroup1…5.ts`;
  - `migrations/0005_grammar.sql` — `INSERT OR IGNORE` (повторный запуск безопасен и не затирает тексты);
  - `functions/_lib/grammar/seed.ts` — заливка автоматически при первом запросе справочника
    (как у ресурсов на этапе 4: флаг `grammar_seeded` в `settings`, удалённая тема сама не вернётся).
  В списке есть все темы из задания: артикли, падежи (включая Genitiv), n-склонение, сильное/слабое/смешанное
  склонение прилагательных, Präsens, Perfekt (и `perfekt-haben-sein`), Präteritum, Plusquamperfekt, Futur I/II,
  Konjunktiv I, Konjunktiv II (`würde`, `hätte/wäre`, модальные глаголы), Vorgangs-/Zustandspassiv, модальные
  и возвратные глаголы, отделяемые/неотделяемые приставки, порядок слов (главное, придаточное, вопросы, TeKaMoLo),
  союзы (weil/denn/da, obwohl/trotzdem, dass, ob, wenn/als, damit/um…zu), предлоги с Akk/Dat и Wechselpräpositionen,
  предлоги с Genitiv, глаголы с предлогами, относительные придаточные, инфинитив с zu, сравнение прилагательных,
  отрицание nicht/kein, числительные и время, вежливые формы, косвенная речь, письменный/научный язык (C1).

### 3. Как появляется текст темы

- `GET /api/grammar/topic?slug=…&ui=ru` (`functions/api/grammar/topic.ts`):
  1. Тема есть в базе с текстом → отдаём из базы, ИИ не трогаем.
  2. Текста нет → один раз просим ИИ (`functions/_lib/grammar/generate.ts`):
     ключ пользователя первым (заголовки `X-User-*` или ключ аккаунта), затем общие ключи Gemini → Groq
     по пулу, дневной лимит — только на общих ключах (`createLimitGuard`). Ответ проверяется
     (`functions/_lib/validate/grammar.ts`: обязателен `summary`, остальное аккуратно приводится и обрезается),
     ссылки на источники из ответа ИИ **заменяются нашими** (`grammarTopicLinks`), неизвестные slug
     в `related` отбрасываются. Затем текст **навсегда** сохраняется в D1 (`source = 'ai'`).
  3. Одновременные первые открытия одной темы не тратят ИИ дважды: на время генерации в таблице кэша
     ставится блокировка на 2 минуты (снимается в `finally`). Пока она стоит, сервер отвечает
     `body: null, offlineReason: 'error'`, а окно на клиенте молча ждёт и повторяет до 4 раз.
  4. ИИ недоступен (лимит или ошибка) → название, ссылки на открытые источники и причина
     `offlineReason: 'limit' | 'error'`; кнопка **«Повторить позже»** просит снова.
- Новые промпты в `functions/_lib/prompts.ts`: `buildGrammarPrompt` (правило) и `buildAskPrompt` (учитель).
  Оба получают список известных slug и обязаны ставить ссылки только на них. `PROMPT_VERSION` поднят с `2` до `3`.
- `GET /api/grammar/topics` — список тем без текста (`filled`: есть ли уже текст) и быстрый.

### 4. Открытые источники рядом с правилом

- `shared/grammarLinks.ts`: у каждой темы **1–2 точные ссылки**. Wikibooks «German»
  (конкретные разделы: `Verbs#Perfect_Tense`, `Declining_adjectives`, `Sentences#Subordinate_Clauses`,
  `Prepositions_with_accusative_and_dative`, `Prefixed_verbs` …), Deutsche Welle «Learn German»
  (`/de/grammatik/s-13559254` и др.), Goethe-Institut, DWDS (для словарных тем). Хранятся в `body_json.links`.
- Как проверял 31.10.2026: Wikibooks — все использованные страницы 200 (проверял через API и запросом),
  DW — все использованные страницы 200. **Goethe-Institut отвечает 403 на автоматический запрос**
  (закрыт для роботов, как и на этапе 4 — в браузере открывается). Страницы Wikibooks с якорем `#…`
  проверены по адресу без якоря: сам сервер отвечает 404 на запрос с `#`.
- Курсы DW `de/kurs/…`, `de/uebungen/…` со старыми номерами 404 и в списки не попали — заменены на рабочие.

### 5. Термины в тексте становятся ссылками

- `src/data/grammarTerms.ts` — словарь «слово → slug»: немецкие, русские и английские названия
  (Konjunktiv II / сослагательное наклонение / subjunctive II), формы (Präteritum, перфект), термины
  (weil, damit, Wechselpräpositionen), образцы с окончаниями. Сам словарь разложен по группам тем
  в `grammarTermsData.ts` и четыре файла `grammarTerms{Nouns,Verbs,Syntax,Style}.ts`, а поиск — в `grammarTerms.ts`.
  Для общих терминов (`Passiv`, «падеж», `sollte`)
  есть флаг `skipInNotes` — в «Что важно знать» они не подчёркиваются, чтобы весь текст не стал ссылками.
- `src/components/grammar/grammarHighlight.ts` находит самое раннее и самое длинное совпадение,
  остальное режет по границам слов — «wenn» не задевает «wenn auch» внутри других слов, «Perfekt»
  не подчёркивается в «Perfektion».
- Подсветка стоит в **разборе** (`ExplanationPanel`: «Коротко», порядок слов, союзы, падежи, времена,
  объяснения ошибок), в **карточке слова** («Что важно знать» — `WordCard.tsx`) и в **ответах учителя**.
  Клик открывает тему во всплывающем окне (`GrammarTopicDialog`) поверх страницы: на телефоне снизу,
  на компьютере по центру; окно не уводит со страницы перевода.
- Промпты разбора и карточки просят у ИИ **список `topics` / `grammarTopics`**; сервер пропускает только
  известные slug (`functions/_lib/validate/explain.ts`, `word.ts`), и эти темы показываются отдельными
  кнопками («Темы по этой грамматике») — даже если слово в тексте не встретилось.
- Порядок подсветки проверен отдельно: 8 текстов (немецкие и русские объяснения), 8/8 верно,
  текст после разбиения совпадает с исходным символ в символ.

### 6. «Спросить у AI» — учитель в чате

- Страница `/ask` (`src/pages/AskPage.tsx`, ленивая): поле вопроса (Enter — отправить, Shift+Enter — перенос),
  4 подсказки-примера («Когда Perfekt, а когда Präteritum?», «Чем отличается weil от denn?»,
  «Как вежливо отказаться по-немецки?», «Почему здесь Akkusativ, а не Dativ?»). Ответ — на языке интерфейса:
  короткое объяснение, разделы, примеры и кнопки-ссылки на темы справочника.
  Кнопка «Спросить у AI» есть в боковом меню, на странице «Грамматика» и в окне темы
  (последняя открывает `/ask?q=<название темы>`).
- `POST /api/ask` (`functions/api/ask.ts`): вопрос нормализуется (пробелы, регистр, знак в конце),
  ответ **кэшируется в D1 на 90 дней** (`ASK.cacheTtlSeconds`) — одинаковые вопросы разных людей
  стоят ИИ один запрос. Ключ пользователя первым, общий дневной лимит — на общих ключах.
- **История вопросов** (`src/hooks/useAskHistory.ts`): `localStorage` `yai.askHistory`, до 200 записей;
  у вошедших синхронизируется через существующий `/api/sync` вместе с избранным. Чтобы наборы не смешивались,
  `useHistorySync.ts` получил проверку `parse` (у запроса есть `question`, у записи истории перевода — `text`)
  и **свои отметки отправленного** (`SYNC_MARKS.history` и `SYNC_MARKS.ask`) — иначе удаление на одном
  устройстве скрывало бы чужую запись с тем же id.

### 7. Админка → «Грамматика»

- Вкладка (`src/components/admin/AdminGrammarTab.tsx`, `GrammarForm.tsx`, `useAdminGrammar.ts`): список тем
  со статусом «Заполнена / Пустая», поиск и фильтр по уровню, форма правки полей `body_json`
  (коротко, когда нужно — по строке, шаги образования, примеры с уровнем, исключения, ошибки, связанные темы),
  кнопки «Перегенерировать» (с подтверждением), «Добавить тему», «Удалить». Каждое действие — в журнал.
- `GET/POST /api/admin/grammar` (`functions/api/admin/grammar.ts` → `functions/_lib/grammar/admin.ts`):
  действия `add | update | regenerate | delete`, проверка slug, уровня и раздела, защита от пустого текста.
  «Перегенерировать» при неудаче ИИ возвращает `503 GRAMMAR_NOT_READY` с понятным текстом.

### 8. Версия и история

- Версия 0.6.0: `package.json`, `package-lock.json`, `src/config.ts`, `functions/_lib/config.ts`.
- `src/data/changelog.ts` — запись 0.6.0 на ru/de/en (8 пунктов), `CHANGELOG.md`, `README.md` (раздел
  «Что нового в 0.6.0» и инструкция по миграции).
- Ключи локализации: **686 / 686 / 686**, наборы совпадают, подстановки совпадают (проверено скриптом:
  0 расхождений в de и en).

---

## Файлы этапа 5

### Созданные

| Файл | Назначение |
|---|---|
| `shared/grammarTopics.ts` | Проверки, типы и общий массив 69 тем (собирается из пяти групп) |
| `shared/grammarTopicsGroup1.ts` … `Group5.ts` | Темы по группам: артикли и склонение, времена, синтаксис, наклонения и глаголы, союзы |
| `shared/grammarTopicTypes.ts` | Тип темы для файлов групп |
| `shared/grammarLinks.ts` | Проверенные ссылки на Wikibooks, DW, Goethe, DWDS; по 1–2 на тему |
| `shared/grammar.ts` | Типы: `GrammarBody`, тема, список, ответ учителя, действия админки |
| `shared/typeCore.ts`, `typeTasks.ts`, `typeTranslate.ts`, `typeWord.ts`, `typeAccount.ts` | Бывшие разделы `shared/types.ts` по смыслу (импорт остался из `types.ts`) |
| `migrations/0005_grammar.sql` | Таблица `grammar_topics` и 69 тем (без текста) |
| `functions/_lib/grammar/store.ts` | Чтение/запись тем, `body_json`, разбор, slug, заливка списка |
| `functions/_lib/grammar/seed.ts` | Список тем для автоматической заливки (копия миграции) |
| `functions/_lib/grammar/generate.ts` | Первая генерация текста ИИ, блокировка, причина «нет ИИ» |
| `functions/_lib/grammar/admin.ts` | Действия админки: add/update/regenerate/delete, разбор формы |
| `functions/_lib/validate/grammar.ts` | Проверка текста темы от ИИ (структура, slug, ссылки) |
| `functions/_lib/validate/ask.ts` | Проверка ответа учителя |
| `functions/api/grammar/topic.ts` | `GET /api/grammar/topic` |
| `functions/api/grammar/topics.ts` | `GET /api/grammar/topics` |
| `functions/api/ask.ts` | `POST /api/ask` с кэшем на 90 дней |
| `functions/api/admin/grammar.ts` | `GET/POST /api/admin/grammar` |
| `src/api/methods/grammar.ts` | Клиент: список тем, тема, вопрос |
| `src/data/grammarTermTypes.ts` | Тип записи словаря терминов |
| `src/data/grammarTerms.ts` | Поиск тем по тексту: `findGrammarTerms`, `mergeTopics`, `topicsForNotes` |
| `src/data/grammarTermsData.ts` | Сборка словаря терминов из четырёх файлов групп |
| `src/data/grammarTermsNouns.ts`, `grammarTermsVerbs.ts`, `grammarTermsSyntax.ts`, `grammarTermsStyle.ts` | Сам словарь «термин → slug» по группам тем |
| `src/components/grammar/grammarHighlight.ts` | Поиск терминов и разбиение текста на ссылки |
| `src/components/grammar/GrammarLinkedText.tsx` | Текст с кликабельными терминами |
| `src/components/grammar/GrammarTopicLinks.tsx` | Кнопки тем, которые назвал ИИ |
| `src/components/grammar/GrammarTopicView.tsx` | Карточка правила (для страницы и окна) |
| `src/components/grammar/GrammarTopicDialog.tsx` | Всплывающее окно темы |
| `src/components/grammar/GrammarProvider.tsx` | Граница справочника вокруг маршрутов, держит окно темы |
| `src/components/grammar/grammarContext.ts` | Контексты «открыть тему» и список тем |
| `src/components/grammar/useGrammar.ts` | `useGrammar().open(slug)`, `useGrammarContext()` |
| `src/components/grammar/useGrammarPopupState.ts` | Открытие, кэш показанных тем, повтор при занятой теме |
| `src/components/grammar/grammarLabels.ts` | Ключ раздела и заголовок на языке интерфейса |
| `src/components/grammar/GrammarTopicList.tsx` | Список тем: поиск, фильтр по уровню, группы |
| `src/hooks/useGrammarTopics.ts` | Список тем один раз на приложение |
| `src/hooks/useAsk.ts` | Вопрос, ответ, повтор вопроса из истории без запроса |
| `src/hooks/useAskHistory.ts` | История вопросов: localStorage и синхронизация с аккаунтом |
| `src/components/ask/AskAnswer.tsx` | Ответ учителя с примерами и ссылками на темы |
| `src/components/ask/AskHistory.tsx` | История вопросов |
| `src/pages/GrammarPage.tsx` | Страница `/grammar` и `/grammar/:slug` |
| `src/pages/AskPage.tsx` | Страница `/ask` |
| `src/hooks/useAdminGrammar.ts` | Логика вкладки «Грамматика» |
| `src/components/admin/AdminGrammarTab.tsx` | Вкладка «Грамматика» админки |
| `src/components/admin/GrammarForm.tsx` | Форма темы: названия, коротко, списки, связанные темы |
| `src/components/admin/GrammarRows.tsx` | Блоки формы: «Как образуется», «Примеры», «Типичные ошибки» |
| `src/components/admin/grammarDraft.ts` | Черновик формы темы и сборка полей запроса |
| `src/components/admin/RowsSection.tsx` | Общий блок «строки с добавить/удалить» |

### Изменённые

| Файл | Что изменилось |
|---|---|
| `shared/types.ts` | Теперь только подключение подфайлов (все прежние импорты работают) |
| `functions/_lib/config.ts` | Версия 0.6.0; `PROMPT_VERSION = '3'`; блоки `GRAMMAR` и `ASK`; `deeplUrl()` не тронут |
| `functions/_lib/prompts.ts` | `topics` в разборе, `grammarTopics` в карточке; промпты `buildGrammarPrompt`, `buildAskPrompt` |
| `functions/_lib/providers/gemini.ts`, `groq.ts`, `workersai.ts` | Задачи `grammar`, `ask` |
| `functions/_lib/validate/index.ts`, `explain.ts`, `word.ts` | Проверка `topics`/`grammarTopics` по известным slug |
| `functions/_lib/schema.ts` | Таблица `grammar_topics` и индекс |
| `functions/_lib/http.ts` | Текст `GRAMMAR_NOT_READY` на ru/de/en |
| `src/config.ts` | Версия 0.6.0; `askHistory`, `SYNC_MARKS`, `ASK_MAX_QUESTION_LENGTH`, `ASK_EXAMPLE_QUESTIONS` |
| `src/App.tsx` | `GrammarProvider` вокруг маршрутов, маршруты `/grammar`, `/grammar/:slug`, `/ask` |
| `src/api/client.ts`, `src/api/methods/admin.ts` | Методы справочника и админки |
| `src/hooks/useHistorySync.ts` | `parse` и свои отметки для каждого вида записей |
| `src/hooks/useHistory.tsx` | Передаёт `parse` и `marksKey` |
| `src/components/layout/navItems.ts`, `Sidebar.tsx` | Пункты «Грамматика» и «Спросить у AI» |
| `src/components/layout/icons.tsx` | Иконки грамматики и «Спросить у AI» |
| `src/pages/LearnPage.tsx` | Ссылка на справочник (телефон) |
| `src/pages/AdminPage.tsx` | Вкладка «Грамматика» и журнал на ней |
| `src/components/translate/ExplanationPanel.tsx` | Термины-ссылки и кнопки тем от ИИ |
| `src/components/word/WordCard.tsx` | Термины-ссылки в «Что важно знать» и кнопки тем |
| `src/lib/errors.ts` | `GRAMMAR_NOT_READY` → понятный текст |
| `src/styles/index.css` | Стили абзацев с терминами (`.linked-text`) |
| `src/locales/ru.json`, `de.json`, `en.json` | Разделы `grammar` (включая названия 69 тем), `ask`, `learn`, `admin.grammar` |
| `src/data/changelog.ts` | Запись 0.6.0 на 3 языках |
| `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md` | Версия 0.6.0, история, инструкция по миграции |

---

## Проверки

### Сборка

`npm run build` (TypeScript strict для фронта и Functions + Vite) — **проходит, 0 ошибок**;
`npm run typecheck` — без ошибок. 286 файлов ts/tsx, 227 модулей в сборке; отдельные куски:
`GrammarPage` 5,79 КБ, `AskPage` 8,14 КБ, `AdminPage` 40,45 КБ, `ResourcesPage` 2,60 КБ, `AboutPage` 2,50 КБ;
основной бандл 496,70 КБ (152,74 КБ gzip), CSS 23,38 КБ. Рост основного куска с 421 до 497 КБ —
это словарь терминов (≈30 КБ до минификации), список 69 тем (≈20 КБ: им пользуется меню и окно темы)
и новые тексты локалей; страницы грамматики, AI и админки остались отдельными кусками.
Ключи локализации: **686 / 686 / 686**, наборы и подстановки совпадают.
Пустых `TODO` и заглушек нет; список тем в `shared/…` (69), в `seed.ts` (69) и в миграции (69) совпадает — сверено скриптом.

### API — 45 проверок, все прошли

Два прогона на чистой локальной базе: **без ключей ИИ** (27 + 6 проверок) и **с локальным макетом Gemini**
(12 + 6 проверок). Итого 51 проверка, все прошли. Что проверено:

- **Без ИИ:** список тем (69, 14 разделов, все пустые), тема без ИИ — название, 2 ссылки на источники,
  `body: null`, `offlineReason: 'limit'`; 404 на неизвестную тему, 400 на неверный адрес и короткий вопрос;
  вопрос учителю без ключей → 429 `LIMIT_REACHED`; админка без входа 401, обычному пользователю 403;
  правка темы в админке (текст сохранён, `source = admin`, ссылки перезаписаны нашими, `related` отфильтрован),
  посетитель видит правку сразу; 400 на неверный уровень, пустой текст и неизвестное действие;
  «Перегенерировать» без ИИ → **503 `GRAMMAR_NOT_READY`**; запись в журнале `grammar.update`;
  `/api/health` отдаёт версию 0.6.0; **после перезапуска сервера** правка на месте (лежит в D1);
  добавление темы, дубль адреса → 400, удаление.
- **С макетом Gemini** (когда настоящих ключей нет): первое открытие темы → `source: 'ai'`, ИИ спрошен
  **1 раз**; второе открытие — тот же текст, счётчик ИИ остался 1; вопрос учителю → ИИ 1 раз,
  повтор в другом регистре → `cached: true` без запроса к ИИ; «Перегенерировать» снова спрашивает ИИ,
  заменяет правку админа новым текстом, `source` снова `ai`, посетитель видит новый текст;
  неизвестные slug от ИИ отбрасываются, ссылки на источники подставляются наши.

### Ссылки источников

Проверял 31.10.2026 запросами (без `#`-якоря). Wikibooks — все использованные страницы 200
(Verbs, The_simple_past_tense, Future_tense, Modal_auxiliary_verbs, Prefixed_verbs, Reflexive_pronouns,
Noun_gender, Noun_plurals, Declining_adjectives, Adjectives_and_Adverbs, Cases, Possessives_and_the_genitive_case,
Sentences, Polar_questions, Subordinating_conjunctions, Coordinating_conjunctions, Prepositions_and_Postpositions,
Prepositions_with_accusative_and_dative, Dative_prepositions, Imperatives, Stem-changing_verbs, Pronouns,
Personal_pronouns, Nouns, Lessons). Deutsche Welle — `de/grammatik/s-13559254`, `de/kurs/s-9367337`,
`de/uebungen/s-9277547`, `de/vokabeln/s-9277774` — 200. Goethe-Institut — 403 (закрыт для роботов),
как и на этапе 4. DWDS — 200.

### Термины

Подсветка проверена отдельно на 8 текстах (немецкие и русские объяснения, разбор, ответ учителя): 8/8 верно,
все темы угаданы, текст после разбиения совпадает с исходным символ в символ. Примеры: «Konjunktiv II» →
`konjunktiv-2`, «Präteritum … Perfekt» → обе темы по порядку, «Wechselpräpositionen» → тема предлогов,
«wenn ich Zeit hätte, würde ich kommen» → `konjunktiv-2`, обычный текст без грамматики — без ссылок.
Голые формы `würde`, `hätte`, `sollte` ссылкой не становятся (это обычные слова, а не название темы).

### Браузер

Проверять интерфейс в браузере по просьбе владельца **не стал**. Что стоит посмотреть глазами:
вкладку «Грамматика» в боковом меню и кнопку на «Учёбе» с телефона; открытие темы (первый раз — «Готовим
правило…», второй — сразу); клик по «Konjunktiv II» в разборе и в карточке слова; окно темы на телефоне
(снизу) и на компьютере; вопрос в «Спросить у AI»; вкладку «Грамматика» в админке и «Перегенерировать».

---

## Что не сделано и ограничения

- **Настоящий Gemini/Groq не проверялся** — ключей нет; проверен локальный макет и вся ветка отказа.
  Когда появится ключ, стоит один раз открыть 2–3 темы и посмотреть качество текста.
- **Сборка стала больше** (497 КБ вместо 421): словарь терминов и список тем нужны на любой странице,
  потому что меню и всплывающее окно открываются отовсюду. Если это станет проблемой, список тем можно
  грузить только при первом открытии окна (он уже грузится один раз, но при старте приложения).
- **Окно темы по центру на компьютере** (в задании — «справа»): компонент `Modal` один на весь проект
  и открывается снизу на телефоне / по центру на широком экране; телефонная версия ровно как просили.
- **Страницы Wikibooks с якорем (`#…`)**: сервер отвечает 404 на запрос с `#`, проверить якорь кодом
  нельзя. В браузере они открываются (уже используются такие адреса на этапе 4), но если ссылка
  перестанет срабатывать, поправьте её в `shared/grammarLinks.ts`.
- **Goethe-Institut для роботов закрыт (403)** — ссылки оставлены как официальные, в браузере открываются.
- **Поиск по тексту темы не ищет в уже составленном тексте** — только по трём названиям темы. Это сделано
  намеренно: у тем без текста искать в тексте нечего.
- **Первое открытие новой темы стоит один запрос к общему ключу.** Если ИИ недоступен, тема остаётся
  без текста до кнопки «Повторить позже» — так и задумано в задании.
- **Тексты тем — от ИИ**: они проверяются по структуре и по ссылкам на темы, но не по содержанию.
  Для важных тем можно вычитать текст в админке — он останется таким до «Перегенерировать».
- **История вопросов синхронизируется вместе с избранным**: если на другом устройстве нажать «Очистить»,
  старые записи удалятся через отметки удалений (общий механизм `useHistorySync`). Внутри аккаунта
  история переводов и вопросы ИИ теперь не путаются (проверка `parse` и свои отметки).
- **Миграцию `0005_grammar.sql` можно не запускать**: темы заливаются сами. Если запустить повторно —
  ничего не испортится (`INSERT OR IGNORE`).
- **Для локальной проверки** `.dev.vars` создавался временно и удалён; блок `[ai]` в `wrangler.toml`
  отключался (без `wrangler login` он не стартует) и **восстановлен из копии**, копия удалена;
  адрес Gemini в `config.ts` возвращён; папка `.wrangler` и временные скрипты удалены.
  `database_id` не менялся.

Документация: `CHANGELOG.md` — раздел 0.6.0; `README.md` — «Что нового в 0.6.0», инструкция
по миграции `0005_grammar.sql` и обновлённая схема папок; `src/data/changelog.ts` — 8 пунктов на трёх языках.

---

## Переменные окружения и настройки Cloudflare (этап 5)

Новых переменных окружения нет. Используются прежние ключи Gemini/Groq (общие или свои в профиле).
Новая таблица `grammar_topics` создаётся автоматически; список тем заливается сам, миграция —
только по желанию:

```bash
npx wrangler d1 execute yai-translator-db --remote --file=./migrations/0005_grammar.sql
```

---



# Версия 0.5.0 — этап 4: словари «как Leo» и полезные ресурсы

Дата: 30.10.2026 · Версия: **0.5.0** · Автор этапа: DeepSeek

Сделано по `tasks/STAGE4.md`. Логотип, адрес DeepL (`deeplUrl()` в `functions/_lib/config.ts`),
логика аккаунтов (`functions/_lib/auth/*`) и цепочка обычных переводчиков не менялись — только дополнены.

---

## Этап 4 — что сделано

### 1. Источники словаря (`functions/_lib/dict/` — один файл = один источник)

| Файл | Источник | Что даёт | Ключ |
|---|---|---|---|
| `wiktionary.ts` | `en.wiktionary.org/api/rest_v1/page/definition/{слово}` | значения, часть речи по 12 языкам; примеры для английских слов | — |
| `wiktionaryDe.ts` | `de.wiktionary.org/api/rest_v1/page/html/{слово}` | род (der/die/das), множественное число, падежи, формы глагола, транскрипция [IPA] | — |
| `openthesaurus.ts` | `www.openthesaurus.de/synonyme/search?q=…&format=application/json` | немецкие синонимы и близкие слова | — |
| `tatoeba.ts` | `api.tatoeba.org/v1/sentences` | настоящие предложения с переводом | — |
| `pons.ts` | `api.pons.com/v1/dictionary` | двуязычная статья DE↔RU / DE↔EN | `PONS_API_KEY` (необязательный) |
| `dwds.ts` | `dwds.de/wb/{слово}` | толкование по-немецки | — |

- Все адреса, таймауты (6 с на источник), лимиты и подпись `User-Agent` (`YAi-Translator/0.5 (+https://yai-translator.pages.dev/about)`)
  лежат в `functions/_lib/config.ts` → `DICT`.
- `dictFetch()` (в `dict/http.ts`) добавляет `User-Agent` в каждый запрос — этого требует OpenThesaurus.
- Как ответил запрос, проверялось вживую 30.10.2026 (подробности в разделе «Проверки»).

### 2. Сборка карточки

- `POST /api/dict {word, sourceLang, targetLang}` → `DictEntry` (`shared/dict.ts`):
  `{sources, senses, gender, plural, partOfSpeech, transcription, forms, synonyms, examples, definitions}`.
- Источники опрашиваются параллельно (`functions/_lib/dict/index.ts`), каждый с таймаутом 6 с.
  Результат кэшируется в D1 на 30 дней (`DICT.cacheTtlSeconds`) — это же закрывает требование
  OpenThesaurus «не больше 60 запросов в минуту». Источник без данных молча пропускается.
- `functions/api/word.ts`: карточка ИИ **дополняется** словарями — синонимы OpenThesaurus,
  переводы PONS (только если ИИ не дал значений), часть речи/род/транскрипция, если их не было,
  и список источников в `card.dictSources`. Данные ИИ не затираются.
- Фронтенд: для 1–3 слов `/api/dict` грузится **вместе** с `/api/word` (`src/hooks/useDictLookup.ts`).
  - ИИ ответил — карточка как раньше, к примерам A1–B2 добавлена вкладка **«Из жизни»** (Tatoeba),
    внизу строка «Источники: …» со ссылками и лицензиями.
  - ИИ недоступен (лимит) — показывается карточка только из словарей с пометкой
    «Без ИИ — данные словарей» (`src/components/word/DictCard.tsx`).
  - В словаре (`DictionaryPage`) карточка из словарей — запасной вариант при ошибке ИИ.

### 3. Полезные ресурсы

- `GET /api/resources` — только видимые ссылки, ответ кэшируется в D1 на 10 минут.
- Страница `/resources` (`src/pages/ResourcesPage.tsx`, ленивая): выбор языка, группы «Словари»,
  «Грамматика», «Аудирование и подкасты», «Экзамены», «Жизнь в стране»; ссылка в боковом меню и карточка в профиле.
- Таблица `resources(id, lang, category, title, url, description_ru, description_de, description_en, sort, hidden)`
  — в `functions/_lib/schema.ts` и `migrations/0004_resources.sql`. Миграция заливает **57 проверенных ссылок**:
  немецкий — 19 (4 словаря, 3 грамматики, 4 аудирования, 4 экзамена, 4 жизни), русский — 4,
  английский — 6, остальные языки — по 3.
- Админка → вкладка **«Ресурсы»**: `GET/POST /api/admin/resources` (`add`, `update`, `hide`, `show`, `move`, `delete`,
  `showInApps`), каждое действие пишется в журнал; переключатель «Показывать ресурсы в приложениях из магазинов»
  хранится в `settings` под ключом `resources_show_in_apps`.
- На странице «О приложении» — блок «Источники словаря» с лицензиями
  (Wiktionary CC BY-SA, Tatoeba CC BY 2.0 FR, OpenThesaurus CC BY-SA/LGPL, PONS, DWDS);
  ссылка на www.openthesaurus.de — обычная, без `nofollow`, как требует сервис.

---

## Файлы этапа 4

### Созданные

| Файл | Назначение |
|---|---|
| `shared/dict.ts` | Типы словарной карточки и ресурсов |
| `migrations/0004_resources.sql` | Таблица `resources` и 57 проверенных ссылок |
| `functions/_lib/dict/http.ts` | Запрос с `User-Agent` и таймаутом, разбор HTML, коды языков, части речи |
| `functions/_lib/dict/wiktionary.ts` | en.wiktionary REST: значения и часть речи для 12 языков |
| `functions/_lib/dict/wiktionaryDe.ts` | de.wiktionary: род, падежи, формы глагола, IPA |
| `functions/_lib/dict/openthesaurus.ts` | Немецкие синонимы |
| `functions/_lib/dict/tatoeba.ts` | Примеры с переводом (CC BY 2.0 FR) |
| `functions/_lib/dict/pons.ts` | PONS API (ключ необязательный) |
| `functions/_lib/dict/dwds.ts` | Толкование по-немецки |
| `functions/_lib/dict/index.ts` | Параллельный опрос, сборка карточки, ключ кэша |
| `functions/_lib/resources/store.ts` | Чтение, проверка и порядок ссылок, переключатель «в приложениях» |
| `functions/_lib/resources/admin.ts` | Действия админки с ресурсами и сброс кэша |
| `functions/api/dict.ts` | `POST /api/dict` |
| `functions/api/dict-sources.ts` | `GET /api/dict-sources` — справочник источников |
| `functions/api/resources.ts` | `GET /api/resources` |
| `functions/api/admin/resources.ts` | `GET/POST /api/admin/resources` |
| `src/api/request.ts` | Общий механизм запросов (заголовки, ошибки, cookie) |
| `src/api/methods/core.ts`, `account.ts`, `admin.ts` | Методы API по группам |
| `src/hooks/useDictLookup.ts` | Карточка из словарей параллельно с ИИ |
| `src/hooks/useLanguageSwitching.ts` | Языки, «⇄», язык карточки (вынесено из `useTranslator`) |
| `src/hooks/useExplainAndCheck.ts` | Панели «Разобрать» и «Проверить» (вынесено из `TranslatePage`) |
| `src/hooks/useDictionarySearch.ts` | Поиск в словаре (вынесено из `DictionaryPage`) |
| `src/hooks/useResources.ts` | Загрузка `/api/resources` с повтором |
| `src/hooks/useAdminResources.ts` | Логика вкладки «Ресурсы» |
| `src/components/word/DictCard.tsx` | Карточка только из словарей |
| `src/components/word/DictPanel.tsx` | Обёртка карточки словарей для словаря |
| `src/components/word/DictExamples.tsx` | Примеры «Из жизни» с подписями источников |
| `src/components/word/SourcesLine.tsx` | Строка «Источники: …» |
| `src/components/dictionary/DictionarySearchPanel.tsx` | Вкладка «Слово» в словаре |
| `src/components/resources/ResourceGroup.tsx` | Группа ссылок и описание на языке интерфейса |
| `src/components/about/DictionarySources.tsx` | Источники и лицензии на «О приложении» |
| `src/components/admin/AdminResourcesTab.tsx` | Вкладка «Ресурсы» админки |
| `src/components/admin/ResourceForm.tsx` | Форма добавления и изменения ссылки |
| `src/components/profile/ResourcesCard.tsx` | Карточка «Полезные ресурсы» в профиле |
| `src/pages/ResourcesPage.tsx` | Страница `/resources` (ленивая) |

### Изменённые

| Файл | Что изменилось |
|---|---|
| `shared/types.ts` | Подключены `shared/dict.ts`; `dictSources` в карточке; `WORD_NOT_FOUND`; кэш `dict`/`resources` |
| `functions/_lib/config.ts` | Версия 0.5.0; блоки `DICT` (все адреса и лимиты) и `RESOURCES`; `deeplUrl()` не тронут |
| `functions/_lib/env.ts`, `.dev.vars.example` | `PONS_API_KEY`, `ADMIN_LOGINS` в примере |
| `functions/_lib/http.ts` | Текст ошибки `WORD_NOT_FOUND` на ru/de/en |
| `functions/_lib/cache.ts` | Битый JSON в кэше = нет кэша |
| `functions/_lib/schema.ts` | Таблица `resources`; «already exists» больше не роняет создание схемы |
| `functions/api/word.ts` | Карточка ИИ дополняется словарями, `dictSources` |
| `src/api/client.ts` | Теперь собирает методы из `api/methods/*`, механизм в `api/request.ts` |
| `src/hooks/useTranslator.ts` | Словари параллельно с ИИ, языки — в `useLanguageSwitching` |
| `src/pages/TranslatePage.tsx` | `WordPanel` получает карточку словарей, разбор/проверка — в `useExplainAndCheck` |
| `src/pages/DictionaryPage.tsx` | Поиск — в `useDictionarySearch`, карточка словарей как запасной вариант |
| `src/pages/AdminPage.tsx` | Вкладка «Ресурсы» и журнал на ней |
| `src/pages/AboutPage.tsx` | Блок «Источники словаря» |
| `src/components/word/WordCard.tsx`, `ExamplesList.tsx` | Вкладка «Из жизни», строка источников |
| `src/components/word/WordPanel.tsx` | Карточка ИИ → карточка словарей → понятная ошибка |
| `src/components/layout/Sidebar.tsx`, `icons.tsx` | Ссылка «Ресурсы», иконки компаса и стрелок |
| `src/pages/ProfilePage.tsx` | Карточка «Полезные ресурсы» |
| `src/App.tsx` | Маршрут `/resources` |
| `src/config.ts` | Версия 0.5.0, ключ `yai.resourcesLang` |
| `src/lib/errors.ts` | `WORD_NOT_FOUND` → понятный текст |
| `src/locales/ru.json`, `de.json`, `en.json` | Разделы `dict`, `resources`, `admin.resources`, `about.*` — **по 443 ключа, наборы совпадают** |
| `src/data/changelog.ts` | Запись 0.5.0 на трёх языках |
| `package.json`, `README.md`, `CHANGELOG.md` | Версия, инструкция по PONS и миграции, история версий |

---

## Проверки

### Сборка

`npm run build` (TypeScript strict для фронта и Functions + Vite) — **проходит, 0 ошибок**;
`npm run typecheck` — без ошибок. Сборка: 193 модуля, отдельные куски `AdminPage` 28,90 КБ,
`ResourcesPage` 2,61 КБ, `AboutPage` 2,50 КБ, `ResourceGroup` 0,93 КБ; основной бандл 421,41 КБ
(131,10 КБ gzip). Ключи локализации: **443 / 443 / 443**, наборы во всех трёх файлах одинаковые.

### Проверка вживую (локальный `wrangler pages dev`, с интернетом)

Все слова из задания: **Haus, aufstehen, sich freuen, стол (ru→de), house (en→de), casa (es→de)** —
`/api/dict` отвечает 200 и отдаёт:

- **Haus**: `das`, мн. ч. `Häuser`, падежи (Nominativ/Genitiv/Dativ/Akkusativ × Singular/Plural), `[haʊ̯s]`,
  12 синонимов OpenThesaurus (Heim, Behausung, Bude …), 4 примера Tatoeba, толкования DWDS;
  источники — Wiktionary, OpenThesaurus, Tatoeba.
- **aufstehen**: формы `stehe auf / stehst auf / steht auf`, Präteritum `stand auf`, Partizip II `aufgestanden`,
  Hilfsverb `sein`, примеры и толкование DWDS.
- **sich freuen** (de.wiktionary такой страницы не имеет — 404, источник пропущен): синонимы OpenThesaurus
  («sich freuen (über)», entzückt sein …), 2 примера Tatoeba, толкование DWDS — карточка всё равно собирается.
- **стол**: примеры Tatoeba с переводом на немецкий («Стол пыльный. → Da ist Staub auf dem Tisch.»).
- **house**, **casa**: значения Wiktionary и примеры Tatoeba с переводом на немецкий.

Остальное по API — **70 проверок, все прошли**:

- `/api/dict`: 200 для шести слов выше; у каждого источника ссылка `https://…`; у каждого примера
  подпись `tatoeba`/`wiktionary` и ссылка; `auto + ru → словарь немецкий`; одинаковые языки → 400;
  пустое слово → 400; слово длиннее 60 символов → 400; неизвестное слово → 404 `WORD_NOT_FOUND`;
  повторный запрос → `cached: true`.
- `/api/word` без ключей ИИ → 429 `LIMIT_REACHED` (лимит), то есть проверен сценарий «Без ИИ».
- `/api/resources`: 200, 57 ссылок, 12 языков, все адреса `https`, описания на ru/de/en,
  у немецкого все 5 групп, скрытые ссылки не отдаются.
- Админка: без входа — 401; добавление, изменение, перестановка вверх, скрытие (скрытая ссылка
  не видна посетителям), показ, переключатель «в приложениях», удаление, запись в журнал,
  `javascript:`-адрес → 400, неизвестное действие → 400 (24 проверки).

### Ссылки ресурсов

56 из 57 ссылок ответили 200 в обычном запросе. Не открылись при автоматической проверке:

- `https://www.goethe.de/de/spr/kup/prf.html` — 403: Goethe-Institut блокирует автоматические запросы,
  в браузере сайт открывается (официальный сайт, ссылку оставили).
- `https://www.almaany.com/`, `https://suspilne.media/` — 403 на автоматический запрос (защита от ботов).
- `https://smotrim.ru/` — на этой машине не резолвится домен; в браузере сайт открывается.
- Во время проверки заменены: `rae.es` (403 для роботов) → **SpanishDict**; `trt.net.tr/turkce` (404) →
  `trt.net.tr`; добавлена Викитека (арабский) для группы «Жизнь в стране».

### Браузер

Проверять интерфейс в браузере по просьбе владельца не стал — это сделает Claude.
Возможные места для проверки глазами: карточка «Haus» без ключей ИИ (должна появиться с пометкой
«Без ИИ — данные словарей»), вкладка «Из жизни» при работающем ИИ, страница «Ресурсы», вкладка «Ресурсы» в админке.

---

## Что не сделано и ограничения

- **PONS не проверен на настоящем ключе**: ключа нет. Ветка «нет ключа» работает (источник пропускается),
  структура разбора написана по описанию API, но живого ответа я не видел. Если формат не совпадёт,
  источник молча пропускается и карточка строится без него — но разбор стоит проверить после получения ключа.
  Способ авторизации — заголовок `X-Secret` по документации PONS.
- **DWDS даёт толкование по-немецки, а не перевод**: у DWDS нет документированного API, поэтому
  разбирается только блок «Bedeutungsübersicht» статьи. Если DWDS изменит разметку, толкования пропадут,
  остальное в карточке останется.
- **`sich freuen`**: de.wiktionary не имеет страницы для словосочетаний (404), поэтому для таких слов
  нет рода/форм — остаются синонимы, примеры и толкование. Поиск по форме «sich freuen» → Wiktionary REST
  тоже не находит статью.
- **Значения Wiktionary на английском**: так устроен en.wiktionary. Для русскоязычного пользователя
  перевод даёт ИИ, а без ИИ показываются английские толкования и примеры Tatoeba с переводом.
- **Порядок ссылок в админке**: «выше/ниже» меняет `sort` с соседом в группе; после удаления ссылок
  промежутки в `sort` не пересчитываются (на порядок это не влияет).
- **Миграцию `0004_resources.sql` нужно выполнить на сайте один раз** (повторный запуск создаст дубли).
  Без неё страница «Ресурсы» пустая, но сайт работает.
- **Для локальной проверки** `.dev.vars` создавался временно и удалён; `wrangler.toml` восстановлен
  в исходном виде (`database_id` и блок `[ai]` на месте); папка `tmp` с временными скриптами удалена.

---

## Переменные окружения и настройки Cloudflare (добавлено на этапе 4)

| Переменная | Назначение |
|---|---|
| `PONS_API_KEY` | PONS API, необязательный; можно добавить и в админке («Ключи сайта») |

Новая таблица: `resources` (создаётся автоматически). Миграция с начальным набором ссылок:
`npx wrangler d1 execute yai-translator-db --remote --file=./migrations/0004_resources.sql`
(или на вкладке D1 в панели Cloudflare). Ключи Wiktionary, OpenThesaurus, Tatoeba и DWDS не нужны.

---

# Версия 0.4.0 — этап 3: все переводчики, языки, сравнение, админка, «О приложении»

Дата: 30.10.2026 · Версия: **0.4.0** · Автор этапа: DeepSeek

Сделано строго по `tasks/STAGE3.md`. Логотип (`src/components/layout/Logo.tsx`, `public/logo.svg`, иконки)
и логика аккаунтов (`functions/_lib/auth/*`) не переписывались: в `auth` только добавлены проверка
блокировки (`require.ts`, `users.ts`) и флаг `isAdmin` в профиле (`account.ts`).

---

## Этап 3 — что сделано

### 1. Новые языки (12 всего)

- `shared/languages.ts`: добавлены fr, es, it, pt, pl, nl, tr, ar. В `LanguageOption` появилось поле `rtl`,
  `deeplCode` португальского — `PT-PT`, `speechCode` — `pt-PT`, `ar-SA` и т.д. Добавлены
  `PINNED_LANGUAGE_CODES`, `textDirection()` и `groupedLanguages()`.
- `LanguageBar`: 12 языков двумя группами — сверху закреплённые de, ru, uk, en, ниже остальные.
- Восточный текст справа налево: `dir="rtl"` у поля ввода (`SourcePanel`), основного перевода (`ResultPanel`),
  альтернатив (`AlternativesList`), примеров (`ExamplesList`) и вариантов других сервисов (`OthersPanel`).
- `functions/_lib/prompts.ts`: `LANGUAGE_NAMES` для всех 12 языков на трёх языках интерфейса,
  схемы ответов ИИ расширены кодами новых языков.
- Определение языка перенесено в `shared/detect.ts` (общий файл для сайта и Functions):
  арабский — U+0600–U+06FF; ñ ¿ ¡ → es; ã õ ç → pt; ł ą ę ś ź ż ń → pl; ğ ş ı → tr;
  турецкое `İ` только с точкой или ğ/ş (обычная `I` есть и в английском); стоп-слова 25–28 на язык
  для de, en, fr, es, it, pt, nl, pl, tr. `functions/_lib/classic/detect.ts` теперь только
  переэкспортирует этот модуль.
- `src/locales/*.json`: раздел `languages` заполнен на всех трёх языках; карточка слова по-прежнему
  описывает немецкое слово (это было в промпте и не менялось).

### 2. Новые бесплатные переводчики

- **Lara Translate** — `functions/_lib/classic/lara.ts`. Работает через REST так, как описано
  в документации и в официальном SDK `@translated/lara`: `X-Lara-Date`, `Content-MD5` (первые 16 байт
  SHA-256 от тела, base64), `Authorization: Lara:<HMAC-SHA256 от "POST\n/v2/auth\n<md5>\n<json>\n<date>">`,
  затем `POST /v2/translate` с `Authorization: Bearer <token>`. Ключи: `LARA_ACCESS_KEY_ID` +
  `LARA_ACCESS_KEY_SECRET` (и `_2` … для резерва).
- `lara` добавлен в `ProviderId`, `CLASSIC_PROVIDERS` (после DeepL), `CLASSIC.order`, подписи
  (`src/lib/errors.ts`) и в проверку `/api/health?check=1`.
- **Apple Translate в браузере невозможен** — см. раздел «На будущее: Apple Translation в iOS-приложении».
- Старая кнопка «Сравнить переводчики» и `ComparePanel.tsx` удалены.

### 3. Несколько общих ключей

- `functions/_lib/keypool.ts` — список ключей сервиса: переменные Cloudflare (`GEMINI_API_KEY`,
  `_2` … `_5`, так же для Groq, DeepL, Microsoft, Google, Lara) и ключи из админки (`site_keys`,
  расшифровка AES-GCM с контекстом `site:<provider>:<id>`).
- `functions/_lib/keystate.ts` — таблица `key_state`: 429 → `exhausted_until` = 00:00 UTC,
  401/403 → `invalid`; `key_id` = первые 12 символов SHA-256, сам ключ не хранится.
- `router.ts` (Gemini/Groq) и обычные переводчики (`providers/deepl.ts`, `classic/microsoft.ts`,
  `classic/google.ts`, `classic/lara.ts`) перебирают рабочие ключи по очереди. Ключ пользователя,
  как и раньше, идёт первым.
  **Ограничения на количество ключей нет:** в админке можно добавить сколько угодно ключей на каждый
  сервис (Gemini, Groq, DeepL, Microsoft, Google, Lara) — проверка счётчика удалена.

### 4. «Как переводят другие»

- `src/components/translate/OthersPanel.tsx` + `src/hooks/useOthers.ts`. До 300 символов блок грузится
  сам после основного перевода (если настройка включена), для длинного текста — кнопка «Показать».
- У варианта: название сервиса, текст, «копировать», «озвучить», «Использовать этот вариант»
  (становится основным переводом; отмечено «Использован этот вариант»).
- `/api/compare` переписан: кэш **каждого сервиса отдельно** (ключ `compare|<сервис>|<текст>`),
  параметр `exclude` убирает сервис основного перевода.
- Настройка в профиле «Показывать другие переводчики автоматически» (по умолчанию включена,
  `localStorage` `yai.showOthers`).

### 5. Админка

- Доступ: логин из секрета `ADMIN_LOGINS` (через запятую), пароль — обычный пароль аккаунта.
  `GET /api/auth/me` отдаёт `isAdmin`; ссылка «Админка» — в профиле и внизу бокового меню.
- `/admin` — `React.lazy` (`src/pages/AdminPage.tsx`), API — `functions/api/admin/*`,
  `functions/api/admin/_middleware.ts` проверяет `requireAdmin` на всех адресах, иначе 401/403.
  Каждое действие пишется в `admin_log`.
- Вкладки: «Обзор» (пользователи, посетители по хешу IP + дата, переводы за сегодня по сервисам,
  кэш, запросы ИИ, популярные пары, SVG-график за 30 дней), «Ключи сайта», «Настройки» (дневной лимит,
  баннер на ru/de/en), «Пользователи» (блокировка, удаление), плюс журнал действий.
- Таблицы: `site_keys`, `key_state`, `stats_daily`, `visitors`, `admin_log`, `settings`,
  колонка `users.blocked` — в `functions/_lib/schema.ts` и `migrations/0003_admin.sql`.
  `schema.ts` теперь выполняет `ALTER TABLE … ADD COLUMN blocked` и пропускает «duplicate column name».
- Счётчики увеличиваются в translate/word/explain/check/compare; посетитель отмечается в `/api/health`.

### 6. «О приложении» и «Что нового»

- `/about` (`React.lazy`): логотип, описание, версия, подключённые сервисы, история версий.
- `src/data/changelog.ts` (0.4.0) + `src/data/changelogOlder.ts` (0.3.0, 0.2.0, 0.1.0) с текстами
  на ru/de/en, новые версии сверху.
- Окно «Что нового в версии X» — один раз после обновления (последняя версия в `localStorage`).
- Ссылки: карточка в профиле → «Подробнее и история версий», внизу бокового меню — «О приложении».

---

## Файлы этапа 3

### Созданные

| Файл | Назначение |
|---|---|
| `shared/detect.ts` | Определение языка для 12 языков без ИИ |
| `shared/admin.ts` | Типы админки (ключи сайта, статистика, настройки, пользователи, журнал) |
| `migrations/0003_admin.sql` | Новые таблицы и колонка `users.blocked` |
| `functions/_lib/keypool.ts` | Список ключей сервиса: переменные Cloudflare + админка |
| `functions/_lib/keystate.ts` | Состояние ключей: отдыхает / неверный, рабочие ключи по очереди |
| `functions/_lib/settings.ts` | Дневной лимит и баннер из админки, публичные настройки |
| `functions/_lib/stats.ts` | Дневная статистика и уникальные посетители |
| `functions/_lib/classic/lara.ts` | Lara Translate (подпись запроса, перевод, тест ключа) |
| `functions/_lib/admin/access.ts` | Кто админ: список логинов из `ADMIN_LOGINS` |
| `functions/_lib/admin/require.ts` | `requireAdmin` и запись в журнал |
| `functions/_lib/admin/overview.ts` | Данные вкладки «Обзор» и график 30 дней |
| `functions/_lib/admin/sitekeys.ts` | Список, проверка, добавление, удаление ключей сайта |
| `functions/api/admin/_middleware.ts` | Проверка прав на всех `/api/admin/*` |
| `functions/api/admin/overview.ts` | GET — статистика |
| `functions/api/admin/keys.ts` | GET — список ключей, POST — добавить (с проверкой) |
| `functions/api/admin/keys/[provider].ts` | DELETE — удалить ключ из админки |
| `functions/api/admin/keys/[provider]/test.ts` | POST — проверить ключ сервиса |
| `functions/api/admin/settings.ts` | GET/PUT — лимит и баннер |
| `functions/api/admin/users.ts` | GET — список, POST — block/unblock/delete |
| `functions/api/admin/log.ts` | GET — журнал действий |
| `functions/api/site-settings.ts` | Публичные баннер и лимит для всех посетителей |
| `src/components/translate/OthersPanel.tsx` | Блок «Как переводят другие» |
| `src/hooks/useOthers.ts` | Загрузка вариантов, «Показать», повтор, выбор варианта |
| `src/pages/AboutPage.tsx` | Страница «О приложении» (ленивая) |
| `src/pages/AdminPage.tsx` | Админка (ленивая) |
| `src/components/about/ServicesStatus.tsx` | Сервисы с проверкой и список истории версий |
| `src/components/admin/AdminChart.tsx` | График за 30 дней на SVG |
| `src/components/admin/AdminOverviewTab.tsx` | Вкладка «Обзор» |
| `src/components/admin/AdminKeysTab.tsx` | Вкладка «Ключи сайта» |
| `src/components/admin/AddSiteKeyForm.tsx` | Форма добавления ключа |
| `src/components/admin/AdminSettingsTab.tsx` | Вкладка «Настройки» |
| `src/components/admin/AdminUsersTab.tsx` | Вкладка «Пользователи» |
| `src/components/admin/AdminLog.tsx` | Журнал действий |
| `src/hooks/useAdminKeys.ts` | Логика вкладки «Ключи сайта» |
| `src/components/layout/AnnouncementBanner.tsx` | Баннер-объявление с крестиком |
| `src/components/layout/WhatsNewDialog.tsx` | Окно «Что нового» один раз после обновления |
| `src/data/changelog.ts` | История версий (0.4.0 + старые) |
| `src/data/changelogOlder.ts` | Версии 0.3.0, 0.2.0, 0.1.0 |

### Изменённые

| Файл | Что изменилось |
|---|---|
| `shared/languages.ts` | 12 языков, `rtl`, закреплённые языки, `textDirection`, `groupedLanguages` |
| `shared/types.ts` | `lara` в провайдерах, `isAdmin`, коды `FORBIDDEN`/`ACCOUNT_BLOCKED`, `exclude` в сравнении; типы админки вынесены в `shared/admin.ts` и экспортируются дальше |
| `functions/_lib/config.ts` | Версия 0.4.0, `LARA`, `KEY_POOL` (без ограничения ключей), `ADMIN` |
| `functions/_lib/env.ts` | `LARA_ACCESS_KEY_ID`, `LARA_ACCESS_KEY_SECRET`, `ADMIN_LOGINS` |
| `functions/_lib/schema.ts` | Новые таблицы; поштучное выполнение с пропуском существующей колонки |
| `functions/_lib/http.ts` | Тексты `FORBIDDEN` и `ACCOUNT_BLOCKED` |
| `functions/_lib/router.ts` | Общие ключи Gemini/Groq через пул; состояние ключа по коду ответа |
| `functions/_lib/classic/index.ts` | `lara` в цепочке; настройка проверяется через пул |
| `functions/_lib/classic/detect.ts` | Переэкспорт `shared/detect.ts` |
| `functions/_lib/classic/microsoft.ts`, `google.ts` | Перебор ключей пула, отметки 429/401/403 |
| `functions/_lib/providers/deepl.ts` | Пул ключей DeepL (в т.ч. PT-PT как цель, PT как источник) |
| `functions/_lib/prompts.ts` | 12 языков на трёх языках интерфейса |
| `functions/_lib/usage.ts` | Дневной лимит берётся из настроек админки |
| `functions/_lib/checks/*` | Проверка Lara; Gemini/Groq/обычные — первым рабочим ключом |
| `functions/_lib/auth/account.ts` | `isAdmin` в профиле |
| `functions/_lib/auth/require.ts` | Отказ заблокированному аккаунту, удаление его сессий |
| `functions/_lib/auth/users.ts` | Поле `blocked`, `setUserBlocked`, `deleteUser`, счётчики для статистики |
| `functions/api/health.ts` | Провайдеры из пула, отметка посетителя, лимит из настроек |
| `functions/api/compare.ts` | Кэш по каждому сервису, `exclude`, счётчик |
| `functions/api/translate.ts`, `word.ts`, `explain.ts`, `check.ts` | Счётчики статистики |
| `src/config.ts` | Версия, ключи localStorage, `OTHERS_AUTO_MAX_CHARS` |
| `src/api/client.ts` | Методы админки и настроек сайта; GET без тела |
| `src/lib/storage.ts` | Добавлен `removeStorage` |
| `src/lib/errors.ts` | Подпись Lara, тексты `FORBIDDEN` / `ACCOUNT_BLOCKED` |
| `src/lib/accountError.ts` | Новые коды ошибок |
| `src/App.tsx` | Маршруты `/about` и `/admin` через `React.lazy` |
| `src/components/translate/LanguageBar.tsx` | 12 языков, группы |
| `src/components/translate/SourcePanel.tsx` | Направление текста |
| `src/components/translate/ResultPanel.tsx` | RTL перевода, слот для других переводчиков, кнопка сравнения убрана |
| `src/components/translate/AlternativesList.tsx` | Направление текста |
| `src/components/word/ExamplesList.tsx` | Направление текста |
| `src/pages/TranslatePage.tsx` | Блок «Как переводят другие», выбор варианта |
| `src/components/profile/SettingsCard.tsx` | Переключатель «Показывать другие переводчики автоматически» |
| `src/components/profile/SiteServicesCard.tsx` | Использует общий `ServicesStatus` |
| `src/components/profile/AboutCard.tsx` | Ссылки на «О приложении» и «Админку» |
| `src/components/layout/Sidebar.tsx` | Ссылки «О приложении» и «Админка» внизу меню |
| `src/components/layout/AppShell.tsx` | Баннер и окно «Что нового» |
| `src/components/layout/icons.tsx` | Иконка «О приложении» |
| `src/components/keys/KeyStatus.tsx` | Показ причины проверки |
| `src/locales/ru.json`, `de.json`, `en.json` | Разделы `others`, `about`, `admin`, настройка профиля, 12 языков — **431 ключ в каждом, наборы совпадают** |
| `package.json`, `src/config.ts`, `functions/_lib/config.ts` | Версия 0.4.0 |
| `README.md`, `CHANGELOG.md`, `src/data/changelog.ts` | Инструкции, история версий |

---

## Проверки

Команды: `npm run build` (TypeScript strict + Vite) — **проходит, 0 ошибок**;
`npm run typecheck` — без ошибок. Сборка: 172 модуля, админка и «О приложении» — отдельные куски
(`AdminPage` 19,39 КБ, `AboutPage` 1,39 КБ), основной бандл 399,57 КБ (124,95 КБ gzip).

Локальный сервер: `npx wrangler pages dev dist --port 8791` с `.dev.vars`
(`KEY_ENCRYPTION_SECRET`, `ADMIN_LOGINS=admin.test`) и двумя фальшивыми ключами
`MICROSOFT_TRANSLATOR_KEY` / `GOOGLE_TRANSLATE_KEY` для проверки пула.

**API — 69 проверок, все прошли** (скрипты проверки удалены после прогона):

- `/api/health`: версия 0.4.0, в списке есть `lara`, Microsoft и Google видны через пул ключей.
- Регистрация двух аккаунтов; `me`: `isAdmin=false` у обычного, `isAdmin=true` у логина из `ADMIN_LOGINS`.
- `/api/admin/*` без входа → 401, обычным пользователем → 403 (`overview`, `keys`, `users`, `settings`).
  GET-запросы без тела работают (нашлась и исправлена ошибка: клиент отправлял тело в GET).
- «Обзор»: пользователи по периодам, посетитель за день, график 30 точек.
- «Ключи сайта»: ключ Cloudflare виден как `••••1234`; неверный ключ Gemini не сохраняется (`KEY_NO_ACCESS` 422);
  Lara без секрета → 400; маски и источники верные.
- Фейковый ключ Microsoft получил 401 → в `key_state` записан `invalid=1` (`Microsoft Translator 401`),
  в админке «Неверный», `/api/health?check=1` больше его не использует, «Проверить» показывает настоящую
  причину отказа (а не «ключ не задан»). **Отдыхающие и неверные ключи пропускаются** — подтверждено.
- «Настройки»: лимит 7 сохраняется и виден в `/api/health` и `/api/site-settings`; баннер доходит
  до публичного адреса; лимит −5 → 400; «по умолчанию» возвращает 40.
- «Пользователи»: список, блокировка (сессии закрываются, вход → `ACCOUNT_BLOCKED`), разблокировка,
  себя заблокировать нельзя (403), удаление, журнал действий заполняется.
- Автоопределение языка: перевод `Dzień dobry…` → `detectedLang: pl`, `El tiempo…` → `es`,
  `Olá…` → `pt`, `Merhaba…` → `tr`, `مرحبا…` → `ar` (перевод через MyMemory настоящий).
- Определение языка отдельным тестом: **12 из 12** языков; короткие слова (`Haus`, `Straße`, `¿Qué?`,
  `Łódź`, `İstanbul`) не ломают его.
- `/api/compare`: только подключённые сервисы, `exclude` убирает основной, кэш на каждый сервис отдельно.

**Браузер (chromium, локальный сервер):** страница «О приложении» показывает логотип, сервисы
(в том числе Lara) и историю 0.4.0 → 0.1.0; окно «Что нового в версии 0.4.0» открывается один раз;
перевод с 12 языками и группами; профиль под админом с кнопкой «Админка»; вкладка «Ключи сайта»
(ключ Cloudflare с маской, «Неверный», «Последняя ошибка»), «Настройки» (лимит, баннер, сохранение,
журнал). Тёмная тема и русский интерфейс — как раньше.

---

## Что не сделано и ограничения

- **Живой перевод через Lara не прогонялся** — нет пары ключей. Схема подписи взята из официального
  SDK (`src/net/lara/client.ts`: HMAC-SHA256, `Content-MD5` от первых 16 байт SHA-256, заголовок
  `Authorization: Lara:…`), поэтому она соответствует документации; ветка отказа (401/429/сеть)
  обрабатывается как у остальных сервисов.
- **Настоящие ключи Gemini / Groq / DeepL / Microsoft / Google тоже не проверялись** — их нет.
  Проверены «ключ неверный», «ключ отдыхает» и «ключ не задан»; ответы настоящих сервисов стоит
  один раз прогнать после добавления ключей.
- **Добавление рабочего ключа через админку end-to-end не прогонено** по той же причине:
  проверена вся ветка отказа (422, фиктивные ключи получают 401) и то, что успешное сохранение требует
  проверки. Ограничения по количеству ключей нет ни в API, ни в интерфейсе.
- **Workers AI и M2M100** проверены только в ветке «не настроено»: локально нет привязки `AI`
  без `wrangler login`.
- **Окно «Что нового»** показывается один раз на устройство (версия в `localStorage`) — так и задумано.
- **Статистика посетителей** считается по отметке в `/api/health`: если браузер не запрашивал `/api/health`,
  посетитель за день не учтён.
- Для локальной проверки блок `[ai]` в `wrangler.toml` временно отключался (нужен `wrangler login`).
  **После проверки `wrangler.toml` восстановлен из копии, копия удалена**; `.dev.vars` и папка `tmp`
  с временными скриптами тоже удалены.

---

## На будущее: Apple Translation в iOS-приложении

На сайте Apple Translate недоступен: у Apple **нет веб-API** для перевода. Есть только встроенный
перевод в приложениях: фреймворк **Translation** (SwiftUI `translationTask`, `TranslationSession`)
в iOS 18 и новее, он работает на устройстве и требует установленного языкового пакета.
Когда проект на этапе 4 соберётся на Capacitor, перевод через Apple можно добавить **отдельным
нативным плагином** (Swift-модуль с `TranslationSession`), который канал Capacitor вызывает из JS.
Тогда в `CLASSIC_PROVIDERS` появится ещё один сервис `apple`, доступный только в iOS-приложении,
а на сайте его просто не будет. Пока ничего не подключаю: сайту Apple предложить нечего.

---

## Переменные окружения и настройки Cloudflare (добавлено на этапе 3)

| Переменная | Назначение |
|---|---|
| `ADMIN_LOGINS` | Логины админов через запятую. Без него админки нет ни у кого |
| `LARA_ACCESS_KEY_ID`, `LARA_ACCESS_KEY_SECRET` | Lara Translate |
| `MICROSOFT_TRANSLATOR_KEY`, `MICROSOFT_TRANSLATOR_REGION` | Microsoft Translator |
| `GOOGLE_TRANSLATE_KEY` | Google Translate |
| `GEMINI_API_KEY_2 … _5`, `GROQ_API_KEY_2 … _5`, `DEEPL_API_KEY_2 … _5`, `MICROSOFT_TRANSLATOR_KEY_2 …`, `GOOGLE_TRANSLATE_KEY_2 …`, `LARA_ACCESS_KEY_ID_2` / `_SECRET_2` | Резервные ключи |

Ключи можно не заводить в переменных, а добавлять в админке (вкладка «Ключи сайта», количество
не ограничено): они хранятся в `site_keys` зашифрованными и требуют `KEY_ENCRYPTION_SECRET`.
Миграция: `npx wrangler d1 execute yai-translator-db --remote --file=./migrations/0003_admin.sql`
(таблицы и так создаются автоматически).

---

# Отчёт по этапу 1

Дата: 30.10.2026 · Версия: **0.1.0**

## Что сделано

Полностью собран первый этап YAi Translator: сайт-переводчик, словарь и учебник
немецкого с бэкендом на Cloudflare Pages Functions, базой D1 и установкой как PWA.
Реализованы все функции из раздела «Этап 1» задания. Этапы 2–4 не затрагивались:
«Учёба» и «Разговор» показывают экран «Скоро».

### Фронтенд

- Экран «Перевод»: ввод текста с умлаутами, выбор языков, автоопределение,
  обмен языками, задержка 600 мс, голосовой ввод, озвучка, копирование, очистка.
- Карточка слова: значения, цветной артикль, множественное число, четыре падежа,
  спряжение (Präsens, Präteritum, Perfekt, haben/sein), управление, примеры A1–B2
  с озвучкой, синонимы, антонимы, устойчивые выражения.
- Перевод фраз: основной вариант и альтернативы (нейтрально / разговорно / официально).
- Панели «Разобрать» и «Проверить мой немецкий».
- История последних 50 переводов и избранное в `localStorage`, поиск слова в словаре.
- Профиль: язык интерфейса, тема, свои ключи Gemini/Groq, установка PWA, состояние сервисов.
- Окно «Подключите свой бесплатный ключ» с мастером, ссылками и проверкой ключа.
- Адаптивная вёрстка: нижние вкладки на телефоне, боковое меню на широком экране.
- Локализация на русский, немецкий и английский (`src/locales/*.json`, по 199 ключей,
  наборы ключей и подстановки совпадают).
- PWA: manifest, service worker, иконки, офлайн-оболочка, офлайн-история и избранное.

### Бэкенд

- Эндпоинты `/api/translate`, `/api/word`, `/api/explain`, `/api/check`,
  `/api/health`, `/api/key-test`; общий CORS-middleware.
- Цепочка: кэш D1 → ключ пользователя → Gemini → Groq → DeepL (только перевод) →
  Workers AI → `LIMIT_REACHED`.
- Строгий разбор JSON от ИИ с приведением к типам и переходом к следующему провайдеру.
- Дневной лимит по хешу IP (40 запросов) и кэш ответов на 30 дней в D1.
- Тексты ошибок и сообщения проверки ключа на трёх языках, понятные пользователю.
- Миграция `migrations/0001_init.sql` с таблицами `cache` и `usage`.

---

## Созданные и изменённые файлы

### Корень

| Файл | Назначение |
|---|---|
| `package.json` | Зависимости и команды, версия 0.1.0 |
| `vite.config.ts` | React, PWA, прокси `/api` на локальный wrangler |
| `tailwind.config.js`, `postcss.config.js` | Стили, шрифт Inter, цвета тем |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.functions.json`, `tsconfig.node.json` | Строгая проверка типов фронта и функций |
| `wrangler.toml` | Pages, D1 `DB`, Workers AI `AI` |
| `.dev.vars.example` | Пример локальных секретов |
| `.gitignore` | `node_modules`, `dist`, `.dev.vars`, `.wrangler` |
| `index.html` | Метатеги, шрифт, тема без вспышки |
| `README.md` | Инструкция для владельца: запуск, ключи, деплой, PWA |
| `REPORT.md`, `CHANGELOG.md` | Отчёт и история версий |

### Общее

| Файл | Назначение |
|---|---|
| `shared/types.ts` | Все типы API и данных |
| `shared/languages.ts` | Единый список языков (добавляется одной строкой) |

### Бэкенд

| Файл | Назначение |
|---|---|
| `functions/_lib/config.ts` | Модели, лимиты, таймауты, порядок провайдеров |
| `functions/_lib/env.ts` | Типы окружения и байндингов |
| `functions/_lib/http.ts` | JSON-ответы, ошибки, CORS, заголовки |
| `functions/_lib/request.ts` | Проверка входа и ключ кэша |
| `functions/_lib/utils.ts` | Хеши, таймауты, разбор JSON |
| `functions/_lib/cache.ts` | Кэш ответов в D1 |
| `functions/_lib/usage.ts` | Дневной лимит по IP |
| `functions/_lib/prompts.ts` | Все промпты ИИ |
| `functions/_lib/router.ts` | Цепочка провайдеров |
| `functions/_lib/validate/*` | Проверка ответов: перевод, слово, разбор, проверка |
| `functions/_lib/providers/gemini.ts` | Gemini |
| `functions/_lib/providers/groq.ts` | Groq |
| `functions/_lib/providers/deepl.ts` | DeepL Free |
| `functions/_lib/providers/workersai.ts` | Cloudflare Workers AI |
| `functions/_lib/providers/types.ts` | Общий интерфейс провайдера |
| `functions/api/translate.ts` | Перевод фразы |
| `functions/api/word.ts` | Карточка слова |
| `functions/api/explain.ts` | Разбор грамматики |
| `functions/api/check.ts` | Проверка немецкого |
| `functions/api/health.ts` | Состояние сервиса |
| `functions/api/key-test.ts` | Проверка ключа пользователя |
| `functions/api/_middleware.ts` | CORS для `/api/*` |
| `migrations/0001_init.sql` | Схема D1 |

### Фронтенд

| Файл | Назначение |
|---|---|
| `src/main.tsx` | Точка входа и провайдеры |
| `src/App.tsx` | Маршруты |
| `src/i18n.ts` | Настройка i18next |
| `src/config.ts` | Настройки клиента и ключи localStorage |
| `src/api/client.ts` | Все запросы к API |
| `src/lib/*` | Ошибки, подписи, localStorage, буфер обмена, классы |
| `src/hooks/*` | Тема, настройки, история, перевод, озвучка, сеть, установка, ключи |
| `src/pages/*` | Перевод, Словарь, Учёба, Разговор, Профиль |
| `src/components/ui/*` | Кнопки, карточки, окна, панели, спиннеры |
| `src/components/layout/*` | Каркас, меню, вкладки, логотип, тема, язык, «Скоро» |
| `src/components/translate/*` | Языки, ввод, результат, альтернативы, разбор, проверка |
| `src/components/word/*` | Карточка слова, значения, склонение, спряжение, примеры |
| `src/components/dictionary/HistoryRow.tsx` | Строка истории и избранного |
| `src/components/profile/*` | Настройки, ключи, установка, о приложении |
| `src/components/limit/LimitDialog.tsx` | Мастер подключения ключа |
| `src/locales/ru.json`, `de.json`, `en.json` | Тексты интерфейса |
| `src/styles/index.css` | Tailwind, CSS-переменные тем, анимации |
| `src/types/speech.d.ts` | Типы Web Speech API |

### Прочее

| Файл | Назначение |
|---|---|
| `scripts/generate-icons.mjs` | Генератор PNG-иконок без сторонних библиотек |
| `public/favicon.svg` | Иконка сайта |
| `public/icons/*.png` | Иконки 192, 512, maskable и Apple |

---

## Проверки

Запускалось:

```bash
npm install
npm run icons
npm run typecheck
npm run build
npx wrangler pages dev dist --port 8788
```

Результат:

- `npm install` — 448 пакетов, без ошибок (npm предупредил, что install-скрипты
  esbuild/workerd не подтверждены; сборка и wrangler при этом работают).
- `npm run icons` — созданы четыре PNG.
- `npm run typecheck` — без ошибок.
- `npm run build` — успешно, 138 модулей, JS 324,96 КБ (102,81 КБ gzip),
  CSS 19,54 КБ, service worker и manifest созданы (365,14 КБ в precache).
- Локальный бэкенд: `/api/health` вернул `200` и корректные данные;
  `/api/translate` без ключей вернул `429 LIMIT_REACHED` с русским текстом;
  `OPTIONS` вернул `204` с CORS-заголовками; `/api/key-test` с неверным ключом
  вернул `200 {"ok":false}` без падения.
- В браузере проверены экраны «Перевод», «Словарь», «Профиль»: интерфейс
  отрисовывается, окно подключения ключа открывается при `LIMIT_REACHED`,
  здоровье сервиса подгружается в профиль.
- Проверены тёмная тема и немецкий интерфейс профиля: подписи и кнопки
  отображаются на немецком, цвета темы применяются ко всем блокам.

---

## Что не проверено и известные ограничения

- **Живые переводы не проверялись**: у автора сборки нет ключей Gemini, Groq,
  DeepL и доступа к Workers AI. Проверена вся цепочка ошибок и валидации, но не
  реальные ответы моделей. После добавления ключей стоит прогнать несколько слов,
  фраз, разбор и проверку.
- **`database_id` в `wrangler.toml` — заглушка** `00000000-0000-0000-0000-000000000000`.
  Его нужно заменить после `npx wrangler d1 create yai-translator-db`.
- **Локальный `npm run dev:api` требует `npx wrangler login`**, потому что Workers AI
  не работает полностью локально. Это описано в README.
- **Миграция D1 на сайте не выполнялась** — нет доступа к аккаунту Cloudflare.
  Без миграции приложение работает, но кэш и дневной лимит отключаются.
- **Установка на реальные iPhone/Android не проверялась** (нет устройств под рукой).
  Manifest, service worker и иконки собраны корректно.
- **DeepL** участвует только в обычном переводе, как и требовалось; для карточек,
  разбора и проверки он не используется.
- **Голосовой ввод** зависит от браузера. На iPhone работает в Safari, в некоторых
  браузерах недоступен — интерфейс показывает понятное сообщение.
- **Этапы 2–4 не реализованы** намеренно.

---

## Переменные окружения и настройки Cloudflare

Секреты (не попадают в git):

| Переменная | Где взять | Обязательность |
|---|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Основной провайдер |
| `GROQ_API_KEY` | https://console.groq.com/keys | Запасной провайдер |
| `DEEPL_API_KEY` | https://www.deepl.com/pro-api (Free) | Только обычный перевод |

Локально — файл `.dev.vars` (пример в `.dev.vars.example`).
На Cloudflare Pages — **Settings → Variables and Secrets**, значения зашифровать.
Для CLI: `npx wrangler pages secret put ИМЯ --project-name yai-translator`.

Привязки:

- D1: переменная **DB**, база `yai-translator-db`, миграция `migrations/0001_init.sql`.
- AI: переменная **AI** (Cloudflare Workers AI).
- Переменная сборки: `NODE_VERSION=22`.

Клиентская переменная (необязательная): `VITE_API_BASE` — адрес API для будущих
приложений Capacitor. Пустое значение означает «тот же домен».

---

## Что менять в одном месте

- Модели, лимиты, таймауты, порядок провайдеров — `functions/_lib/config.ts`.
- Промпты — `functions/_lib/prompts.ts`.
- Языки — `shared/languages.ts`.
- Тексты — `src/locales/*.json`.
- Задержка перевода и лимиты истории — `src/config.ts`.

---

## Проверка и правки Claude (30.10.2026)

Код проверен, сборка и проверка типов проходят. Исправлено:

1. **Модели Gemini** (`functions/_lib/config.ts`). Google больше не выдаёт модели 2.5 новым ключам.
   Теперь цепочка `gemini-3.5-flash-lite` → `gemini-3.8-flash` → `gemini-2.5-flash`, лимит токенов 8192
   (модели 3.x тратят токены на «размышления»).
2. **Ключ Gemini передаётся в заголовке** `x-goog-api-key`, а не в адресе запроса (`providers/gemini.ts`, `api/key-test.ts`).
3. **DeepL**: с ноября 2025 ключ принимается только в заголовке `Authorization: DeepL-Auth-Key …`.
   Старый способ `auth_key` в теле запроса перестал работать (`providers/deepl.ts`).
4. **Обход дневного лимита закрыт.** Раньше любой мог прислать фальшивый `X-User-Gemini-Key`,
   и запрос уходил на общие ключи без счётчика. Теперь лимит считается в момент перехода к общим ключам
   (`usage.ts` → `createLimitGuard`, `router.ts` → `beforeShared`, все 4 эндпоинта).
5. **`wrangler.toml`**: блок D1 с нулевым ID закомментирован, иначе первый деплой на Cloudflare падает.
   Включим после создания базы.
6. **PWA**: запросы `/api/*` исключены из офлайн-подмены страницы (`navigateFallbackDenylist`).

---

## Обычные переводчики без ИИ (30.10.2026, Claude)

Добавлена папка `functions/_lib/classic/`: один файл на сервис.

| Сервис | Ключ | Бесплатно |
|---|---|---|
| DeepL | `DEEPL_API_KEY` | 500 000 символов/мес |
| Microsoft Translator | `MICROSOFT_TRANSLATOR_KEY` + `MICROSOFT_TRANSLATOR_REGION` | 2 млн символов/мес (Azure просит карту) |
| Google Translate | `GOOGLE_TRANSLATE_KEY` | 500 000 символов/мес (Google Cloud просит карту) |
| MyMemory | не нужен (`MYMEMORY_EMAIL` поднимает лимит) | 5 000 → 50 000 символов/день |
| M2M100 (открытая модель Meta в Cloudflare) | не нужен | в пределах лимита Workers AI |

Порядок в `/api/translate`: кэш → Gemini/Groq (с альтернативами) → DeepL → Microsoft → Google → MyMemory →
Workers AI → M2M100. Обычные переводчики не тратят дневной лимит ИИ.
Для одного слова, если ИИ исчерпан, фронтенд показывает простой перевод (`mode: 'classic'`) вместо окна лимита.
Языки для сервисов без автоопределения угадываются в `classic/detect.ts`.

---

## Версия 0.3.0 — этап 2: аккаунт, ключи в аккаунте, проверка сервисов (30.10.2026, DeepSeek)

Дата: 30.10.2026 · Версия: **0.3.0**. Логика перевода (`functions/api/translate.ts`, `compare.ts`,
`functions/_lib/classic/*`) не менялась; в `translate.ts` изменена только строка получения ключей
(`getUserKeys` → `await resolveUserKeys`). Вход через Google/Apple и админка, как и просили, не делались.

### Созданные файлы

| Файл | Назначение |
|---|---|
| `migrations/0002_accounts.sql` | Таблицы `users`, `sessions`, `user_keys`, `user_items`, `login_attempts` |
| `functions/_lib/auth/password.ts` | PBKDF2-SHA256 100 000 итераций, соль 16 байт, сравнение за постоянное время |
| `functions/_lib/auth/session.ts` | Токен 32 байта, в базе только SHA-256, cookie `yai_session`, продление, список устройств |
| `functions/_lib/auth/crypto.ts` | AES-GCM для ключей ИИ, секрет `KEY_ENCRYPTION_SECRET`, `last4` |
| `functions/_lib/auth/ratelimit.ts` | 10 попыток входа/регистрации с одного IP за 15 минут (IP только хешем) |
| `functions/_lib/auth/validate.ts` | Правила логина и пароля, подпись устройства по User-Agent |
| `functions/_lib/auth/users.ts` | Создание пользователя, вход, смена пароля |
| `functions/_lib/auth/keys.ts` | Чтение, сохранение, удаление ключей; `resolveUserKeys` для эндпоинтов |
| `functions/_lib/auth/account.ts` | Сборка профиля для `/api/auth/me` |
| `functions/_lib/auth/require.ts` | Требует вход, иначе `UNAUTHORIZED` / `SESSION_EXPIRED` |
| `functions/_lib/response.ts` | JSON-ответ вместе с `Set-Cookie` |
| `functions/_lib/keytest.ts` | Общий код проверки ключа Gemini/Groq (вынесен из `key-test.ts`) |
| `functions/_lib/checks/index.ts` | Параллельная проверка сервисов и кэш в D1 на 10 минут |
| `functions/_lib/checks/ai.ts` | Проверка Gemini, Groq, Workers AI |
| `functions/_lib/checks/translators.ts` | Проверка DeepL, Microsoft, Google, MyMemory, M2M100 |
| `functions/_lib/checks/messages.ts` | Тексты причин на ru/de/en |
| `functions/api/auth/register.ts`, `login.ts`, `logout.ts`, `logout-all.ts`, `me.ts`, `password.ts` | Эндпоинты аккаунта |
| `functions/api/keys/[provider].ts` | `PUT` (проверка → шифрование → сохранение) и `DELETE` |
| `functions/api/keys/[provider]/test.ts` | `POST` — проверка сохранённого ключа |
| `functions/api/keys/_guard.ts` | Провайдер из адреса, вход, включённое хранение ключей |
| `functions/api/sync.ts` | `GET ?since=` и `PUT` для избранного и истории |
| `src/hooks/useAccount.tsx` | Контекст входа: `login`, `register`, `logout`, `logoutAll`, `changePassword` |
| `src/hooks/useKeyWizard.ts` | Логика мастера ключа: проверка, сохранение, повторная проверка, удаление |
| `src/hooks/useHistorySync.ts` | Обмен избранным/историей раз в минуту и после изменений |
| `src/lib/sessionToken.ts` | Токен в localStorage для приложений + `Authorization` |
| `src/lib/accountError.ts` | Понятные тексты ошибок входа, ключей и синхронизации |
| `src/lib/accountKeys.ts` | Где лежит ключ (в аккаунте или на устройстве) и маска `••••1234` |
| `src/lib/syncTombstones.ts` | Список удалений, которые ещё не дошли до сервера |
| `src/components/keys/KeyWizard.tsx` | Общий мастер ключа (профиль и окно лимита) |
| `src/components/keys/KeyStatus.tsx` | ✅ «работает, ответ за N мс» / ❌ с причиной |
| `src/components/keys/keyLinks.ts` | Ссылки на страницы создания ключа и три шага |
| `src/components/profile/AccountCard.tsx` | Карточка «Аккаунт»: вход/регистрация или логин и устройства |
| `src/components/profile/AccountForm.tsx` | Вкладки «Вход» / «Регистрация» |
| `src/components/profile/PasswordField.tsx` | Поле пароля с кнопкой «показать пароль» |
| `src/components/profile/ChangePasswordForm.tsx` | Смена пароля |
| `src/components/profile/SessionList.tsx` | Список устройств с пометкой «это устройство» |
| `src/components/profile/SiteServicesCard.tsx` | Сервисы сайта с пометкой «ИИ» / «Переводчик» и кнопкой проверки |

### Изменённые файлы

| Файл | Что изменилось |
|---|---|
| `shared/types.ts` | Типы аккаунта, ключей, синхронизации, `ServiceCheck`, новые коды ошибок |
| `functions/_lib/config.ts` | Версия 0.3.0, блоки `AUTH` и `HEALTH_CHECK` (все лимиты в одном месте) |
| `functions/_lib/env.ts` | `KEY_ENCRYPTION_SECRET` |
| `functions/_lib/http.ts` | Тексты новых ошибок на ru/de/en; `getUserKeys` → `getHeaderKeys`; CORS: PUT/DELETE/Authorization |
| `functions/_lib/schema.ts` | Пять новых таблиц создаются автоматически |
| `functions/api/key-test.ts` | Использует общий `keytest.ts` |
| `functions/api/health.ts` | `?check=1`, `checks`, `checksCached`, `keysStorageEnabled` |
| `functions/api/translate.ts`, `word.ts`, `explain.ts`, `check.ts` | Ключи берутся через `await resolveUserKeys(...)` (только эта строка) |
| `src/api/client.ts` | `credentials: 'include'`, `Authorization`, все новые методы |
| `src/config.ts` | Версия, ключи localStorage для сессии и синхронизации, интервал 60 с |
| `src/main.tsx` | `AccountProvider` вокруг `HistoryProvider` |
| `src/hooks/useSettings.tsx` | Добавлен `removeKeys` |
| `src/hooks/useKeyTest.ts` | Возвращает причину от сервера и время ответа |
| `src/hooks/useHistory.tsx` | Синхронизация с аккаунтом, если пользователь вошёл |
| `src/pages/ProfilePage.tsx` | Порядок карточек по заданию; сетка без переполнения на телефоне |
| `src/components/profile/KeysCard.tsx` | Два мастера вместо старых полей |
| `src/components/profile/AboutCard.tsx` | Только лимиты, версия и приватность (сервисы ушли в `SiteServicesCard`) |
| `src/components/limit/LimitDialog.tsx` | Использует общий `KeyWizard` |
| `src/lib/clipboard.ts` | `pasteFromClipboard()` с try/catch для iPhone |
| `src/locales/ru.json`, `de.json`, `en.json` | Разделы `account`, `keys`, `services`; по 288 ключей в каждом, наборы совпадают |
| `package.json`, `.dev.vars.example`, `README.md`, `CHANGELOG.md` | Версия, секрет `KEY_ENCRYPTION_SECRET`, инструкции |

### Что проверено

Команды: `npm run build` (TypeScript strict + Vite) — проходит, 0 ошибок.
Для проверки API временно убрал блок `[ai]` из `wrangler.toml` (Workers AI требует
`wrangler login`, которого в этой среде нет); **после проверки `wrangler.toml` восстановлен
из копии без изменений — `[ai]`, `database_id` и кодировка на месте**, `.dev.vars` удалён.

Скриптом через настоящий `wrangler pages dev` прошли **31/31** проверка:

- регистрация (ответ 200, токен 64 символа, cookie `HttpOnly; Secure; SameSite=Lax`, логин в нижнем регистре);
- повторный логин → `LOGIN_TAKEN` 409; короткий пароль → `PASSWORD_TOO_SHORT`; плохой логин → `LOGIN_INVALID`;
- неверный пароль и неверный логин одинаково → `INVALID_CREDENTIALS` 401;
- вход вторым устройством, `/api/auth/me` по cookie и по `Authorization: Bearer`, «это устройство» помечено;
- нерабочий ключ не сохраняется (`KEY_NO_ACCESS`), чужой провайдер → 404, проверка несохранённого ключа → 404;
- синхронизация: устройство A → устройство B, более старая запись не побеждает, удаление доходит, `since` отсекает старое;
- смена пароля: текущее устройство остаётся, остальные выходят, старый пароль не работает, новый работает;
- «выйти везде» закрывает все сессии; «выйти» стирает cookie (`Max-Age=0`);
- 11-я попытка входа → `TOO_MANY_ATTEMPTS` 429 с русским текстом;
- `/api/health?check=1`: Gemini отвечает настоящим кодом (400 на фиктивный ключ), MyMemory — ✅ за ~1 с,
  повторный вызов берётся из кэша D1 (`checksCached: true`), без `check=1` проверок нет;
- без `KEY_ENCRYPTION_SECRET` и `/api/health`, и `/api/me` сообщают `keysStorageEnabled: false`,
  а `PUT /api/keys/:provider` отвечает `KEYS_STORAGE_DISABLED` 503.

В браузере (localhost:8788): профиль в порядке «Аккаунт → Мои ключи ИИ → Сервисы сайта → Настройки →
Установка → О приложении»; регистрация и выход через форму работают; список устройств показывает
«это устройство»; кнопка «Проверить сервисы сайта» показывает время ответа и причину;
история с телефона-A подтянулась на устройство-B автоматически (и наоборот); окно лимита использует
тот же мастер; немецкий интерфейс показывает все новые тексты; ошибок в консоли нет;
на ширине 360 px горизонтальной прокрутки нет (была — исправлена).

### Что не сделано и ограничения

- **Сохранение рабочего ключа в аккаунт не прогнано end-to-end**: у меня нет настоящего ключа Gemini/Groq.
  Проверена вся ветка отказа (ключ проверяется и не сохраняется, `KEYS_STORAGE_DISABLED`, `test`/`DELETE`).
  Нужно один раз вставить настоящий ключ в профиле на вошедшем аккаунте и убедиться, что появилось `••••1234`
  и что ИИ работает на втором устройстве без ввода ключа.
- **Workers AI и M2M100** проверены только в ветке «не настроено»: локально нет привязки `AI` без входа в Cloudflare.
- **DeepL, Microsoft, Google** проверены только в ветке «ключ не задан» — ключей нет.
- Вход через Google/Apple, админка, экспорт в CSV/Anki — по заданию не делались.
- Сессия живёт в cookie, поэтому обычные переходы по страницам её не теряют; токен в localStorage
  нужен только будущим приложениям на Capacitor.

### Настройки Cloudflare

Новый секрет (обязателен для ключей в аккаунте):

```
KEY_ENCRYPTION_SECRET = <32 случайных байта в base64>
```

Сгенерировать: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
Cloudflare: **Settings → Variables and secrets → Add → Secret**. Локально — строка в `.dev.vars`.
Миграция новых таблиц: `npx wrangler d1 execute yai-translator-db --remote --file=./migrations/0002_accounts.sql`
(таблицы и так создаются сами, миграция нужна для порядка).
Без секрета сайт работает, но ключи в аккаунте не сохраняются — приложение это показывает и хранит ключ на устройстве.

---

## Версия 0.2.0 (30.10.2026, Claude)

- **Сначала обычные переводчики, ИИ — по кнопке «Спросить у AI».** Новый порядок в `/api/translate` (режимы `classic` / `ai`).
- **Выбор переводчика** в правом верхнем углу перевода: Авто, DeepL, Microsoft, Google, MyMemory, M2M100.
- **«Сравнить переводчики»** (`/api/compare`): один текст во всех подключённых сервисах.
- **Полная карточка для 1–3 слов** отдельной панелью под переводом: появляется сама, перевод её не ждёт.
  Новое поле `grammarNotes`: возвратность, отделяемые приставки, почему слова идут вместе, n-склонение и т.п.
  Примеры: по 2 на уровни A2, B1, B2 с кнопками-переключателями. Для русского слова карточка описывает немецкое слово.
  Карточки кэшируются на год (`LIMITS.wordCacheTtlSeconds`). `PROMPT_VERSION` = 2.
- **База D1 подключена** (`wrangler.toml`), таблицы создаются сами (`functions/_lib/schema.ts`).
- LibreTranslate не добавлен: на Cloudflare его не запустить (нужен Python и гигабайты моделей), а публичный сервер платный.

### Проверка Claude (30.10.2026)

Сборка и типы проходят; логика перевода не изменена (только получение ключей через `resolveUserKeys`).
Прогнан end-to-end тест на `wrangler pages dev` с секретом: регистрация с переносом ключа, `me` по cookie и Bearer,
одинаковая ошибка для неверного пароля и несуществующего логина, синхронизация, `logout-all`,
расшифровка сохранённого ключа при переводе. Усилено:

1. **Время ответа при входе** не выдаёт, существует ли логин (для несуществующего считается фиктивный PBKDF2).
2. **AES-GCM additionalData** = `<userId>:<provider>`: шифротекст, перенесённый в чужую строку базы, не расшифруется.
3. **Лимит записей синхронизации** — `AUTH.maxSyncItemsPerUser` (3000); удалённые записи чистятся первыми.

Миграцию `0002_accounts.sql` вручную запускать не нужно: таблицы создаёт `schema.ts`.

### Проверка Claude этапа 3 (30.10.2026)

Сборка и типы проходят. Проверено на `wrangler pages dev`: админ по `ADMIN_LOGINS` видит `/api/admin/*`,
обычный пользователь получает 403, без входа — 401; статистика пользователей и посетителей считается; ключи сайта
без ограничения количества. Исправлено:

- **DeepL: адрес по типу ключа** (`deeplUrl()` в `config.ts`). Бесплатный ключ `…:fx` → `api-free.deepl.com`,
  ключи тарифов Developer/Growth/Pro → `api.deepl.com`. Раньше ключ Developer получал 403 и помечался «неверным».
  Используется в переводе, в проверке сервисов и при добавлении ключа в админке.

### Проверка Claude (этап 4)
- Сборка проходит, исправления Claude (deeplUrl, MyMemory, тумблеры переводчиков) на месте.
- Начальный набор ресурсов теперь заливается сам при первом открытии `/resources` (`functions/_lib/resources/seed.ts`,
  флаг `resources_seeded` в settings). Миграцию 0004 запускать вручную не нужно.
- Клиент: тайм-аут запроса 30 с (`src/api/request.ts`) — спиннер «Переводим…» больше не может висеть бесконечно.
- Перевод: если язык текста совпал с целью (Guten Tag → Немецкий), цель сама меняется на русский (de → ru, иначе → de).
- Найдено Claude: общий Promise в ensureSchema зависал навсегда после отменённого запроса → все запросы к D1 «висели» (перевод «Переводим…»). Теперь флаг schemaReady.

### Проверка Claude (этап 5)
- Сборка и типы проходят; исправления Claude (schemaReady, тайм-аут запросов, deeplUrl) сохранены.
- Добавлены 2 пропущенные подписи: `admin.grammar.examples`, `admin.grammar.commonMistakes`.
- Исправлено: тема хранила один текст на языке того, кто открыл её первым. Теперь русский текст — основной
  (`grammar_topics.body_json`, правится в админке), немецкий и английский составляются отдельно один раз и хранятся
  в кэше (`grammar:body:<lang>:<slug>`, 5 лет). Правка, перегенерация и удаление темы сбрасывают de/en-копии.
- Офлайн-копия сайта теперь обновляется сама (registerSW в src/main.tsx, injectRegister: false): раньше посетители видели старую версию до второго захода.
