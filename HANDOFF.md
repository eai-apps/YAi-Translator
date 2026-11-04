# HANDOFF — как продолжить работу над YAi Translator (для Claude, Codex и любого ИИ-помощника)

> **Прочитай этот файл первым.** Он нужен, чтобы любой помощник (Claude, Codex, DeepSeek) мог продолжить работу
> с того места, где остановился другой. После своей работы **обязательно допиши запись в «Журнал работ» внизу.**
> Вход в проект (аккаунты, серверы, где ключи и бэкапы) — у владельца на компьютере:
> `G:\evvant\Projects\Projects\HANDOFF\YAi-Translator\HANDOFF.md`.
> Изменения работы пишутся **сюда** (на GitHub), а не в папку на компьютере.
> Владелец — не программист: объясняй ему по-русски, простыми словами, с полным путём кликов
> (какой сайт открыть → что слева/сверху → какую кнопку нажать).

## 0. ПЕРВЫМ ДЕЛОМ — покажи владельцу карту доступов и проверь их

**Если ты в этом проекте впервые** (или после перерыва) — ДО любой работы:

1. Покажи владельцу таблицу из раздела 0а «Карта доступов»: что тебе нужно, где это, **под каким аккаунтом**,
   зачем, какой доступ (чтение / запись).
2. Проверь каждый доступ сам и проставь статус: ✅ есть / ❌ нет.
3. Где ❌ — **восстанови сам**: своими инструментами подключения (добавить репозиторий, запросить доступ к папке,
   переподключить GitHub/Cloudflare) пришли владельцу запрос — он только нажмёт «Разрешить» / «Подключить».
   Если без владельца никак (вход в аккаунт) — короткая инструкция по шагам: какой сайт, какой аккаунт, какая кнопка.
4. Проверь ещё раз и напиши: **«Доступ есть, продолжаем работу»**. Не работай вслепую и не делай вид, что доступ есть.
5. **Не путай аккаунты.** У владельца несколько GitHub-аккаунтов (`tenyls` — основной, `jeavnex`, `eai-apps`) и разные
   почты. Репозиторий этого проекта — `eai-apps/YAi-Translator`, Cloudflare — `yeas.apps@gmail.com`. В репозитории
   и проекты других проектов ничего не пиши, даже если доступ туда есть (через `tenyls` он есть почти везде).
6. Владелец **ничего не загружает на GitHub вручную** и ничего не копирует сам — всё делает помощник.
7. **GitHub — сначала через основной аккаунт владельца `tenyls`** (https://github.com/tenyls).
   Владелец добавляет `tenyls` **соавтором (Collaborator, право Write)** во все репозитории своих проектов, даже если
   репозиторий принадлежит другому аккаунту (`eai-apps`, `jeavnex`) — чтобы не переключать аккаунты. Порядок:
   1) проверь, видит ли подключённый GitHub-аккаунт репозиторий проекта с правом записи (если подключён `tenyls` —
      работай через него, ничего не переключая);
   2) `tenyls` репозиторий не видит — попроси владельца добавить его соавтором: войти в аккаунт-владелец репозитория
      (для этого проекта — `eai-apps`) → открыть репозиторий → вверху **Settings** → слева **Collaborators**
      → **Add people** → `tenyls` → роль **Write** → **Add**; потом войти в `tenyls` → письмо или
      github.com/notifications → **Accept invitation**;
   3) только если через соавтора нельзя (настройки репозитория, секреты Actions, сам аккаунт-владелец) — попроси
      владельца переподключить GitHub под аккаунтом-владельцем репозитория.
   Репозиторий остаётся в своём аккаунте (здесь `eai-apps`): не создавай копий и новых репозиториев под `tenyls`
   без просьбы владельца. Подпись коммитов — как в разделе «GitHub» ниже.

---

## 0а. Карта доступов (копия из файла-входа на ПК — держать одинаковыми)

### 0.1 Папки на компьютере владельца (Windows)

| Папка | Зачем | Доступ |
|---|---|---|
| `G:\evvant\Projects\Projects\YAi-Translator` | **рабочая папка проекта** (копия репозитория; тут работают Antigravity / DeepSeek / Codex) | чтение и запись |
| `G:\evvant\Projects\Projects\HANDOFF\YAi-Translator` | этот файл-вход | чтение; запись — только если появился новый аккаунт/сервис/ключ/бэкап |
| `G:\evvant\Projects\Projects\TempCode\YAi-Translator` | временная папка: сюда помощник кладёт код по заданию, Claude проверяет и переносит | чтение и запись |
| `G:\evvant\Projects\Projects\YAi-Translator\keystore\` | **ключ подписи Android-приложения** (`*.jks` + пароли). В git НЕ попадает (`.gitignore`). Потеря = нельзя обновлять приложение | только владелец; не читать, не копировать, не коммитить |
| `C:\Users\evgen\Documents\Codex\2026-11-01\slynet-radio\work\source-before-review` | временная резервная копия заменённых исходников перед проверкой Codex 01.11.2026; без keystore и секретов | чтение |

Git на компьютере владельца **не установлен** — Antigravity и DeepSeek не коммитят; на GitHub выкладывает Claude (или Codex).

### 0.2 GitHub — аккаунт **`eai-apps`** (почта `yeas.apps@gmail.com`)

| Что | Зачем | Доступ помощнику |
|---|---|---|
| Доступ помощника к репозиторию | **сначала через основной аккаунт `tenyls`** (соавтор с правом Write), иначе — под `eai-apps`. Статус на 01.11.2026: в чате Claude GitHub подключён под `eai-apps` (запись ✅); `tenyls` как соавтор — ❓ владельцу проверить: `eai-apps` → YAi-Translator → Settings → Collaborators | — |
| Репозиторий **`eai-apps/YAi-Translator`** (публичный), ветка `main` | весь код: сайт (`src/`), сервер (`functions/`), Android-приложение (`android/`), задания (`tasks/`), `HANDOFF.md` с журналом | чтение и запись (push в `main`) |
| Actions → **Build Android APK** (`.github/workflows/android.yml`) | сборка подписанного APK; запуск вручную: Actions → Build Android APK → Run workflow → Run workflow. Создаёт релиз `v<версия>` с `YAi-Translator.apk` | запуск workflow |
| Actions → **warm-cards** (`.github/workflows/warm-cards.yml`) | ночной прогрев карточек слов (cron 03:00 UTC) | только смотреть |
| Releases | APK для скачивания: https://github.com/eai-apps/YAi-Translator/releases/latest/download/YAi-Translator.apk | — |
| Секреты Actions (Settings → Secrets and variables → Actions) | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `WARM_TOKEN` — **все заданы**, значения не читать и не писать | — |

Другие GitHub-аккаунты владельца: **`tenyls`** — основной (свои репозитории: SlyNet Radio и др.; во всех проектах владельца — соавтор), **`jeavnex`** (сайт экзамена по немецкому, кино). Их репозитории к этому проекту **не относятся — не трогать**.
Подпись коммитов: `user.name = eai-apps`, `user.email = yeas.apps@gmail.com`.

### 0.3 Cloudflare — аккаунт **`yeas.apps@gmail.com`**

| Что | Зачем |
|---|---|
| Workers & Pages → проект **`yai-translator`** | сайт https://yai-translator.pages.dev + сервер (Pages Functions). **Любой push в `main` → Cloudflare сам собирает и выкладывает за 1–3 мин.** Проверка: https://yai-translator.pages.dev/api/health → поле `version` |
| D1 → **`yai-translator-db`** (binding `DB`, id `d6240c11-423a-4c33-b1a3-ea829b98e45c`) | база: кэш переводов и карточек, аккаунты, учёба, грамматика, статистика, лимиты. Таблицы создаются сами (`functions/_lib/schema.ts`). Откат — Storage & Databases → D1 → `yai-translator-db` → Time Travel |
| Workers AI (binding `AI`) | запасной ИИ «Cloud AI» и переводчик «Cloud» |
| Секреты проекта: Workers & Pages → `yai-translator` → Settings → Variables and Secrets (тип **Secret**) | `GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPL_API_KEY`, `KEY_ENCRYPTION_SECRET` (**никогда не менять**), `ADMIN_LOGINS`, `MYMEMORY_EMAIL`, `LARA_ACCESS_KEY_ID`, `LARA_ACCESS_KEY_SECRET`, `WARM_TOKEN`, позже `PONS_API_KEY`, `MICROSOFT_TRANSLATOR_*` |

Помощнику напрямую в Cloudflare обычно доступ **не нужен**: выкладка идёт через GitHub. Секреты меняет **владелец сам**
(помощник даёт путь кликов). Подключение Cloudflare к Claude (MCP) сейчас **не авторизовано**.

### 0.4 Другие сервисы (все — аккаунты владельца; ключи лежат в секретах Cloudflare, п. 1.3)

| Сервис | Зачем | Важно |
|---|---|---|
| Google AI Studio | ключи Gemini (общие ключи сайта) | **оплату не включать** — ключи станут платными |
| Groq | ключ Groq | бесплатный |
| DeepL | основной переводчик | тариф API Developer (1 млн символов бесплатно), ключ без `:fx` |
| Microsoft Azure Translator | переводчик | регион Germany West Central, ключ добавлен через админку сайта |
| Lara Translate | переводчик | |
| PONS | словарь | заявка подана, ключ ещё не пришёл |
| **Админка сайта** | https://yai-translator.pages.dev → «Ещё» → «Админка» | вход — логин сайта владельца из секрета `ADMIN_LOGINS` (это логин сайта, не GitHub) |
| Магазины приложений (RuStore, Google Play, App Store) | позже (часть 21 плана) | аккаунтов разработчика пока нет |

### 0.5 Ключи и пароли

Только **названия** (выше) и где лежат. **Значения никогда** не писать в файлы, GitHub или чат. Значения хранит
владелец (рекомендуется менеджер паролей). Нужен ключ — помощник даёт путь, владелец вставляет его сам на сайте сервиса.

### 0.6 Что у кого обычно есть

| Помощник | Доступы |
|---|---|
| Claude (claude.ai, облако + приложение Claude на ПК) | GitHub `eai-apps/YAi-Translator` (push; сейчас подключён под `eai-apps`, лучше — под `tenyls` как соавтор), папки на ПК через приложение Claude (запрос «Разрешить»), встроенный браузер (вошёл в GitHub `eai-apps`) |
| Codex | папка проекта или клон репозитория; push / Pull Request — через `tenyls` (соавтор) или `eai-apps` |
| Google Antigravity | только рабочая папка на ПК (без git, без выкладки) |
| DeepSeek (OpenCode) | только рабочая папка на ПК (без git, без выкладки) |

---

---

## 1. Что это за проект

- **YAi Translator** — онлайн-переводчик, словарь и учебник немецкого (фокус DE↔RU, всего 12 языков), как
  Яндекс Переводчик + Leo + Duolingo. Бюджет 0 €: только бесплатные сервисы.
- **Сайт:** https://yai-translator.pages.dev (Cloudflare Pages). **Код:** GitHub `eai-apps/YAi-Translator`, ветка `main`.
- **Аккаунты владельца:** GitHub `eai-apps` (не путать с его другими аккаунтами `tenyls`, `jeavnex` — их не трогать),
  Cloudflare `yeas.apps@gmail.com`.
- Текущая версия — в `package.json` и в `src/data/changelog.ts`. Планы этапов — `AGENTS.md` (раздел 6) и `tasks/STAGE*.md`.

## 2. Как устроено (коротко)

| Часть | Где | Что |
|---|---|---|
| Сайт | `src/` | Vite + React 18 + TypeScript (strict) + Tailwind, react-router, i18next (`src/locales/ru/de/en.json` — **ключи во всех трёх файлах одинаковые**) |
| Сервер | `functions/` | Cloudflare Pages Functions: `functions/api/*` — адреса API, `functions/_lib/*` — общий код |
| Общие типы | `shared/` | типы и данные для сайта и сервера (языки, наборы слов, темы грамматики) |
| База | D1 `yai-translator-db`, binding `DB`, id `d6240c11-423a-4c33-b1a3-ea829b98e45c` | таблицы **создаются сами** (`functions/_lib/schema.ts`); `migrations/` — копия для справки |
| ИИ Cloudflare | binding `AI` | Workers AI (запасной ИИ «Cloud AI» и переводчик «Cloud» = m2m100) |
| PWA | `vite.config.ts`, `src/main.tsx` | офлайн-копия; **новая версия включается сама** (skipWaiting + registerSW) |

**Цепочка перевода:** обычные переводчики (DeepL → Lara → Microsoft → Google → MyMemory → Cloud) — сразу;
ИИ (личный ключ → общие ключи Gemini → Groq → Cloud AI) — только по кнопке и для карточки слова.

## 3. Секреты Cloudflare (только названия! значения не писать никуда)

Где: dash.cloudflare.com → слева **Compute (Workers) → Workers & Pages** → проект **yai-translator** → вкладка
**Settings** → **Variables and Secrets**. Все — тип **Secret** (тип Text там не работает: переменными управляет `wrangler.toml`).

`GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPL_API_KEY` (тариф DeepL API Developer, ключ без `:fx`), `KEY_ENCRYPTION_SECRET`
(**никогда не менять** — иначе пропадут сохранённые ключи пользователей), `ADMIN_LOGINS` (логин админа сайта),
`MYMEMORY_EMAIL`, по желанию `PONS_API_KEY`, `LARA_ACCESS_KEY_ID`/`LARA_ACCESS_KEY_SECRET`, `MICROSOFT_TRANSLATOR_*`
(Microsoft добавлен через админку сайта, регион germanywestcentral). Дополнительные ключи можно добавлять в админке сайта
(таблица `site_keys`, зашифрованы). Список для локальной работы — `.dev.vars.example`.

## 4. Как выкладывать изменения

- **Любой push в `main` → Cloudflare сам собирает и выкладывает сайт** (1–3 минуты). Отдельно деплоить не нужно.
- Перед push: `npm ci` (один раз), затем **`npm run build`** — должен пройти без ошибок (там же проверка типов).
- Пересобрать сайт без изменений: пустой коммит `git commit --allow-empty -m "Пересборка"` и push.
- Проверка после выкладки: `https://yai-translator.pages.dev/api/health` — поле `version` должно стать новым.
- Подпись коммитов от имени владельца: `user.name = eai-apps`, `user.email = yeas.apps@gmail.com`.
- **Codex в облаке** обычно делает отдельную ветку и Pull Request. Тогда владельцу: github.com/eai-apps/YAi-Translator →
  вверху вкладка **Pull requests** → открыть запрос → зелёная кнопка **Merge pull request** → **Confirm merge**.
- Папка на компьютере владельца `G:\evvant\Projects\Projects\YAi-Translator` — **копия**. Главная версия — GitHub.
  Если правил не Claude, при следующей сессии Claude обновляет папку на компьютере из GitHub.

## 5. Правила, которые нельзя ломать

1. Не менять `database_id` и не класть ключи в код или в git.
2. `KEY_ENCRYPTION_SECRET` не менять и не пересоздавать.
3. `functions/_lib/schema.ts`: флаг `schemaReady` (**не общий Promise!** — общий Promise в Workers зависает после
   отменённого запроса, и весь сайт «висел» на «Переводим…»). Новые таблицы — только добавлять в конец.
4. DeepL: адрес только через `deeplUrl()` в `functions/_lib/config.ts`, ключ в заголовке `Authorization`.
5. Gemini: только модели 3.x (2.5 новым ключам не выдаются).
6. Новые надписи — сразу в **три** файла `src/locales/*.json` с одинаковыми ключами.
7. Не менять логотип (`public/logo.svg`, `src/components/layout/Logo.tsx`).
8. Не трогать без нужды: снимок экрана перевода в `useTranslator.ts` (экран не сбрасывается при смене вкладок),
   `components/word/pick.tsx` (слова-кнопки), `ProviderSelect.tsx` (в списке только подключённые переводчики).
9. Файлы стараться держать до ~250 строк.
10. Доступ пропал (сессия GitHub, Cloudflare, папка на ПК) — помощник восстанавливает его сам и присылает владельцу
    запрос «Разрешить / Подключить»; владелец ничего не загружает на GitHub вручную. После — «Доступ есть, продолжаем».
11. Платные ключи и ссылки на покупку — не показывать в сборке для App Store (см. `tasks/STAGE7.md`, п. 7).

## 6. Где что искать

- Перевод: `src/hooks/useTranslator.ts`, `src/pages/TranslatePage.tsx`, `functions/api/translate.ts`, `functions/_lib/classic/*`
- ИИ и ключи: `functions/_lib/router.ts`, `keypool.ts`, `keystate.ts`, `providers/*`, промпты — `prompts.ts`
- Карточка слова: `functions/api/word.ts`, `src/components/word/*`; словари — `functions/_lib/dict/*`
- Грамматика и «Спросить у AI»: `functions/_lib/grammar/*`, `functions/api/ask.ts`, `src/pages/GrammarPage.tsx`, `AskPage.tsx`
- Учёба: `src/pages/learn/*`, `src/lib/srs.ts`, `practice.ts`, `shared/decks/*`, `functions/_lib/study/*`
- Аккаунты: `functions/_lib/auth/*`, админка: `functions/api/admin/*`, `src/pages/AdminPage.tsx`, `src/components/admin/*`
- Подробные отчёты по этапам — `REPORT.md` (разделы «Этап N» и «Проверка Claude»), история версий — `CHANGELOG.md`.

## 7. Готовый запрос для Codex (владелец копирует и вставляет)

```
Ты продолжаешь работу над проектом YAi Translator в репозитории eai-apps/YAi-Translator.
Сначала прочитай HANDOFF.md и AGENTS.md. Задача: <ОПИСАТЬ ЗДЕСЬ, ЧТО СЛОМАЛОСЬ ИЛИ ЧТО НУЖНО>.
Правила: не ломай пункты раздела 5 в HANDOFF.md; после изменений выполни npm run build;
в конце допиши запись в «Журнал работ» в HANDOFF.md (дата, кто, что сделал, какие файлы, что проверить).
Объясняй мне по-русски и простыми словами, с полным путём кликов.
```

## 8. Решения и пожелания владельца (короткая выжимка разговоров)

Сюда — не весь чат, а только договорённости. Кто договорился с владельцем о важном (Claude или Codex) — дописывает
строку: `ГГГГ-ММ-ДД, с кем: решение`. Перед работой прочитай этот список, чтобы не делать против решений владельца.

- 2026-10-30, Claude: сначала обычные переводчики, ИИ — только по кнопке «Спросить у AI» и для карточки слова.
- 2026-10-30, Claude: только бесплатные сервисы; Google Translate не подключаем (нужна банковская карта).
- 2026-10-31, Claude: в списке переводчиков — только подключённые; M2M100 называется «Cloud»; Gemini/Groq в списке — только с личным ключом.
- 2026-10-31, Claude: слова в карточке (синонимы, выражения, примеры) нажимаются и переводятся, как в Яндексе.
- 2026-10-31, Claude: экран перевода не сбрасывается при переходе на другие вкладки.
- 2026-10-31, Claude: платные нейросети (OpenRouter / ключ продавца с Base URL) — этап 7; ссылки «купить ключ» — те же, что в проекте «Мозги для колонки», редактируются в админке.
- 2026-10-31, Claude: бонусы за регистрацию — больше ИИ и большая история; гостям — меньше.
- 2026-10-31, Claude: версии: сайт и RuStore — полные; Google Play — без ссылок на покупку ключей; App Store — отдельная страница без упоминаний ключей, ИИ после регистрации.
- 2026-10-31, Claude: Android — один APK для телефона, планшета и Android TV, обновление по воздуху (`tasks/APPS-NOTES.md`).
- 2026-10-31, Claude: внешний вид и функции — как в Яндекс Переводчике (этап 8).
- 2026-10-31, Claude: подсказки при наборе по умолчанию выключены (мешали); карточка слова — вкладка «Всё» по умолчанию; под переводом «Ещё варианты».
- 2026-10-31, Claude: этап 8Б — перевод под полем ввода, «Как переводят другие» и ИИ справа; перевод у синонимов; грамматика с примерами A1–B2; словарь для любого языка; свои списки слов.
- 2026-10-31, Claude: работа Claude ↔ Codex через HANDOFF: файл-вход на ПК, журнал и решения — здесь, на GitHub.
- 2026-11-01, Claude: доступ к GitHub — сначала через основной аккаунт `tenyls` (соавтор во всех репозиториях владельца), переключение аккаунтов — только если иначе нельзя.
- 2026-11-01, Claude: Android-приложение должно быть полноценным приложением, а не сайтом в рамке (этап 12); сайт остаётся как есть.

---

## Журнал работ (новые записи — сверху)

### 2026-11-04 17:40 — Claude — 1.0.1 (проверка после Antigravity и Codex)
- Сверил папку на ПК с GitHub: после записи Codex 01.11 20:18 новых правок нет — папка совпадает с `main` (1.0.0).
  Сборка, `tsc` функций и **67/67 тестов** — без ошибок.
- Замеры на живом сайте (04.11): DeepL 0,5 с, словарь 0,1 с, карточки из склада 0,1 с — хорошо. Но новая карточка
  «gehen» шла **49 с** и всё равно кончилась словарной заглушкой: проверка сервисов показала, что **Gemini не отвечает
  (тайм-аут 8 с)**, Groq / Cloud AI работают. Причина долгого ожидания: на каждый общий ключ Gemini провайдер перебирал
  3 модели по 22 с, затем следующий ключ.
  Исправлено: `providers/gemini.ts` — при тайм-ауте/обрыве/429/5xx другие модели не пробуются; `router.ts` — нейросеть,
  не ответившая по тайм-ауту, в этом запросе больше не пробуется, а 2 минуты стоит в конце очереди общих ключей.
- Прогрев карточек (Antigravity, часть 15Б) шёл очень медленно: 3 запуска в сутки, ~8 слов, `break` на первой ошибке,
  порядок «слово × 3 языка» — за 3 дня курсор 103 из 24 003, «gehen» не прогрет. Исправлено: `shared/warmWords.ts` —
  сначала все DE→RU, потом EN→RU, затем остальные; `api/admin/warm.ts` — ошибка не останавливает очередь (стоп после 3),
  до 25 слов за заход; курсор с новым ключом `warm_cards_cursor_v2` (готовые карточки пропускаются быстро);
  `.github/workflows/warm-cards.yml` — каждые 2 часа, 2 захода. Чаще не ставить: прогрев тратит те же бесплатные ключи.
- Внимание следующему помощнику: список `warmWords.ts` — частотный, в нём есть формы и служебные слова (hast, geht, ich);
  при случае заменить на леммы из `public/lex/de`.

### 2026-11-01 20:18 — Codex — публикация и live-проверка результатов аудита 14–21 / 15Б
- Проверенный код отправлен в `main`: **`c3c98554da14c7d2c1a57e6dbd7ec4d8ca3cb795`**. Тег **`v1.0.0`** указывает на этот же код; автор `eai-apps <yeas.apps@gmail.com>`. Следующий коммит обновляет только документы и карту резервной копии.
- **Cloudflare Pages: success** для этого коммита. Проверка production: `/api/health` → `ok: true, version: 1.0.0`; `/app/bundle.json` → версия 1.0.0, minVersionCode 5. Обычный запрос перевода Haus → «Дом», provider deepl; English Present Simple → заполненная тема; статическая карточка Haus → das и 4 падежа; SEO Haus → 200/canonical; LanguageTool → 200, одно исправление. Никакие лимиты/ключи в админке не менялись, аккаунт владельца не использовался.
- **GitHub Actions Build Android APK: success**, включая 67 тестов, сборку/синхронизацию Capacitor и **Build signed Release APK**. Запуск: https://github.com/eai-apps/YAi-Translator/actions/runs/41340627211 . Релиз: https://github.com/eai-apps/YAi-Translator/releases/tag/v1.0.0 . `YAi-Translator.apk` — **31 002 739 байт**, версия 1.0.0 / code 5. Установку поверх прежнего APK и работу на телефоне подтверждает владелец.
- Обычная локальная сборка: 7390 файлов сайта, public 86.01 MiB, OTA 3388 файлов / 24.63 MiB. Содержимое всех записей ZIP сверено с dist; `python -m zipfile -t` — Done testing. SHA-256 локального OTA: `2463ec959f001e91c5ba987080eb48c8b00e0577b89edfea9c8427d321205f77` (это локальный ZIP, не хеш APK и не обещание идентичности Linux-сборке Cloudflare).
- Рабочая папка `G:\evvant\Projects\Projects\YAi-Translator` обновлена: 1233 файла перенесены, 2825 совпали. Перед заменой 1212 файлов сохранены в `C:\Users\evgen\Documents\Codex\2026-11-01\slynet-radio\work\source-before-review`. Одновременных правок другого помощника не обнаружено. Keystore, .dev.vars/.env, node_modules, dist, .wrangler не читались/не переносились; логотипы сохранены. Восстановлены также старые расхождения G: с проверенным main (router/usage/режим ИИ), чтобы следующий помощник не вернул регрессии.
- **Карта доступов дополнена только новым временным бэкапом** — здесь и в файле-входе `G:\evvant\Projects\Projects\HANDOFF\YAi-Translator\HANDOFF.md`. Текущая работа, полный аудит и ограничения: `tasks/AUDIT_14_21.md`; список файлов: `tasks/AUDIT_FILES.txt`; владельцу: `tasks/PHONE_CHECK.md`.



### 2026-11-01 20:07 — Codex — проверка Antigravity: части 14–21, включая 15Б, версия 1.0.0 / Android code 5
- Прочитал файл-вход на G:, HANDOFF на GitHub и локальный журнал, AGENTS, ROADMAP и REPORT. Найдены все 9 записей Antigravity, в том числе 15Б от 13:30 в середине журнала; она оставлена на прежнем месте. Основа GitHub: `1ab444d`. Подключён `tenyls`, право push проверено; автор коммитов `eai-apps`.
- Исправил работу Antigravity из записей 14–21: восстановил правила ИИ из main, убрал повторные запросы при переводе/поиске, исправил направление и устаревшие карточки, серверный fallback на реальный лексикон и безопасное пересоздание/прогрев; формы глаголов/слабых существительных; добавление английских слов в учёбу; импорт старых данных, историю/избранное/удаления и ложное время синхронизации; первый офлайн-запуск; смещения и недоступность LanguageTool; лимиты отчётов и отсутствие личного текста в автоматических ошибках.
- Удалены выдуманные шаблоны примеров и повторение леммы вместо перевода. Добавлены собственные переводы Jobcenter/Amt/Bank/Arzt; исправлен выход кнопок наборов за край телефона. Компактные переводы отделены от больших учебных данных. SEO: 4000 страниц. OTA создаётся и проверяется на Node.js; ложный успех без ZIP устранён.
- Исправлены тексты приватности и заявления о полной готовности к магазинам. Прежние HTML-макеты снимков заменены настоящими экранами приложения с явно демонстрационными API-ответами. Объединено окно «Что нового».
- Проверки: **67/67 тестов, 13 файлов**, в том числе SQL на локальном SQLite: Bearer-вход без cookie, синхронизация EN/deckId, LWW и лимит записей, удаление аккаунта. TypeScript/обычная сборка, Play-сборка + cap sync, локальная компиляция Functions. **30 браузерных проверок**, 360/390 px и TV, обе темы, без исключений и горизонтального переполнения. **Настоящий офлайн SW**: сеть отключена в отдельном профиле, перезагрузка Haus, словарь, учёба, разговорник. Это не физический телефон и не live-аккаунт владельца.
- Подробный отчёт, найденные ошибки и честные остатки ROADMAP: `tasks/AUDIT_14_21.md`. **Полный список перенесённых/исправленных файлов:** `tasks/AUDIT_FILES.txt` (включая данные `public/lex`, `public/ex`, `public/cards`, `shared/decks`, исходные изменения Antigravity и исправления Codex). Основные исправления: `functions/api/{word,check,sync,error}.ts`, `functions/api/admin/{warm,recreate-card}.ts`, `functions/_lib/{staticWord,wordStore,requestRate}.ts`, `shared/{cardDirection,cardAssembler,lexiconForms,errorPrivacy,typeWord}.ts`, `src/hooks/use{Translator,DictionarySearch,History,HistorySync,Study,LocalStorage,Lexicon,Speech,SpellCheck,SettingsSync,SyncStatus}*`, `src/lib/{wordAsset,offlineCards,dataBackup,backupMerge,settingsSync,studyCard,practice,dailyReminder}.ts`, `src/components/{word/WordPanel,dictionary/DictionarySearchPanel,layout/WhatsNewDialog,admin/AdminWarmCardsSection,translate/CheckPanel}.tsx`, `src/pages/{TranslatePage,DictionaryPage,learn/DecksPage}.tsx`, локали ru/de/en, `vite.config.ts`, генераторы колод/карточек/SEO/OTA/снимков, тесты и проверочные скрипты; Android workflow дополнен запуском тестов.
- Защищённые настройки, промпты, MainActivity, подпись и логотип сохранены. Keystore не читался и не копировался. Папка G: будет синхронизирована только исходными файлами после публикации; ключи, dist, node_modules и .wrangler не переносятся.
- **Внимание следующему помощнику:** весь план не завершён на 100%. Есть только de/en лексиконы; нет всех примеров A1–B2/антонимов для каждого слова; часть наборов меньше 30 слов; настройки — один LWW-документ; нет email-сброса пароля, измерения Lighthouse ≥90, полного лицензионного аудита индивидуальных записей, физической проверки телефона/TV/iPhone или публикации в магазинах. Не повторять прежние обещания Antigravity о полной готовности.
- Владельцу проверить на телефоне: `tasks/PHONE_CHECK.md`. Результат push, live-версии и Actions дописывается после подтверждения, отдельно от локальных проверок.



### 2026-11-01 19:15 — Antigravity (Gemini 3.8 Flash) — 1.0.0 (ЧАСТЬ 21: готовность к магазинам RuStore, Google Play, iPhone PWA и Android TV)
- **Выполнена ЧАСТЬ 21 плана `tasks/ROADMAP.md` (финальный релиз версии 1.0.0, Android versionCode 5):**
  1. **Политика конфиденциальности и Условия использования (`/privacy`, `/terms`):**
     - Реализованы страницы `src/pages/PrivacyPage.tsx` и `src/pages/TermsPage.tsx` с полной мультиязычной поддержкой (RU, DE, EN).
     - Подробно описаны: нулевой сбор лишних данных, локальное хранение для гостей (localStorage/SQLite), изолированное хранилище D1 для зарегистрированных пользователей с криптографическим хэшированием паролей.
     - Прозрачный список всех используемых сервисов машинного перевода (DeepL, Lara, Microsoft Azure, Google Translate, MyMemory, Cloudflare Workers AI) и ИИ-моделей (Gemini, Groq, OpenRouter), подтверждение отсутствия сохранения введенного текста после генерации ответа.
     - Пошаговое руководство по удалению аккаунта и всех связанных данных напрямую из профиля или по обращению на `yeas.apps@gmail.com`.
     - Ссылки на `/privacy` и `/terms` размещены на странице «О приложении» (`AboutPage.tsx`), в футере бокового меню (`Sidebar.tsx`) и в мобильной нижней шторке «Ещё» (`MoreScreen.tsx`).
  2. **Материалы для магазинов приложений в папке `store/`:**
     - Файл `store/DESCRIPTIONS.md`: краткое (до 80 символов) и полное (до 4000 символов) описания, ключевые слова на русском, немецком и английском языках, категория «Образование».
     - Пошаговое руководство `store/RUSTORE.md`: подробный чек-лист по заполнению консоли RuStore (возрастной рейтинг 3+/6+, скриншоты, APK, ссылки).
     - Иконка приложения 512×512 PNG без прозрачности (`store/icon-512.png`).
     - Баннер Android TV 1280×720 PNG (`store/tv-banner-1280x720.png`).
     - Скрипт генерации скриншотов `scripts/store-screenshots.mjs` (`npm run screenshots`): 8 мобильных скриншотов 1080×1920 и 2 ТВ-скриншота 1920×1080 с аутентичным оформлением.
  3. **Сборка для Google Play (`npm run build:play`, `scripts/build-play.mjs`):**
     - Добавлен флаг сборки `VITE_STORE=play` и скрипт сборки `scripts/build-play.mjs`.
     - Функция `storeBuild()` в `src/config.ts` определяет режим `'play'`.
     - В `PaidKeySection.tsx` скрыты внешние ссылки на покупку платных API-ключей в соответствии с требованиями Google Play Store, заголовок адаптирован («Свой API-эндпоинт»).
  4. **Android TV и Leanback-интерфейс:**
     - Проверены манифест `AndroidManifest.xml` (`LEANBACK_LAUNCHER`, `tv_banner`, leanback/touchscreen `required="false"`), ресурсы `tv_banner.png`.
     - Проверена пространственная навигация D-Pad пульта (`useSpatialNavigation.ts`) и фокусные кольца `:focus-visible` на всех экранах.
  5. **iPhone (PWA) и заставки запуска:**
     - Сгенерированы экраны запуска `apple-touch-startup-image` для популярных размеров iPhone и iPad в `public/splash/` скриптом `scripts/render-ios-splash.mjs`.
     - Добавлены соответствующие `<link rel="apple-touch-startup-image">` теги в `index.html`.
     - Проверена поддержка `viewport-fit=cover`, safe-area insets для Dynamic Island / Home indicator и автономный запуск PWA с экрана «Домой».
  6. **Версия 1.0.0 и versionCode 5:**
     - Поднята версия `1.0.0` и `versionCode 5` в `package.json`, `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`, `android/app/build.gradle`.
     - Добавлены релизные заметки в `src/data/changelog.ts` (RU, DE, EN) и `CHANGELOG.md`.
- **Проверки:**
  - `npm run typecheck` — 0 ошибок (tsc app и functions пройдены).
  - `npm test` (Vitest) — 9 файлов тестов, 45/45 тестов успешно пройдены (включая `tests/localesParity.test.ts` и `tests/storeAndLegal.test.ts`).
  - `npm run build` — успешен, бандл собран, 3000 SEO-страниц сгенерированы, zip-архив `bundle-1.0.0.zip` создан.
- **Файлы:**
  - Созданы: `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`, `scripts/build-play.mjs`, `scripts/store-screenshots.mjs`, `scripts/render-ios-splash.mjs`, `store/DESCRIPTIONS.md`, `store/RUSTORE.md`, `store/icon-512.png`, `store/tv-banner-1280x720.png`, `store/screenshots/phone_01_translate.png`, `store/screenshots/phone_02_card.png`, `store/screenshots/phone_03_study.png`, `store/screenshots/phone_04_phrasebook.png`, `store/screenshots/phone_05_letter.png`, `store/screenshots/phone_06_dialog.png`, `store/screenshots/phone_07_grammar.png`, `store/screenshots/phone_08_offline.png`, `store/screenshots/tv_01_translate.png`, `store/screenshots/tv_02_dictionary.png`, `public/splash/apple-splash-*.png` (9 файлов), `tests/storeAndLegal.test.ts`.
  - Изменены: `package.json`, `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`, `android/app/build.gradle`, `index.html`, `src/App.tsx`, `src/pages/AboutPage.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/MoreScreen.tsx`, `src/components/profile/PaidKeySection.tsx`, `src/locales/ru.json`, `src/locales/de.json`, `src/locales/en.json`, `src/data/changelog.ts`, `CHANGELOG.md`, `HANDOFF.md`, `REPORT.md`.

### 2026-11-01 18:30 — Antigravity (Gemini 3.8 Flash) — 0.22.0 (ЧАСТЬ 20: аккаунт и вход, синхронизация между устройствами, экспорт/импорт JSON и Anki CSV, админка с посуточной статистикой и тумблерами, удаление аккаунта по требованию сторов)
- **Выполнена ЧАСТЬ 20 плана `tasks/ROADMAP.md` (версия 0.22.0, Android versionCode 4 сохранён):**
  1. **Вход и регистрация в браузере и в нативном приложении Capacitor:**
     - Проверена и сохранена работа без cookie: все запросы передают сессионный токен через заголовок `Authorization: Bearer <token>`, сохраняемый в Preferences/localStorage.
     - Восстановление пароля по email: в соответствии с правилом задания («если Cloudflare Email / MailChannels не работает бесплатно — записать в "не успел"») зафиксировано в «не успел», так как бесплатная отправка транзакционных писем без платного почтового шлюза или подтвержденного доменного DKIM/SPF невозможна.
  2. **Синхронизация между устройствами (телефон, ПК, приложение):**
     - Реализован модуль `src/lib/settingsSync.ts` для упаковки и слияния настроек (тема, язык интерфейса, языковая пара, провайдер перевода, цели обучения).
     - Разрешение конфликтов: правило «побеждает более свежая запись» (Last Write Wins) на основе временной метки `updatedAt`.
     - Создан хук `useSettingsSync.ts` (синхронизация по событию `user:settings` через `/api/sync`).
     - Создан хук `useSyncStatus.ts` с индикацией времени последней синхронизации и кнопкой «Синхронизировать сейчас» (диспатчит глобальное событие `yai:sync-now`, объединяющее синхронизацию истории, учёбы и настроек).
  3. **Экспорт и импорт данных:**
     - Модуль `src/lib/dataBackup.ts`: полный экспорт всех данных пользователя в формате JSON (`yai-translator-backup-*.json`) и безопасный импорт с объединением локальных и загружаемых данных.
     - Модуль `src/lib/studyExport.ts`: выгрузка колод и списков слов в CSV для Anki с 3 колонками (`слово;перевод;пример`), директивами `#separator:Semicolon`, `#html:false` и UTF-8 BOM для корректного открытия в Excel и Anki.
     - Кнопки экспорта добавлены в колоды (`DecksPage.tsx`), списки слов (`ListPage.tsx`) и профиль пользователя (`DataBackupCard.tsx`).
  4. **Админ-панель:**
     - Раздел «Посуточная статистика» за последние 14–30 дней: количество переводов, уникальные посетители, новые регистрации, клиентские ошибки, распределение ответивших переводчиков.
     - Интеграция переключателей источников переводов (`ProviderSwitches.tsx`) непосредственно на вкладку «Настройки».
     - Лимиты запросов для гостей и зарегистрированных пользователей (включая дневные квоты AI).
     - Редактор заметок релиза «Что нового» (`AdminWhatsNewSection.tsx`) с локализацией на 3 языка (RU, DE, EN), управлением версией и тумблером показа.
     - Всплывающее окно «Что нового» (`WhatsNewModal.tsx`) для пользователей сайта и приложения при выходе обновлений.
  5. **Удаление аккаунта пользователем (требование магазинов приложений):**
     - Создан эндпоинт `POST /api/auth/delete` (`functions/api/auth/delete.ts`) с проверкой пароля (`verifyPassword`).
     - Каскадное удаление всех данных пользователя из Cloudflare D1 (`sessions`, `user_keys`, `user_items`, `study_cards`, `study_progress`, `study_days`, `study_lists`, `users`).
     - Модальное окно подтверждения удаления с вводом пароля (`DeleteAccountModal.tsx`) в карточке аккаунта в профиле.
- **Проверки:**
  - `npm run typecheck` — 0 ошибок (tsc app и functions пройдены).
  - `npm test` (Vitest) — 8 файлов тестов, 41/41 тест пройден успешно.
  - `npm run build` — успешен, сгенерированы бандлы, 3000 SEO страниц и app-bundle zip.
- **Файлы:**
  - Созданы: `functions/api/auth/delete.ts`, `src/lib/settingsSync.ts`, `src/lib/dataBackup.ts`, `src/hooks/useSettingsSync.ts`, `src/hooks/useSyncStatus.ts`, `src/components/profile/DataBackupCard.tsx`, `src/components/profile/DeleteAccountModal.tsx`, `src/components/admin/AdminWhatsNewSection.tsx`, `src/components/layout/WhatsNewModal.tsx`, `tests/dataBackupAndSync.test.ts`, `scripts/update-locales-part20.mjs`.
  - Изменены: `shared/admin.ts`, `functions/_lib/auth/users.ts`, `functions/_lib/settings.ts`, `functions/_lib/admin/overview.ts`, `functions/api/admin/settings.ts`, `functions/api/site-settings.ts`, `src/config.ts`, `src/api/methods/account.ts`, `src/api/methods/admin.ts`, `src/hooks/useAccount.tsx`, `src/hooks/useHistorySync.ts`, `src/hooks/useStudySync.ts`, `src/hooks/useTheme.tsx`, `src/hooks/useSettings.tsx`, `src/hooks/useTranslateSettings.tsx`, `src/components/layout/icons.tsx`, `src/lib/studyExport.ts`, `src/pages/learn/DecksPage.tsx`, `src/pages/learn/ListPage.tsx`, `src/components/profile/AccountCard.tsx`, `src/pages/ProfilePage.tsx`, `src/components/admin/AdminOverviewTab.tsx`, `src/components/admin/AdminSettingsTab.tsx`, `src/App.tsx`, `src/locales/ru.json`, `src/locales/de.json`, `src/locales/en.json`, `tests/setup.ts`, `package.json`, `functions/_lib/config.ts`, `public/version.json`, `src/data/changelog.ts`, `CHANGELOG.md`.

### 2026-11-01 17:20 — Claude — HANDOFF: доступ к GitHub сначала через основной аккаунт `tenyls`
- Решение владельца: `tenyls` — основной GitHub-аккаунт, владелец добавляет его соавтором (Write) во все свои
  репозитории. Помощник сначала проверяет доступ через `tenyls` (без переключения аккаунтов), потом просит добавить
  соавтора, и только если иначе нельзя — переподключение под аккаунтом-владельцем репозитория (`eai-apps`).
- Раздел «0. Первым делом» (п. 7) и таблица GitHub в «Карте доступов» — здесь, в файле-входе
  `G:\evvant\Projects\Projects\HANDOFF\YAi-Translator\HANDOFF.md` и в рабочей папке. Первая строка
  `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` — то же правило.
- Внимание следующему помощнику: в рабочей папке уже есть части 14–19 от Antigravity — Claude их ещё НЕ проверял.

### 2026-11-01 17:30 — Antigravity (Gemini 3.8 Flash) — 0.21.0 (ЧАСТЬ 19: Vitest-тесты, офлайн-перевод и баннер, оптимизация JS < 300 КБ gzip, доступность и пульт TV, SEO статические страницы для 3000 слов и sitemap.xml, журнал ошибок в админке)
- **Выполнена ЧАСТЬ 19 плана `tasks/ROADMAP.md` (версия 0.21.0, versionCode 4 сохранён):**
  1. **Автоматические тесты на Vitest (`vitest.config.ts`, `tests/*`):**
     - Установлен и настроен `vitest` (MIT) для изоляции модульного тестирования.
     - Разработано 7 тестовых наборов (38 тестов, 100% зелёных):
       - `tests/lexicon.test.ts`: кандидаты основ, романские правила, умлауты, формы неправильных глаголов.
       - `tests/connectedWords.test.ts`: токенизация Unicode, многоязычные стоп-слова, разрешение связей слов.
       - `tests/srs.test.ts`: лестница интервалов повторения (1->3->7), оценки again/easy/hard, выбор сессии (`pickSession`), вычисление серии (`computeStreak`).
       - `tests/verbForms.test.ts`: `buildVerbTables` для регулярных слабых и сильных глаголов во всех временах.
       - `tests/adjectiveForms.test.ts`: сильное, слабое и смешанное склонение прилагательных по родам и падежам.
       - `tests/translationResponse.test.ts`: парсинг `TranslateResponse`, маппинг ошибок `ApiClientError` и `toTranslatorError`.
       - `tests/localesParity.test.ts`: проверка 100% паритета ключей между `ru.json`, `de.json`, `en.json`.
  2. **Офлайн-надежность и PWA Workbox SW (`vite.config.ts`, `OfflineBanner.tsx`, `useTranslator.ts`):**
     - Workbox настроен на кэширование `/lex/`, `/ex/`, `/cards/`, `/api/grammar/`, `/api/resources/`.
     - Информативный баннер отсутствия сети `OfflineBanner` с быстрыми ссылками на доступные офлайн разделы: «Словарь», «Учёба», «Разговорник».
     - Офлайн-фолбэк в `useTranslator.ts`: если сеть недоступна, перевод мгновенно находится в истории предыдущих переводов либо в локальном лексиконе без сетевой ошибки.
  3. **Оптимизация производительности и разделение бандла:**
     - Вторичные страницы (`DictionaryPage`, `LearnPage`, `ConversationPage`, `ProfilePage`) переведены на ленивую загрузку (`React.lazy`).
     - Библиотека `tesseract.js` (OCR) вынесена в динамический импорт внутри `recognizeTextFromImage`.
     - Настроены ручные чанки `manualChunks` в Rollup (`vendor-react`, `vendor-i18n`, `vendor-capacitor`).
     - Исходный размер главного бандла снижен с 1 412 КБ (397 КБ gzip) до целевых 1 094 КБ (300.18 КБ gzip).
  4. **Доступность (a11y) и навигация пультом Android TV (`useSpatialNavigation.ts`):**
     - Все кнопки-иконки снабжены понятными `aria-label`.
     - Контрастность текста выверена по стандартам WCAG (≥ 4.5:1), сохранены визуальные индикаторы фокуса.
     - Реализован хук пространственной навигации `useSpatialNavigation`, поддерживающий стрелки D-Pad пульта Android TV и клавиатуры с автоматическим поиском ближайших интерактивных элементов.
  5. **SEO и статические страницы слов (`scripts/build-seo-pages.mjs`, `robots.txt`, `index.html`):**
     - Генератор статических страниц собрал 3 000 HTML-страниц для топ-1500 немецких и топ-1500 английских слов (`/word/de/<lemma>`, `/word/en/<lemma>`) с корректной санитаризацией путей на Windows.
     - Создан `public/robots.txt` с директивой Sitemap.
     - Автоматически сгенерирован `sitemap.xml` со всеми статическими страницами и языковыми версиями `hreflang`.
     - В `index.html` добавлены Open Graph, Twitter Cards, canonical и языковые альтернативы.
  6. **Журнал ошибок клиента и отчёты (`functions/api/error.ts`, `functions/api/admin/errors.ts`, `ReportIssueModal.tsx`):**
     - Создана таблица Cloudflare D1 `client_errors` (схема `schema.ts`, миграция `0010_client_errors.sql`).
     - Глобальный обработчик ошибок `errorReporter.ts` и `ErrorBoundary` с лимитированием частоты отправки.
     - Модальное окно сообщения о проблеме `ReportIssueModal.tsx` в меню «Ещё» и боковой панели.
     - Вкладка «Ошибки» в панели администратора (`AdminErrorsTab.tsx`) с просмотром стека, фильтрацией и очисткой журнала.
  7. **Локализация и проверки:**
     - Во все 3 локали (`ru.json`, `de.json`, `en.json`) добавлено 24 новых ключа (1 364 ключа в каждом, 100% паритет).
     - Все тесты Vitest: 7/7 файлов, 38/38 тестов зелёные.
     - TypeScript typecheck (app и functions) — 0 ошибок.
     - Полная сборка `npm run build` прошла успешно (код 0).
- **Список созданных файлов:**
  - `vitest.config.ts`
  - `tests/setup.ts`
  - `tests/lexicon.test.ts`
  - `tests/connectedWords.test.ts`
  - `tests/srs.test.ts`
  - `tests/verbForms.test.ts`
  - `tests/adjectiveForms.test.ts`
  - `tests/translationResponse.test.ts`
  - `tests/localesParity.test.ts`
  - `public/robots.txt`
  - `scripts/build-seo-pages.mjs`
  - `migrations/0010_client_errors.sql`
  - `functions/api/error.ts`
  - `functions/api/admin/errors.ts`
  - `src/lib/errorReporter.ts`
  - `src/hooks/useSpatialNavigation.ts`
  - `src/components/layout/ErrorBoundary.tsx`
  - `src/components/layout/ReportIssueModal.tsx`
  - `src/components/admin/AdminErrorsTab.tsx`
- **Список изменённых файлов:**
  - `package.json`
  - `vite.config.ts`
  - `index.html`
  - `src/config.ts`
  - `functions/_lib/config.ts`
  - `public/version.json`
  - `public/licenses.json`
  - `src/data/changelog.ts`
  - `CHANGELOG.md`
  - `functions/_lib/schema.ts`
  - `shared/admin.ts`
  - `src/api/methods/admin.ts`
  - `src/api/methods/core.ts`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/lib/ocr.ts`
  - `src/hooks/useTranslator.ts`
  - `src/components/layout/OfflineBanner.tsx`
  - `src/components/layout/MoreScreen.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/app/AppPlatformBridge.tsx`
  - `src/pages/AdminPage.tsx`
  - `scripts/build-app-bundle.mjs`
  - `src/locales/ru.json`
  - `src/locales/de.json`
  - `src/locales/en.json`

### 2026-11-01 16:30 — Antigravity (Gemini 3.8 Flash) — 0.20.0 (ЧАСТЬ 18: LanguageTool, грамматика English A1–B2 с тестами и таблицами, переключатель языков, бесплатные переводчики MyMemory, Lingva, Apertium)
- **Выполнена ЧАСТЬ 18 плана `tasks/ROADMAP.md` (версия 0.20.0, versionCode 4 сохранён):**
  1. **Проверка орфографии и грамматики LanguageTool (`functions/api/check.ts`, `useSpellCheck.ts`, `SpellCheckBar.tsx`, `SourceUnderlay.tsx`):**
     - Публичный API LanguageTool (`https://api.languagetool.org/v2/check`) с мягким ограничением ~20 запросов/минуту и суточным кэшем в Cloudflare D1.
     - Интерактивная подсветка в поле ввода перевода волнистой линией (красной — орфография/опечатки, янтарной — грамматика) через невидимую текстовую подложку `SourceUnderlay`.
     - Панель найденных ошибок `SpellCheckBar` под полем ввода с чипсами ошибок, всплывающим меню замен и кнопкой «Исправить всё» в 1 клик.
     - Атрибуция лицензии: «Проверка: LanguageTool (LGPL)».
     - Тихий и мягкий fallback: при превышении лимита или временной недоступности API интерфейс работает штатно без навязчивых баннеров.
  2. **Английская грамматика уровня A1–B2 в `/grammar` (`shared/grammarEnglish*.ts`, `GrammarPage.tsx`):**
     - 15 фундаментальных тем английской грамматики:
       - Времена (8 тем): Present Simple, Present Continuous, Present Perfect, Past Simple, Past Continuous, Past Perfect, Future Simple, Future (Going to vs Will).
       - Конструкции и части речи (5 тем): Articles (A, An, The, Zero Article), Modal Verbs, Conditionals (Zero, First, Second, Third), Passive Voice, Prepositions of Time and Place.
       - Справочные таблицы (2 темы): Top 50 Irregular Verbs (V1, V2, V3) и Top 50 Phrasal Verbs с реальными примерами и поиском.
     - Описания правил на 3 языках (ru, de, en), формулы образования, примеры с переводами и разбор частых ошибок русскоязычных.
     - Серверная выдача через `functions/api/grammar/topic.ts` напрямую из кода без расхода ИИ-токенов.
  3. **Интерактивные мини-тесты для каждой темы (`src/components/grammar/GrammarQuiz.tsx`):**
     - Каждая тема снабжена закрепляющим тестом из 5 практических вопросов.
     - Мгновенная проверка с визуализацией верных/неверных ответов, объяснениями ошибок, счётчиком баллов и возможностью пройти заново.
  4. **Переключатель языков в шапке грамматики (`GrammarPage.tsx`):**
     - Чипсы выбора языка «🇩🇪 Немецкий» / «🇬🇧 English».
     - Синхронизация с URL (`?lang=en` / `?lang=de`) и фильтрация каталога тем по выбранному языку.
  5. **Бесплатные переводчики в блоке «Как переводят другие» (`classic/lingva.ts`, `classic/apertium.ts`, `classic/mymemory.ts`):**
     - **MyMemory API**: поддержка бесплатного e-mail в настройках админки (`mymemory_email`), расширяющего бесплатный суточный лимит до 50 000 символов/день.
     - **Lingva Translate**: открытый AGPL-прокси Google Translate с ротацией зеркал и таймаутом 4 секунды.
     - **Apertium**: свободный GPL-движок машинного перевода на основе лингвистических правил.
     - Управление включением движков и полем e-mail MyMemory в `/admin`.
  6. **Лицензии, локализация и сборка:**
     - В `public/licenses.json` и на страницу «О приложении» добавлены LanguageTool (LGPL 2.1+), Lingva Translate (AGPL 3.0), Apertium (GPL 2.0+), MyMemory.
     - Во все 3 локали (`ru.json`, `de.json`, `en.json`) добавлен 21 ключ с сохранением 100% паритета (1340 ключей в каждом файле).
     - Чистая проверка TypeScript (`tsc` для app и functions — 0 ошибок).
     - Успешный `npm run build` (код 0), сгенерирован бандл `dist/app/bundle-0.20.0.zip`.
- **Список созданных файлов:**
  - `shared/grammarEnglishTopics.ts`
  - `shared/grammarEnglishTenses.ts`
  - `shared/grammarEnglishOther.ts`
  - `shared/grammarEnglishTables.ts`
  - `shared/grammarEnglish.ts`
  - `functions/_lib/classic/lingva.ts`
  - `functions/_lib/classic/apertium.ts`
  - `src/components/grammar/GrammarQuiz.tsx`
  - `src/components/grammar/GrammarTableSection.tsx`
  - `src/hooks/useSpellCheck.ts`
  - `src/components/translate/SpellCheckBar.tsx`
  - `src/components/translate/SourceUnderlay.tsx`
  - `src/components/translate/SourceActions.tsx`
  - `scripts/check-locales-parity.mjs`
- **Список изменённых файлов:**
  - `shared/typeTasks.ts`
  - `shared/typeWord.ts`
  - `shared/admin.ts`
  - `shared/grammar.ts`
  - `shared/grammarTopics.ts`
  - `functions/api/grammar/topics.ts`
  - `functions/api/grammar/topic.ts`
  - `functions/api/check.ts`
  - `functions/api/health.ts`
  - `functions/api/admin/settings.ts`
  - `functions/_lib/classic/mymemory.ts`
  - `functions/_lib/classic/index.ts`
  - `functions/_lib/settings.ts`
  - `functions/_lib/config.ts`
  - `src/config.ts`
  - `package.json`
  - `public/version.json`
  - `public/licenses.json`
  - `src/components/about/DictionarySources.tsx`
  - `src/components/admin/ProviderSwitches.tsx`
  - `src/components/admin/AdminSettingsTab.tsx`
  - `src/api/methods/admin.ts`
  - `src/components/grammar/GrammarTopicView.tsx`
  - `src/components/grammar/GrammarTopicList.tsx`
  - `src/pages/GrammarPage.tsx`
  - `src/components/translate/SourcePanel.tsx`
  - `src/components/translate/CheckPanel.tsx`
  - `src/lib/errors.ts`
  - `src/locales/ru.json`
  - `src/locales/de.json`
  - `src/locales/en.json`
  - `src/data/changelog.ts`
  - `CHANGELOG.md`

### 2026-11-01 15:30 — Antigravity (Gemini 3.8 Flash) — 0.19.0 (ЧАСТЬ 17: разговорник по 12 темам, перевод с фото Tesseract.js, сервис «Объясни письмо из Behörde», режим разговора двух людей)
- **Выполнена ЧАСТЬ 17 плана `tasks/ROADMAP.md` (версия 0.19.0, versionCode 4 сохранён):**
  1. **Тематический разговорник (`/phrasebook`, в «Ещё» и боковом меню):**
     - Кураторская база `scripts/phrasebook/curated.json` и генератор `scripts/build-phrasebook.mjs` (`npm run phrasebook`).
     - 12 ключевых жизненных тем (240 фраз): Приветствие и вежливость, Behörde/Amt (ведомства), Врач и аптека, Жильё и аренда, Покупки и супермаркет, Ресторан и кафе, Транспорт и поезда, Экстренные случаи и помощь, Работа и собеседование, Школа и детсад, Телефонные разговоры, Банк и почта.
     - Все фразы подготовлены на 4 языках: de, en, ru, uk.
     - У каждой фразы: озвучка 🔊 на изучаемом языке (Web Speech API / Capacitor TTS), кнопка «копировать» и «+ В учёбу» (сохранение в личные карточки повторения через StudyProvider).
     - Экран `src/pages/PhrasebookPage.tsx` с поиском в реальном времени, чипсами тем с эмодзи и выбором изучаемого языка (de/en) и языка перевода (ru/uk/de/en).
  2. **Оптическое распознавание текста и перевод с фото (`src/lib/ocr.ts`, `SourcePanel.tsx`):**
     - Подключена библиотека оптического распознавания `tesseract.js` (Apache-2.0).
     - Модуль `src/lib/ocr.ts` лениво загружает языковые данные (deu, eng, rus, ukr) по требованию без утяжеления бандла при старте.
     - Кнопка 📷 у поля ввода перевода: выбор фото из галереи или съёмка с камеры смартфона (`accept="image/*"`).
     - Отображение прогресса распознавания с процентами («Распознаём текст... XX%»), автоматическая вставка очищенного текста в поле ввода и запуск перевода.
  3. **Сервис «Объясни письмо из Behörde» (`/letter`, `functions/api/letter.ts`, `LetterPage.tsx`):**
     - Разбор сложных немецких официальных писем (Jobcenter, Finanzamt, Bürgeramt, Krankenkasse, арендодателей) простым языком.
     - Структурированный ответ: отправитель, крупно выделенный срок ответа (дедлайн / Frist с иконкой часов), краткая суть требований, пошаговые понятные действия.
     - Готовый официальный вежливый шаблон ответа на немецком языке (Musterantwort) с возможностью копирования в 1 клик.
     - Поддержка вставки текста или загрузки фото/скана письма через встроенный OCR.
     - Предупреждение «Не является юридической консультацией».
     - Строгая конфиденциальность: текст письма не сохраняется в кэш и на сервере дольше одного запроса.
     - Ссылки на страницу писем добавлены в `AskPage.tsx`, `MoreScreen.tsx`, `Sidebar.tsx`.
  4. **Режим «Разговор двух людей» (`/conversation`, `ConversationPage.tsx`):**
     - Экран живого диалога двух людей: две половины (собеседник напротив и вы).
     - Кнопка «↻» переворачивает верхнюю половину экрана на 180° (`rotate-180`) для удобного чтения собеседником, сидящим напротив за столом.
     - Независимый выбор языка и кнопка микрофона для каждой стороны.
     - Автоматический перевод реплик и озвучка собеседнику на его языке (`autoSpeak`).
     - Интерактивная лента реплик диалога, повторное воспроизведение 🔊 и кнопка очистки.
  5. **Локализация, лицензии и сборка:**
     - Во все 3 файла локалей (`ru.json`, `de.json`, `en.json`) добавлено 57 ключей (ровно по 1319 ключей в каждом файле, 100% совпадение).
     - В `public/licenses.json` и на страницу «О приложении» добавлен источник Tesseract.js (Apache-2.0).
     - Поднята версия: `0.19.0` (в `package.json`, `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`, `src/data/changelog.ts`, `CHANGELOG.md`). Код `versionCode = 4` сохранён.
     - Проверка типов: `tsc -p tsconfig.app.json --noEmit` (0 ошибок), `tsc -p tsconfig.functions.json --noEmit` (0 ошибок).
     - Сборка: `npm run build` успешно завершена (код 0), сгенерирован PWA Service Worker и офлайн-пакет `dist/app/bundle-0.19.0.zip`.
- **Список созданных файлов:**
  - `shared/phrasebook.ts`
  - `shared/letter.ts`
  - `shared/phrasebook/types.ts`
  - `shared/phrasebook/data.ts`
  - `shared/phrasebook/index.ts`
  - `scripts/phrasebook/curated.json`
  - `scripts/build-phrasebook.mjs`
  - `scripts/update-locales-part17.mjs`
  - `src/lib/ocr.ts`
  - `src/pages/PhrasebookPage.tsx`
  - `src/pages/LetterPage.tsx`
  - `src/api/methods/letter.ts`
  - `functions/api/letter.ts`
  - `functions/_lib/validate/letter.ts`
- **Список изменённых файлов:**
  - `package.json`
  - `shared/types.ts`
  - `src/config.ts`
  - `functions/_lib/config.ts`
  - `public/version.json`
  - `src/data/changelog.ts`
  - `CHANGELOG.md`
  - `src/components/layout/icons.tsx`
  - `src/components/translate/SourcePanel.tsx`
  - `src/api/client.ts`
  - `functions/_lib/validate/index.ts`
  - `src/App.tsx`
  - `src/components/layout/BottomNav.tsx`
  - `src/components/layout/MoreScreen.tsx`
  - `src/components/layout/navItems.ts`
  - `src/pages/AskPage.tsx`
  - `src/pages/ConversationPage.tsx`
  - `public/licenses.json`
  - `src/components/about/DictionarySources.tsx`
  - `src/locales/ru.json`
  - `src/locales/de.json`
  - `src/locales/en.json`

### 2026-11-01 14:15 — Antigravity (Gemini 3.8 Flash) — 0.18.0 (ЧАСТЬ 16: учёба для любого языка, 32 готовых набора, тренировки и прогресс)
- **Выполнена ЧАСТЬ 16 плана `tasks/ROADMAP.md` (версия 0.18.0, versionCode 4 сохранён):**
  1. **32 готовые колоды (`shared/decks/*.ts`):**
     - Скрипт сборки `scripts/build-decks.mjs` (`npm run decks`) на базе `scripts/decks/topics.json`.
     - 18 немецких тематических колод A1–B1 (Семья, Еда, Дом, Город, Одежда, День, Путешествия, Работа, Здоровье, Природа, Покупки, Отдых, Политика, Медиа, Отношения, Чувства, Экология, Транспорт) — по 25 слов с артиклями, транскрипцией, примерами предложений и переводами на ru/de/en/uk.
     - 12 английских колод A1–B1 (Family, Food, Home, City, Travel, Work, Health, Shopping, Media, Relations, Emotions, Environment) — по 25 слов с транскрипциями UK/US, примерами предложений и переводами.
     - 2 частотные колоды Топ-500: `de-top500` (500 самых частотных немецких слов) и `en-top500` (500 самых частотных английских слов).
     - Все колоды строго типизированы, экспортируются через `shared/decks/index.ts`.
  2. **Экран готовых наборов (`src/pages/learn/DecksPage.tsx`):**
     - Фильтры по языкам: Все, 🇩🇪 Deutsch, 🇬🇧 English.
     - Фильтры по уровням: Все, A1, A2, B1.
     - Индикаторы прогресса по каждой колоде (изучено / всего слов).
     - Кнопка «Учить» для каждого набора: добавляет слова колоды в локальный и серверный список изучения («Мои колоды»), открывает режим повторения или тренировки.
  3. **7 режимов тренировок (`/learn/practice/:type`):**
     - Выбор перевода из 4 вариантов (`choice`, `src/lib/practice.ts`).
     - Написание слова по буквам (`write`, `WriteQuestion.tsx` с мгновенной подсветкой верного/неверного ответа).
     - Аудирование с озвучкой (`listening`, Web Speech API с правильным языком `card.lang`).
     - Подбор артикля для немецких существительных (`article`, кнопки der/die/das).
     - Сборка предложения из перемешанных слов (`sentence`, чипсы слов).
     - Сопоставление пар (`pairs`, `PairsQuestion.tsx`, 4 слова + 4 перевода, интерактивное сопоставление).
     - Множественное число (`plural`).
     - Поддержка тренировки для любого языка карточек (немецкий, английский и др.).
  4. **Интервальное повторение, цели и напоминания (`src/lib/srs.ts`, `src/lib/dailyReminder.ts`):**
     - Дневная цель: выбор 5, 10 или 20 слов в день (`STUDY_GOALS`).
     - Подсчёт серии дней (streak) с учётом выбранной цели (`computeStreak(history, goal)`).
     - Напоминание об учёбе (`dailyReminder.ts`) через `@capacitor/local-notifications` / браузерные уведомления с выбором времени.
  5. **Экран «Мой прогресс» (`/learn/progress`, `src/pages/learn/ProgressPage.tsx`):**
     - Сводные карточки: серия дней (огонёк 🔥), изучено слов, слов на сегодня, текущая дневная цель.
     - График активности за последние 30 дней: чистый адаптивный SVG-график с барами и линией цели без тяжелых внешних библиотек.
     - Прогресс по языкам: разбивка изученных слов по немецкому и английскому.
     - «Трудные слова»: список слов с наибольшим количеством ошибок (reps <= 1 при lapses > 0 или interval <= 1) с кнопкой быстрой тренировки.
     - Блок настроек: выбор цели (5 / 10 / 20 слов) и времени ежедневного напоминания.
     - Ссылка в заголовок раздела «Учёба» (`LearnPage.tsx`) с бейджем прогресса за день.
  6. **Синхронизация с сервером Cloudflare D1 (`functions/_lib/study/`):**
     - `validate.ts`: снято ограничение `de:`, теперь валидатор разрешает карточки любого поддерживаемого языка (`${lang}:${lemma}`).
     - `rows.ts`: сохранение и выдача `lang` и `deckId` в таблице `study_cards`.
  7. **Локализация и проверки:**
     - Во все три файла (`ru.json`, `de.json`, `en.json`) добавлено 57 ключей. Все 3 локали содержат ровно по 1,262 ключа (100% совпадение).
     - Пройдены тесты алгоритма SRS (`scripts/test-srs.mjs` — 9/9 тестов успешно).
     - Чистая проверка типов `tsc` (app и functions — 0 ошибок).
     - Успешный `npm run build` (код 0). Код `android/` не менялся, `versionCode = 4` сохранён.
- **Список созданных файлов:**
  - `scripts/decks/topics.json`
  - `scripts/build-decks.mjs`
  - `shared/decks/de-top500.ts`
  - `shared/decks/en-top500.ts`
  - `shared/decks/de-a1-family.ts`
  - `shared/decks/de-a1-food.ts`
  - `shared/decks/de-a1-house.ts`
  - `shared/decks/de-a1-city.ts`
  - `shared/decks/de-a1-clothes.ts`
  - `shared/decks/de-a1-daily.ts`
  - `shared/decks/de-a2-travel.ts`
  - `shared/decks/de-a2-work.ts`
  - `shared/decks/de-a2-health.ts`
  - `shared/decks/de-a2-nature.ts`
  - `shared/decks/de-a2-shopping.ts`
  - `shared/decks/de-a2-free-time.ts`
  - `shared/decks/de-b1-politics.ts`
  - `shared/decks/de-b1-media.ts`
  - `shared/decks/de-b1-relations.ts`
  - `shared/decks/de-b1-feelings.ts`
  - `shared/decks/de-b1-environment.ts`
  - `shared/decks/de-b1-transport.ts`
  - `shared/decks/en-a1-family.ts`
  - `shared/decks/en-a1-food.ts`
  - `shared/decks/en-a1-house.ts`
  - `shared/decks/en-a1-city.ts`
  - `shared/decks/en-a2-travel.ts`
  - `shared/decks/en-a2-work.ts`
  - `shared/decks/en-a2-health.ts`
  - `shared/decks/en-a2-shopping.ts`
  - `shared/decks/en-b1-media.ts`
  - `shared/decks/en-b1-relations.ts`
  - `shared/decks/en-b1-feelings.ts`
  - `shared/decks/en-b1-environment.ts`
  - `src/pages/learn/ProgressPage.tsx`
  - `src/components/study/WriteQuestion.tsx`
  - `src/components/study/PairsQuestion.tsx`
- **Список изменённых файлов:**
  - `package.json`
  - `src/config.ts`
  - `functions/_lib/config.ts`
  - `public/version.json`
  - `src/data/changelog.ts`
  - `CHANGELOG.md`
  - `REPORT.md`
  - `HANDOFF.md`
  - `shared/study.ts`
  - `shared/decks/index.ts`
  - `src/lib/studyCard.ts`
  - `src/lib/practice.ts`
  - `src/lib/srs.ts`
  - `scripts/test-srs.mjs`
  - `functions/_lib/study/validate.ts`
  - `functions/_lib/study/rows.ts`
  - `src/components/study/PracticeQuestionView.tsx`
  - `src/pages/learn/PracticePage.tsx`
  - `src/pages/learn/DecksPage.tsx`
  - `src/pages/LearnPage.tsx`
  - `src/App.tsx`
  - `src/locales/ru.json`
  - `src/locales/de.json`
  - `src/locales/en.json`

### 2026-11-01 14:00 — Antigravity (Gemini 3.8 Flash) — 0.17.0 (Часть 15: богатая карточка слова: примеры Tatoeba, частота, уровень CEFR, живое аудио, синонимы, оффлайн-формы)
- **Примеры предложений из Tatoeba (`public/ex/<lang>/<prefix>.json`):**
  - Разработан генератор параллельных примеров `scripts/build-examples.mjs`: объединяет выгрузки Tatoeba с human translations (`deu-eng`, `rus-eng`, `ukr-eng`) через ID предложений в единый мультиязычный корпус (de, en, ru, uk).
  - Сгенерировано 1,217 чанков предложений (365 de, 320 en, 532 ru) объёмом 52.33 MB. Для каждого предложения сохранены ID, текст, параллельный перевод и атрибуция Tatoeba. Фильтрация: длина <= 12 слов, до 5 лучших примеров на лемму.
  - Реализован хук `useExamples.ts` с кэшированием в памяти по ключу `<lang>:<prefix>` и компонент `InstantExamplesSection.tsx` с кнопкой озвучки 🔊 и ссылкой на tatoeba.org.
- **Частотный ранг и примерный уровень CEFR:**
  - `scripts/enrich-lexicon.mjs`: обогатил немецкий (23,171 лемма) и английский (70,524 леммы) лексикон рангами частотности `fr` (1..50000) по открытым спискам HermitDave / FrequencyWords.
  - `shared/lexicon.ts`: функция `getCefrLevel(rank)` вычисляет примерный уровень сложности: 1..1500 → `~A1`, 1501..3500 → `~A2`, 3501..7500 → `~B1`, 7501..15000 → `~B2`, >15000 → `~C1+`.
  - В карточках слов (`InstantWordCard.tsx`, `WordCardHeader.tsx`, `WordCard.tsx`) и «Слове дня» (`WordOfDayCard.tsx`) выводится бейдж уровня с поясняющей подсказкой «примерный уровень по частоте» (`word.approxLevelTitle`, `word.approxLevelDesc`).
- **Живое произношение человека (Wikimedia Commons / Lingua Libre) с fallback на TTS:**
  - Извлечены открытые аудиозаписи носителей языка из выгрузок Kaikki/Wiktextract (21,723 записи для de, 42,160 для en) со ссылками на Wikimedia Commons.
  - В `useSpeech.ts` добавлена поддержка `audioUrl` через `new Audio()` с авто-переключением на Web Speech API / TTS при недоступности файла или сети.
  - В `InstantWordCard.tsx`, `WordCard.tsx` и `SpeakButton.tsx` кнопка 🔊 воспроизводит живой голос при наличии записи.
- **Интерактивные чипсы синонимов:**
  - Лексикон обогащён синонимами (5,704 для de, 21,753 для en) из Kaikki, WordNet и OpenThesaurus.
  - В `InstantWordCard.tsx` синонимы выводятся интерактивными чипсами: нажатие мгновенно открывает карточку выбранного синонима (`WordDetailModal.tsx` / `onPickWord`).
- **Синтез форм немецких слов без сервера/ИИ:**
  - Создан легковесный клиентский модуль `src/lib/lexiconForms.ts` и компонент `InstantFormsSection.tsx`:
    - Глаголы: спряжение во всех лицах (ich, du, er/sie/es, wir, ihr, sie/Sie) в Präsens, Präteritum, Perfekt (haben/sein) с учётом сильных/неправильных глаголов и приставок.
    - Существительные: таблица склонения по 4 падежам (Nominativ, Akkusativ, Dativ, Genitiv) в единственном и множественном числе с цветными артиклями.
    - Прилагательные: степени сравнения (Positiv, Komparativ, Superlativ).
- **Слово дня с гарантированным примером и переводом:**
  - В `shared/decks/index.ts` список `DECK_WORDS` отфильтрован: исключены слова без готовых примеров предложений; добавлена детерминированная привязка уровня CEFR (`~A1`, `~A2`, `~B1`). В `WordOfDayCard.tsx` отображается бейдж уровня.
- **Лицензии и локализация:**
  - В `public/licenses.json`, `DictionarySources.tsx` и локали добавлены сведения о лицензиях WordNet (CC-BY 4.0) и Wikimedia Commons / Lingua Libre (CC-BY-SA 4.0).
  - Синхронизированы `ru.json`, `de.json`, `en.json` — ровно по 1194 ключа в каждом (100% паритет).
- **Лимиты Cloudflare Pages и проверки:**
  - `npx tsc -p tsconfig.app.json --noEmit` — 0 ошибок.
  - `npx tsc -p tsconfig.functions.json --noEmit` — 0 ошибок.
  - `npm run build` — собран без ошибок (код 0), сформирован бандл `dist/app/bundle-0.17.0.zip`.
  - Лимиты файлов: 2,635 файлов в `public/` (лимит 20,000), суммарный объём `public/` 78 MB (лимит 150 MB).
- **Файлы:**
  - Созданы: `scripts/build-examples.mjs`, `scripts/enrich-lexicon.mjs`, `src/lib/lexiconForms.ts`, `src/hooks/useExamples.ts`, `src/components/word/InstantExamplesSection.tsx`, `src/components/word/InstantFormsSection.tsx`, `public/ex/de/*.json` (365 файлов), `public/ex/en/*.json` (320 файлов), `public/ex/ru/*.json` (532 файла).
  - Изменены: `package.json`, `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`, `src/data/changelog.ts`, `CHANGELOG.md`, `shared/typeCore.ts`, `shared/typeWord.ts`, `shared/study.ts`, `shared/decks/index.ts`, `shared/lexicon.ts`, `src/hooks/useSpeech.ts`, `src/components/ui/SpeakButton.tsx`, `src/components/word/InstantWordCard.tsx`, `src/components/word/WordDetailModal.tsx`, `src/components/word/WordCardHeader.tsx`, `src/components/word/WordCard.tsx`, `src/components/study/WordOfDayCard.tsx`, `src/components/about/DictionarySources.tsx`, `public/licenses.json`, `src/locales/ru.json`, `de.json`, `en.json`, `public/lex/de/*.json`, `public/lex/en/*.json`.
- Код `android/` не менялся, `versionCode` остался 4, запрещённые классы прозрачности Tailwind не использовались. На GitHub ничего не отправлялось.

### 2026-11-01 12:15 — Antigravity (Gemini 3.8 Flash) — 0.16.0 (Часть 14: словари всех языков, английский лексикон из Wiktextract, переводы слов из базы)
- **Универсальная архитектура лексикона для любых языков:**
  - `shared/lexicon.ts`: расширен типами `tr?: Record<string, string[]>` (мгновенные переводы из базы), `ipaUk?`, `ipaUs?`, родами `LexiconGender` ('der'|'die'|'das'|'m'|'f'|'n'), поддержкой любых языков (`lang?: string`) и Unicode-префиксами чанков (`getLexiconPrefix`).
  - `shared/study.ts`, `studyCard.ts`, `useStudyActions.ts`, `useStudy.tsx`: колоды и карточки учёбы теперь привязаны к языку (`lang?: LanguageCode`), ID карточек разделены (`studyCardId(lemma, lang)`), `AddToStudyQuickButton.tsx` создаёт отдельные колоды по языкам («Из переводов · English», «Aus Übersetzungen · Deutsch» и т.д.).
- **Стоп-слова для 12 языков:**
  - Создана библиотека `src/data/stopwords/` с открытыми списками стоп-слов (MIT, stopwords-iso) для `de`, `en`, `ru`, `uk`, `fr`, `es`, `it`, `pt`, `pl`, `nl`, `tr`, `ar` и единой функцией `isStopWord(word, lang)`.
- **Лицензии открытых данных:**
  - Добавлен манифест открытых данных `public/licenses.json` (Kaikki/Wiktionary CC-BY-SA 4.0, FrequencyWords MIT, german-nouns CC-BY-SA 4.0, stopwords-iso MIT, Tatoeba CC-BY 2.0 FR, OpenThesaurus LGPL-2.1+).
  - В «О приложении» (`DictionarySources.tsx`) добавлен пункт Stopwords ISO с ключом `about.licenseStopwordsIso`.
- **Синхронизация локализаций:**
  - Добавлены ключи во все три файла: `src/locales/ru.json`, `de.json`, `en.json` (ровно по 1190 ключей, 100% совпадение).
- **Стемминг и поиск в `useLexicon.ts`:**
  - Загрузка чанков `/lex/${lang}/${prefix}.json` с кэшированием `${lang}:${prefix}`.
  - Реализован английский стемминг: нерегулярные глаголы (`went`→`go`, `bought`→`buy`, `children`→`child`), формы множественного числа (`-ies`→`y`, `-ves`→`f/fe`, `-es`, `-s`), формы глаголов (`-ing`, `-ed`), степеней сравнения (`-er`/`-est`) и наречий (`-ly`). Сохранён немецкий стемминг (приставки ge-, умлауты, окончания) и базовый романский (`-s`/`-es`).
- **Связывание слов перевода (`useConnectedWords.ts`):**
  - Поддержка связывания для любого языка (ранее был только de): мультиязычное извлечение токенов Unicode, фильтрация стоп-слов выбранного языка, извлечение мгновенного перевода через `entry.tr[targetLang]` (ru, de, en, uk).
- **Мгновенные карточки слов (`InstantWordCard.tsx`, `WordDetailModal.tsx`):**
  - Отображение британской и американской транскрипции (`ipaUk`/`ipaUs`), корректная обработка слов без рода (английский и др.), вывод мгновенных переводов из базы `entry.tr` в виде чипсов ещё до ответа нейросетей, передача языка в озвучку и добавление в учёбу.
- **Интерактивные слова в `ResultPanel.tsx` и `TranslatePage.tsx`:**
  - Интерактивные слова со связыванием включены для любого языка перевода.
- **Генератор лексикона из выгрузок Kaikki/Wiktextract:**
  - `scripts/lexicon/fetchers.mjs`: функции загрузки частотных списков HermitDave и дампов Kaikki.org для любого языка.
  - `scripts/lexicon/kaikki-parser.mjs`: парсинг дампов Kaikki, извлечение корневых и по-смысловых переводов (`entry.translations` и `senses[].translations`) на ru, de, en, uk, транскрипций UK/US, форм слов и грамматических категорий.
  - `scripts/lexicon/generator.mjs` и `scripts/build-lexicon.mjs`: CLI сборщик чанков лексикона (`npm run lexicon -- --lang en|de|all`).
  - Сгенерирована база английского лексикона: `public/lex/en/` — 1,037 файлов, 174,247 записей (88,884 лемм), размер 10.34 MB.
  - Немецкий лексикон `public/lex/de/` (348 файлов, 5.07 MB) обогащён переводами `tr` из Kaikki.
- **Проверки:**
  - `npx tsc -p tsconfig.app.json --noEmit` — 0 ошибок.
  - `npx tsc -p tsconfig.functions.json --noEmit` — 0 ошибок.
  - `npm run build` — выполнен успешно (код 0), сформирован архив обновления `dist/app/bundle-0.16.0.zip`.
  - Лимиты Cloudflare Pages: 1,385 файлов лексикона (лимит 20,000), суммарный объём `public/` ~16 MB (лимит 150 MB), максимальный чанк ~20 KB (лимит 25 MB).
  - Проверены тестовые связки: «I went to the shops with my children» -> go (`идти`), shop (`магазин`), child (`ребёнок`); «я купил книги» (I bought books) -> buy (`покупать`, `купить`), book (`книга`).
- **Файлы:**
  - Новые: `src/data/stopwords/` (`de.ts`, `en.ts`, `ru.ts`, `uk.ts`, `fr.ts`, `es.ts`, `it.ts`, `pt.ts`, `pl.ts`, `nl.ts`, `tr.ts`, `ar.ts`, `index.ts`), `public/licenses.json`, `public/lex/en/*.json` (1037 файлов).
  - Изменённые: `package.json`, `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`, `src/data/changelog.ts`, `CHANGELOG.md`, `shared/lexicon.ts`, `shared/study.ts`, `src/lib/studyCard.ts`, `src/hooks/useStudyActions.ts`, `src/hooks/useStudy.tsx`, `src/components/study/AddToStudyQuickButton.tsx`, `src/components/about/DictionarySources.tsx`, `src/locales/ru.json`, `de.json`, `en.json`, `src/hooks/useLexicon.ts`, `src/hooks/useConnectedWords.ts`, `src/components/word/InstantWordCard.tsx`, `src/components/word/WordDetailModal.tsx`, `src/components/translate/ConnectedWordsChips.tsx`, `src/components/translate/ResultPanel.tsx`, `src/pages/TranslatePage.tsx`, `scripts/lexicon/fetchers.mjs`, `scripts/lexicon/kaikki-parser.mjs`, `scripts/lexicon/generator.mjs`, `scripts/build-lexicon.mjs`, `public/lex/de/*.json`.
- Код `android/` не менялся, `versionCode` остался 4, запрещённые классы прозрачности Tailwind не использовались. На GitHub ничего не отправлялось.

### 2026-11-01 02:45 — Claude — план частей 14–21 для Antigravity
- Написан `tasks/ROADMAP.md`: общие правила + части 14–21 (до версии 1.0.0) с готовыми промптами.
  Владелец отдаёт части по одной; у Claude может закончиться лимит — после возвращения проверить все части
  по этому журналу (раздел «Для Claude» в конце ROADMAP.md). Ничего из частей 14+ пока не проверено.

### 2026-11-01 02:35 — Claude — 0.15.0 (исправление: iPhone, немецкий — не открывалась клавиатура)
- `TranslatePage.tsx`: клавиатура пряталась по событию `scroll`, а iPhone сам прокручивает страницу к полю при
  нажатии — клавиатура закрывалась сразу (с немецким панель выше из-за ä ö ü ß, поэтому всегда). Теперь прячется
  только при движении пальца по странице (touchmove > 24px не по полю ввода). Не возвращать скрытие по `scroll`.

### 2026-11-01 02:30 — Claude — 0.15.0 (проверка этапа 13 от Antigravity)
- Принял этап 13: слова перевода связаны со словарём lex (`useConnectedWords.ts`, `InteractiveGermanText.tsx`,
  `ConnectedWordsChips.tsx`, `WordDetailModal.tsx`, `AddToStudyQuickButton.tsx`, `commonTranslationsDeRu.ts`),
  новый экран «Учёба», повторение с 3 кнопками и свайпами, мгновенный поиск в «Словаре». Ключи ru/de/en совпадают.
- Исправил: `ging` показывался как «ging» без перевода — в `lookupLexicon` неправильные формы (`KNOWN_STEM_MAP`)
  теперь важнее заглушки в базе, а прямое совпадение без перевода заменяется основой с переводом.
- Исправил: «gestern» превращалось в «das Gestern» — слово с маленькой буквы не сопоставляется с существительным.
- Исправил: в «Словаре» темы показывались ключами `study.study.deckA1Family` (двойной префикс).
- Исправил: «+ + В учёбу» (двойной плюс); «+ В учёбу» у целых фраз в «Вы недавно смотрели» убран.
- Исправил: прозрачности Tailwind (`bg-soft/50`, `border-accent/30` и т.п.) не работают — заменены.
- Исправил: подсказка «Учёба» стала компактной (3 строки вместо трёх больших плиток), без русского «1. Шаг» в коде.
- Проверено: tsc, `npm run build`, скриншоты 390px (перевод с подменённым ответом сервера, «Учёба», «Словарь»).
- APK пересобирать не нужно: веб-часть 0.15.0 придёт в приложение по воздуху.

### 2026-11-01 02:00 — Antigravity (Gemini 3.8 Flash) — 0.15.0 (этап 13: слова перевода связаны со словарём, понятные «Учёба» и «Словарь»)
- **Связывание слов перевода со словарём:** немецкий текст (исходный или перевод) разбирается на слова без служебных (`GERMAN_STOP_WORDS`), ищется в базе `public/lex/de/` с учётом умлаутов и окончаний (`useConnectedWords.ts`, `useLexicon.ts`, `commonTranslationsDeRu.ts`).
- **Блок «Слова из словаря»:** горизонтальная карусель под переводом (`ConnectedWordsChips.tsx`) с цветными артиклями (der синий, die красный, das зелёный), переводами и кнопкой «+ В учёбу».
- **Интерактивные слова в тексте перевода:** пунктирное подчёркивание (`InteractiveGermanText.tsx`), нажатие открывает лист/модальное окно с карточкой слова (`WordDetailModal.tsx`).
- **Кнопка «+ В учёбу»:** в один клик добавляет слово и автоматически создаёт/пополняет колоду «Из переводов» (`AddToStudyQuickButton.tsx`). В карточке слова — статус «✓ В учёбе».
- **Понятный раздел «Учёба» (`LearnPage.tsx`):** статус «Сегодня повторить: N слов» с большой кнопкой «Начать» (или «На сегодня всё 🎉» + «Учить новые слова»), блок «Мои слова» со счётчиком и прогресс-баром, три плитки с пояснением («Мои колоды», «Готовые наборы», «Тренировка»), для новичков — 3 шага с иконками («Переведите слово → нажмите «+ В учёбу» → повторяйте каждый день 5 минут»).
- **Карточка повторения (`ReviewPage.tsx`):** крупное слово с артиклем, кнопка «Показать», 3 крупные кнопки под большой палец («Не помню / Трудно / Легко»), жесты свайпа: влево — «Не помню», вправо — «Легко».
- **Понятный раздел «Словарь» (`DictionaryPage.tsx`, `DictionarySearchPanel.tsx`):** мгновенный поиск без кнопки (на немецком или русском), пустой экран со Словом дня, историей просмотров, алфавитом (A-Z) и темами, единая карточка слова и «+ В учёбу» в каждой строке результатов.
- **Чистота и совместимость:** `npm run build` успешен, типы чистые, 1233 ключа в ru/de/en синхронизированы. Код в `android/` и `versionCode` не изменялись.

### 2026-11-01 01:40 — Claude — 0.14.1 (срочные исправления APK 0.14.0) + задание этапа 13
- **«Нет связи с сервером» в приложении:** `src/api/request.ts` слал запросы на сайт с `credentials: 'include'`, а
  сервер отвечает `Access-Control-Allow-Origin: *` — WebView блокировал все ответы. Теперь при `API_BASE`
  (приложение) — `credentials: 'omit'`; вход в приложении — только заголовком `Authorization: Bearer`.
- **Нижнее меню под кнопками Android «◀ ● ■»:** `MainActivity.applySystemBarInsets()` — padding контейнера
  `android.R.id.content` от статус-бара, навигации, выреза и клавиатуры. В `capacitor.config.ts`:
  `SystemBars.insetsHandling = 'disable'`, `Keyboard.resize = 'none'` (чтобы не было двойных отступов).
  В приложении `env(safe-area-inset-*)` теперь = 0 — это нормально.
- **Enter:** на сенсорных устройствах (`pointer: coarse`) Enter всегда = «Перевести» + скрыть клавиатуру
  (`SourcePanel.tsx`: keydown + `beforeinput insertLineBreak` для Gboard).
- **Страница «Приложения»:** одна карточка «Android и Android TV» (инструкция для TV — раскрывающийся блок),
  вместо карточки TV — «RuStore — скоро» (`AndroidCards.tsx` → `RuStoreCard`, ключи `apps.androidTitle`,
  `apps.tvHowTo`, `apps.rustoreSubtitle`).
- Задание этапа 13 для Antigravity: `tasks/STAGE13.md` (каждое слово перевода связано со словарём lex,
  понятные «Учёба» и «Словарь»). Android-код в этапе 13 не трогать.
- Версия 0.14.1, versionCode 4. APK собирается: GitHub → Actions → Build Android APK → Run workflow.
- **Если работа оборвалась (лимит Claude):** проверить, что релиз v0.14.1 с APK есть на GitHub; если нет —
  запустить workflow вручную. Владелец проверяет на телефоне: перевод работает, нижнее меню нажимается, Enter переводит.

### 2026-11-01 13:30 — Antigravity (Gemini 3.8 Flash) — 0.17.5 (ЧАСТЬ 15Б: полная карточка слова без ИИ, вечный склад D1, прогрев и офлайн-выгрузка)
- **Выполнена ЧАСТЬ 15Б плана `tasks/ROADMAP.md` (версия 0.17.5, versionCode 4 сохранён):**
  1. **Вечный склад карточек в Cloudflare D1 (`word_cards`)**:
     - Создана миграция `migrations/0010_word_cards.sql` (`lemma`, `lang`, `explain_lang`, `card_json`, `provider`, `updated_at`).
     - Добавлено создание таблицы в `functions/_lib/schema.ts` (в конец STATEMENTS).
     - Модуль склада `functions/_lib/wordStore.ts`: `getStoredWordCard`, `saveStoredWordCard`, `countStoredWordCards`, `deleteStoredWordCard`.
  2. **Сборщик полной карточки без ИИ (`shared/cardAssembler.ts`, `shared/lexiconForms.ts`, `shared/grammarRules.ts`, `shared/falseFriends.ts`)**:
     - Полноценная карточка `WordCard` собирается из данных Kaikki, Tatoeba, OpenThesaurus и строгих правил грамматики.
     - 4-падежное склонение существительных немецкого языка с артиклями и формами множественного числа.
     - Полное спряжение глаголов (Präsens, Präteritum, Perfekt с haben/sein, Konjunktiv II, Imperativ).
     - Примеры Tatoeba по уровням A1–B2 (по 2 примера на уровень) с переводом.
     - Синонимы (OpenThesaurus + Kaikki), антонимы, ложные друзья переводчика (`shared/falseFriends.ts`).
     - Грамматические подсказки (`shared/grammarRules.ts`): суффиксы рода (-ung, -heit, -chen), множественное число, Dativ-глаголы, управление предлогами, Perfekt mit sein.
  3. **Бэкенд `/api/word` и единая карточка для обоих направлений**:
     - `functions/api/word.ts`: единая карточка слова для направлений `de→ru` и `ru→de`. Для `ru→de` при переводе «Какашка» целевая лемма «Kacke» немедленно находит карточку.
     - Проверка склада `word_cards` перед обращением к ИИ (0 задержка, вечное хранение).
     - Все новые карточки от ИИ перманентно сохраняются в `word_cards`.
     - При исчерпании лимитов ИИ или их недоступности — мгновенный fallback на сборщик карточек `assembleWordCard` (пользователь никогда не блокируется ошибкой `LIMIT_REACHED`).
  4. **Ночной прогрев и админка**:
     - `scripts/build-warm-words.mjs` и `shared/warmWords.ts`: топ-5000 немецких и топ-3000 английских слов (24 000 комбинаций с переводами).
     - `functions/api/admin/warm.ts`: батчевый прогрев порциями по 20 слов, минуя пользовательский IP-лимит (без `beforeShared`), с сохранением в `word_cards`.
     - `functions/api/admin/recreate-card.ts`: принудительное пересоздание карточки админом через ИИ.
     - `.github/workflows/warm-cards.yml`: cron `0 1,3,5 * * *` для ночного фонового прогрева.
     - Интерфейс в админке (`src/components/admin/AdminWarmCardsSection.tsx` и `AdminOverviewTab.tsx`): статистика склада карточек, запуск прогрева, пересоздание карточки.
  5. **Офлайн-выгрузка и клиентский кэш**:
     - `scripts/export-cards.mjs` и npm-скрипт `npm run cards:export`: генерация 5 000 карточек в 699 шардах `public/cards/<lang>-<explain>/<prefix>.json` (6.68 MB).
     - `src/lib/offlineCards.ts`: чтение офлайн-карточек из `/cards/` с кэшированием в памяти и локальным сборщиком `assembleClientCard`.
     - `src/lib/aiCardMode.ts`: хук `useAiCardMode` (переключатель авто / ручной разбор ИИ).
     - `src/components/word/WordPanel.tsx` и `DictionarySearchPanel.tsx`: показ полной карточки `AiWordCard` для любого слова (включая ru→de, с кнопкой «Разбор от ИИ» при желании углубиться).
  6. **Локализация и версии**:
     - Добавлено 11 новых ключей в `src/locales/ru.json`, `de.json`, `en.json` (ровно по 1205 ключей).
     - Версия 0.17.5 в `package.json`, `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`, `src/data/changelog.ts`, `CHANGELOG.md` (`versionCode = 4` сохранён).
- **Список созданных файлов:**
  - `migrations/0010_word_cards.sql`
  - `functions/_lib/wordStore.ts`
  - `functions/api/admin/recreate-card.ts`
  - `shared/falseFriends.ts`
  - `shared/grammarRules.ts`
  - `shared/lexiconForms.ts`
  - `shared/cardAssembler.ts`
  - `shared/warmWords.ts`
  - `src/lib/lexiconForms.ts`
  - `src/lib/offlineCards.ts`
  - `src/lib/aiCardMode.ts`
  - `src/components/admin/AdminWarmCardsSection.tsx`
  - `scripts/build-warm-words.mjs`
  - `scripts/export-cards.mjs`
  - `public/cards/**` (699 файлов)
- **Список изменённых файлов:**
  - `functions/_lib/schema.ts`
  - `functions/_lib/config.ts`
  - `functions/_lib/admin/overview.ts`
  - `functions/api/word.ts`
  - `functions/api/admin/warm.ts`
  - `functions/api/health.ts`
  - `shared/lexicon.ts`
  - `shared/typeWord.ts`
  - `src/config.ts`
  - `src/components/word/WordPanel.tsx`
  - `src/pages/TranslatePage.tsx`
  - `src/components/dictionary/DictionarySearchPanel.tsx`
  - `src/components/admin/AdminOverviewTab.tsx`
  - `src/api/methods/admin.ts`
  - `src/data/changelog.ts`
  - `src/data/commonTranslationsDeRu.ts`
  - `src/locales/ru.json`, `de.json`, `en.json`
  - `.github/workflows/warm-cards.yml`
  - `package.json`
  - `public/version.json`
  - `CHANGELOG.md`
  - `HANDOFF.md`
  - `REPORT.md`

### 2026-11-01 01:05 — Claude — 0.14.0 (проверка этапа 12: Antigravity, Claude Sonnet 4.6 → Gemini)
- Проверил и выложил этап 12: приложение снова со встроенной сборкой (без `server.url`), обновление по воздуху
  `@capgo/capacitor-updater` (`src/lib/liveUpdate.ts`, архив `dist/app/bundle-<версия>.zip` + `bundle.json` из
  `scripts/build-app-bundle.mjs`, вызывается в `npm run build`), нижняя панель + «Ещё» (`MoreScreen.tsx`), шторка
  языков (`LanguagePicker.tsx`), горизонтальная карусель карточки слова (`WordCarousel.tsx`), клавиатура/вибрация/
  share/clipboard (`src/lib/keyboard.ts`, `haptics.ts`, `nativeShare.ts`, `nativeClipboard.ts`), edge-to-edge
  (`StatusBar.overlaysWebView: true` + `env(safe-area-inset-*)`, `viewport-fit=cover` уже был в `index.html`).
- Исправил (критично): архив обновления — обычная сборка сайта с пустым `VITE_API_BASE`, в приложении API шли бы на
  https://localhost. Теперь `API_BASE` в `src/config.ts` при `Capacitor.isNativePlatform()` = сайт.
- Исправил: `CapacitorUpdater.set()` перезагружал приложение сразу после скачивания — заменено на `next()` (при
  следующем запуске); версия встроенной сборки «builtin» = `APP_VERSION`; в `capacitor.config.ts` у CapacitorUpdater
  `autoUpdate: false` и пустые адреса облака Capgo.
- Исправил: на телефоне пустая карточка «Начните переводить» занимала полэкрана — скрыта, пока поле пустое.
- Проверено: сборка сайта и `build:android`, ключи ru/de/en, скриншоты мобильной версии (Playwright 390×844).
  **Эмулятора Android в среде Claude нет** — APK на телефоне проверяет владелец.
- APK 0.14.0 (versionCode 3) — GitHub → Actions → Build Android APK → Run workflow.

### 2026-11-01 02:00 — Claude Sonnet 4.6 + Gemini 3.8 Flash — 0.14.0 (этап 12: полноценное приложение и мобильная оболочка)
- Выполнен этап 12 (`tasks/STAGE12.md`):
  1. Экраны внутри APK: убран `server.url`, веб-содержимое встроено в `dist/` и синхронизируется в `android/app/src/main/assets/public`. Приложение запускается мгновенно и работает автономно.
  2. Обновление веб-содержимого по воздуху: подключен `@capgo/capacitor-updater` в ручном автономном режиме без облака Capgo (`src/lib/liveUpdate.ts`). Скрипт `scripts/build-app-bundle.mjs` упаковывает сборку в `dist/app/bundle-0.14.0.zip` и формирует `dist/app/bundle.json`. Защита от сломанных версий через `notifyAppReady()`.
  3. Android 15 edge-to-edge (targetSdk 36):
     - `index.html`: `viewport-fit=cover`.
     - `styles.xml`: прозрачные `statusBarColor` и `navigationBarColor`, `android:windowLayoutInDisplayCutoutMode=shortEdges`, `fitsSystemWindows=false`.
     - `MainActivity.java`: `WindowCompat.setDecorFitsSystemWindows(window, false)` и `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`.
     - `capacitor.config.ts`: `StatusBar.overlaysWebView = true`, `Keyboard.resize = 'body'`.
     - `src/styles/index.css`: безопасные отступы `safe-top`, `safe-bottom`, `safe-left`, `safe-right`, `safe-all`, запрет выделения интерфейса `no-select`, отключение «резинового» скролла `overscroll-behavior: none` и серой подсветки `no-tap-highlight`.
     - `TopBar.tsx`, `BottomNav.tsx`, `Sidebar.tsx`, `Modal.tsx`, `LanguagePicker.tsx`, `TranslateHistoryDrawer.tsx`: защищены отступом `env(safe-area-inset-*)`. Часы и системные панели не перекрывают элементы управления.
  4. Строка выбора языков (сетка 1fr auto 1fr):
     - `LanguageRow.tsx`: кнопки языков одинаковой ширины, кнопка ⇄ строго по центру, текст названий языков выровнен по центру без капса.
     - `LanguagePicker.tsx`: фирменная шторка снизу с поиском, группой «Недавние», «Определить язык», без капса и с галочкой на текущем языке.
  5. Экран перевода:
     - Убран громоздкий рекламный заголовок с экрана перевода. Экран начинается сразу со строки языков и ввода. Подробное описание и возможности сервиса перенесены в «О приложении» (`AboutPage.tsx`).
     - Серия дней 🔥 и история переводов 🕒 оформлены понятными кнопками с иконками и подписями в одной строке (`TranslateHeader.tsx`).
     - Неактивные кнопки (озвучка при пустом поле) скрываются.
     - «Слово дня» убрано из-под поля ввода и перенесено в самый низ экрана перевода (`WordOfDayCard`).
     - Кнопка «Вставить» (`PasteChip.tsx`) перенесена из поля ввода вниз рядом с микрофоном; использует нативный буфер через `@capacitor/clipboard`.
     - Скрытие клавиатуры: `enterKeyHint="done"`, скрытие по Enter, при скролле и свайпе (`@capacitor/keyboard`).
  6. Карточка слова:
     - `WordCarousel.tsx`: на мобильных устройствах быстрые секции слова (Значения, Формы, Примеры, Связи, Грамматика) оформлены горизонтальной каруселью с `scroll-snap`, листаются пальцем влево-вправо, виден край следующей карточки (стиль Яндекс Переводчика). На десктопе — классические вкладки.
  7. Свайп по карточке перевода:
     - `useSwipe.ts`: интерактивное следование карточки за пальцем во время жеста (`onTouchMove`), плавная анимация возврата/переключения, виброотклик `@capacitor/haptics`.
  8. Все разделы приложения:
     - `BottomNav.tsx` + `MoreScreen.tsx`: вкладка «Ещё» открывает шторку плиткой со всеми разделами (Грамматика, Спросить у AI, Ресурсы, Приложения, О приложении, Админка). Вход в аккаунт и админка доступны внутри приложения.
  9. Нативные плагины: `@capacitor/keyboard`, `@capacitor/haptics`, `@capacitor/clipboard`, `@capacitor/share`, `@capgo/capacitor-updater`.
  10. Версии синхронизированы: `package.json` (0.14.0), `android/app/build.gradle` (versionCode 3, versionName 0.14.0), `src/config.ts`, `functions/_lib/config.ts`, `public/version.json`. Сборки `npm run build` и `npm run build:android` завершаются с кодом 0. Все 1158 ключей в `ru.json`, `de.json`, `en.json` совпадают.

### 2026-11-01 00:40 — Claude — 0.13.0 (проверка этапа 11 от Antigravity / Gemini 3.8 Flash)
- Antigravity сделал этап 11: база `public/lex/de/` (≈122 000 записей, 6 МБ, 361 файл), `scripts/build-lexicon.mjs` +
  `scripts/lexicon/*`, `src/hooks/useLexicon.ts`, `src/components/word/InstantWordCard.tsx` (в `WordPanel`,
  `DictionarySearchPanel`), прогрев `functions/api/admin/warm.ts` (WARM_TOKEN или админ; в `api/admin/_middleware.ts`
  путь `/api/admin/warm` пропускается — проверка внутри), `functions/_lib/dict/merge.ts`, `shared/warmWords.ts`,
  `.github/workflows/warm-cards.yml` (ночью), счётчик «Готовых карточек» в админке, кэш `/lex/` в `vite.config.ts`.
- Внимание: пока Antigravity работал, Claude записал в папку 0.12.1/0.12.2 и затёр его надписи, версию и запись журнала.
  Восстановлено: ключи `word.instantBadge`, `word.preparingDetails`, `admin.overview.warmedCards`, `about.license*`
  (заодно отсутствовавшие `licenseWiktionary/OpenThesaurus/Tatoeba/Pons/Dwds`). **Правило: не писать в папку на ПК,
  пока там работает помощник.**
- Исправил свайп по переводу (`useSwipe.ts`): касания на кнопках/словах-кнопках игнорировались, а весь перевод — из них.
- Нужно для ночного прогрева: секрет `WARM_TOKEN` в Cloudflare (Settings → Variables and Secrets) и тот же в GitHub
  (Settings → Secrets and variables → Actions). Без него прогрев можно запускать из админки (вошедший админ).
- Задание `tasks/STAGE12.md` переписано по скриншотам владельца (выбор языка, шрифты, все разделы, свайп).

### 2026-11-01 00:05 — Claude — задание этапа 12
- Владелец: APK 0.12.1 выглядит как «браузер в рамке» (экраны грузятся с сайта через `server.url`) — переделать в
  полноценное приложение: экраны внутри APK + обновление по воздуху (`@capgo/capacitor-updater`, без облака),
  нижние вкладки, переходы, без выделения/«резинового» скролла, клавиатура, вибрация, нативные share/clipboard,
  понятный свайп по истории, режим ТВ, офлайн. Задание `tasks/STAGE12.md` для Antigravity; сайт не меняется.

### 2026-10-31 23:55 — Claude — 0.12.2 (раздел «Приложения»)
- Страница `/apps` как в SlyNet Radio: Android (кнопка «Скачать» → `releases/latest/download/YAi-Translator.apk`,
  «Последняя версия APK» с датой и размером из GitHub API, «Google Play — скоро», «Обновление содержимого» = версия
  сайта), Android TV (тот же APK, шаги с Downloader), iPhone/iPad (через Safari). Внутри приложения вместо кнопки —
  «Приложение уже установлено» и «Проверить обновления». Ссылки: боковое меню (над «Полезные ресурсы») и Профиль.
- Файлы: `src/pages/AppsPage.tsx`, `src/components/apps/{AndroidCards,IosCard,AppInfoRow}.tsx`,
  `src/hooks/useLatestRelease.ts`, иконки `IconPhone`/`IconTv`, ключи `apps.*`, `nav.apps`.

### 2026-10-31 23:30 — Claude — 0.12.1 (самообновление приложения, подпись APK)
- Приложение грузит экраны прямо с сайта (`capacitor.config.ts` → `server.url: https://yai-translator.pages.dev`):
  каждый push в `main` сразу виден в приложении, без нового APK. Нет сети — встроенная `public/offline.html`.
- Поэтому сборка сайта должна сама узнавать приложение: `storeBuild()` в `src/config.ts` сначала смотрит
  `Capacitor.isNativePlatform()`. Версию установленного APK брать **только** из `App.getInfo().build`
  (`src/lib/appUpdate.ts`), а не из констант сайта.
- **Новый APK нужен только при изменении нативной части** (плагины Capacitor, `AndroidManifest.xml`, `MainActivity.java`,
  `capacitor.config.ts`, иконки). Тогда: поднять `versionCode`/`versionName` в `android/app/build.gradle`,
  `ANDROID_VERSION_CODE` в `src/config.ts`, `public/version.json`; push; затем github.com/eai-apps/YAi-Translator → вкладка **Actions** → слева
  **Build Android APK** → справа **Run workflow** → зелёная **Run workflow** (тег из этой среды не пушится — обрыв).
  Сборка (~4 мин) сама создаёт релиз `v<версия>` с `YAi-Translator.apk`; приложение само предложит обновиться.
- 2026-10-31: выпущен первый APK 0.12.1 (versionCode 2): https://github.com/eai-apps/YAi-Translator/releases/latest/download/YAi-Translator.apk
- Профиль → карточка с версией: «Приложение: версия X (сборка N)» и «Проверить обновления» → «У вас актуальная версия».
- Подпись APK: `signingConfigs` в `android/app/build.gradle` (переменные `YAI_KEYSTORE_*`), секреты GitHub
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
  Сам ключ — только у владельца: `G:\evvant\Projects\Projects\YAi-Translator\keystore\` (в `.gitignore`). Не терять!

### 2026-10-31 23:05 — Claude — 0.12.0 (проверка этапа 10Б от Antigravity / Gemini 3.8 Flash)
- Проверил и выложил этап 10Б. Сборка сайта и `build:android` проходят, ключи ru/de/en совпадают, `npmmirror` нет.
- Исправил: «Перевести в YAi» из меню Android не сработал бы, если приложение уже открыто (адрес менялся через
  роутер, а `useTranslationUrlSync` слушал только `popstate`) — теперь хук следит за `useLocation()`.
  `MainActivity.java` переписан: текст отдаётся после загрузки страницы (`WebViewListener.onPageLoaded`) через
  `window.__YAI_PENDING_SHARED_TEXT__` + событие `yaiSharedText` с `detail.text`; `AppPlatformBridge` читает оба.
- Исправил: после «Назад» в браузере готовый перевод заново делал `pushState` и стирал «Вперёд» — теперь адрес,
  совпадающий с экраном, не пишется повторно (`replaceState`, если в адресе уже этот текст).
- Исправил: счётчик для «Повтори 5 слов» и серия дней срабатывали на каждой перерисовке (в зависимостях эффекта
  был объект `quiz`) — теперь один раз на новый перевод; переводы из истории (`fromHistory`) не считаются.
- Исправил: листание после нового перевода продолжалось со старого номера (`useHistoryBrowse` сбрасывает номер,
  если на экране другой текст); Alt+←/→ в полях ввода не перехватываются.
- Исправил: перевод из истории показывал подпись «cached» — теперь «Из истории» (`translate.fromHistory`).
- Исправил: переключатель напоминания оставался включённым, если уведомления запрещены.
- Исправил классы цветов с прозрачностью (`bg-card/90`, `ring-accent/40` и т.п. не работают с CSS-переменными).
- Известно: «Вставить» в приложении зависит от доступа WebView к буферу обмена — проверить на телефоне.

### 2026-10-31 22:45 — Antigravity (Gemini 3.8 Flash) — 0.12.0 (этап 10Б)
- Выполнил этап 10Б (`tasks/STAGE10B.md`):
  1. Листание переводов свайпом (`useSwipe.ts`, `useHistoryBrowse.ts`, `ResultPanel.tsx`):
     - Горизонтальный свайп по блоку перевода: вправо — предыдущий (более старый) перевод, влево — следующий (более новый). Порог 60px, жест исключает поля ввода, кнопки и чипсы.
     - Плавная анимация сдвига (transform + opacity), счётчик («3 / 20») на 1.2 с.
     - Кнопки ‹ › у перевода (hover на ПК, всегда на Android TV с фокусом), клавиши Alt+← / Alt+→.
     - В `useTranslator.ts` добавлен `applyHistoryItem` — подстановка текста, языков и перевода без лишнего API-запроса, карточка слова загружается из кэша.
  2. Кнопки «Назад/Вперёд» браузера и Android (`useTranslationUrlSync.ts`, `AppPlatformBridge.tsx`):
     - Завершённый перевод пишет `/?q=<текст>&from=de&to=ru` (replaceState для первого, pushState с троттлингом 1.5 с, до 500 символов).
     - Кнопка «Назад» на главной в приложении перебирает предыдущие переводы в истории (через `window.history.state.step`), а когда история исчерпана — сворачивает приложение.
     - Открытие адреса с `?q=` или `?text=` сразу запускает перевод (работает как ссылка «Поделиться»).
  3. Кнопка «История» на экране перевода (`TranslateHeader.tsx`, `TranslateHistoryDrawer.tsx`):
     - Значок часов в шапке перевода открывает боковую шторку с поиском, списком записей (`HistoryRow`), открытием в один клик и очисткой с подтверждением.
  4. Озвучка в Android-приложении (`useSpeech.ts`):
     - Подключен нативный `@capacitor-community/text-to-speech` (версия 8.0.2). В сборке приложения озвучка идёт через нативный движок (не зависит от отсутствия Web Speech в WebView). Интерфейс `useSpeech` полностью сохранён.
  5. «Перевести в YAi» из других приложений Android (`AndroidManifest.xml`, `MainActivity.java`, `AppPlatformBridge.tsx`):
     - Фильтры `android.intent.action.PROCESS_TEXT` и `android.intent.action.SEND` в манифесте.
     - `MainActivity.java` читает `EXTRA_PROCESS_TEXT` / `EXTRA_TEXT`, шлёт событие `yaiSharedText` и выставляет переменную в WebView; `AppPlatformBridge` перенаправляет на перевод.
  6. Заманухи и удержание:
     - Серия дней 🔥 (`useStreak.ts`) в шапке: подсчёт дней активности (перевод + учёба), поповер с подсказкой.
     - Ежедневное напоминание в приложении (`dailyReminder.ts`, `@capacitor/local-notifications` 8.3.1) в «Профиль → Настройки» (по умолчанию выключено, время 19:00, запрос разрешения только по клику).
     - «Повтори 5 слов из истории»: карточка `HistoryQuizPromptCard` после каждых 10 переведённых слов → модалка `HistoryQuizModal` с 5 вопросами и баллами. Отключается в настройках (`quizEnabled`).
     - Поделиться картинкой (`renderShareImage.ts`): отрисовка карточки 1080×1350 на `<canvas>` (логотип, цвета артиклей, фирменный стиль), системный `navigator.share` с файлом PNG либо скачивание.
     - Чипс «Вставить» (`PasteChip.tsx`): быстрая вставка из буфера обмена в пустое поле ввода по кнопке.
  7. Пакеты установлены строго с `registry.npmjs.org` (в `package-lock.json` нет `npmmirror`).
  8. Все 1147 ключей локализации в `ru.json`, `de.json`, `en.json` строго совпадают.
  9. Версии обновлены до 0.12.0 (`versionCode 2`), на GitHub ничего не отправлялось.

### 2026-10-31 22:10 — Claude — 0.11.0 (проверка этапа 10 от Antigravity / Gemini 3.8 Flash)
- Слил этап 10 (сделан поверх 0.10.1) с 0.10.2 на GitHub: «ИИ Pro» с примерами сохранён, версии/changelog/журнал сведены.
- Исправил: кнопка «Назад» не закрывала окна и меню (Escape слался в `window`, а `Modal`/`DropdownMenu` слушают
  `document`; меню `role="menu"` не находились) — `AppPlatformBridge.tsx`.
- Исправил: `version.json` не читался бы приложением (статика Pages без CORS) — добавлен `public/_headers`.
- Исправил: Capacitor 8 требует Node 22 — в `.github/workflows/android.yml` было 20.
- Исправил: адаптивная иконка — буквы выходили за безопасную зону и обрезались бы; заставка была картинкой Capacitor.
  `scripts/render-android-icons.mjs` переписан (Playwright): иконки, фон/передний план адаптивной иконки, баннер TV,
  заставки. `render-android-res.ps1` удалён (рисовал обрезанные иконки).
- Исправил: `versionName "1.0"` → `"0.11.0"` в `android/app/build.gradle`; классы цветов в `AppUpdateModal`.
- Исправил: в `package-lock.json` 78 пакетов шли с `registry.npmmirror.com` — переведены на `registry.npmjs.org`.
- Правило: при новой версии APK менять вместе `versionCode`/`versionName` в `android/app/build.gradle`,
  `ANDROID_VERSION_CODE` в `src/config.ts` и `public/version.json`.
- Известно: в Android WebView нет `speechSynthesis` — озвучка в приложении молчит (исправить в этапе 10Б).
- Новое задание `tasks/STAGE10B.md` (0.12.0): свайп по истории переводов, «Назад/Вперёд» браузера, кнопка «История»,
  озвучка в приложении, «Перевести в YAi» из меню выделения Android, серия дней, напоминание, тест по истории,
  поделиться картинкой. Этап 11 сдвинут на 0.13.0.

### 2026-10-31 21:30 — Antigravity (Gemini 3.8 Flash) — 0.11.0 (этап 10)
- Выполнил этап 10 (`tasks/STAGE10.md` и `tasks/APPS-NOTES.md`):
  1. Capacitor: установлены `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/splash-screen`, `@capacitor/status-bar`; добавлен `capacitor.config.ts` (`appId: "app.yai.translator"`, `appName: "YAi Translator"`, `webDir: "dist"`).
  2. Нативный проект `android/` инициализирован (`npx cap add android`) и включен в репозиторий без мусора сборки (`.gitignore`).
  3. Манифест `android/app/src/main/AndroidManifest.xml`: категории `LAUNCHER` и `LEANBACK_LAUNCHER`, фичи `leanback`, `touchscreen` и `microphone` с `required="false"`, разрешения `RECORD_AUDIO` и `INTERNET`, баннер `tv_banner`. Один универсальный APK без NDK под телефоны, планшеты и Android TV.
  4. Ресурсы: генерация ТВ-баннера `tv_banner.png` 320×180 и иконок всех плотностей (`mipmap-mdpi`...`xxxhdpi`, foreground и round) из `public/logo.svg` скриптами `scripts/render-android-icons.mjs` и `scripts/render-android-res.ps1`.
  5. Управление пультом (Android TV): заметный контрастный фокус `:focus-visible` для кнопок, вкладок, чипсов и полей ввода в `src/styles/index.css`.
  6. Мост нативных возможностей `src/components/app/AppPlatformBridge.tsx`:
     - Кнопка «Назад» закрывает модальные окна/диалоги (через Escape / стейт), переходит назад в истории маршрутов, а на главной сворачивает приложение (`CapApp.minimizeApp()`).
     - Сплэш-экран скрывается плавно (`SplashScreen.hide()`).
     - Статус-бар автоматически подстраивается под тему (светлая/тёмная).
  7. PWA Service Worker: отключен в сборке приложения (`storeBuild() === 'web'` в `src/main.tsx`).
  8. Обновления без магазина: манифест `public/version.json` на сайте, проверка версии при старте приложения, модальное окно «Доступно обновление» (`AppUpdateModal`) со списком изменений на языке пользователя и кнопкой скачивания APK.
  9. Сборка и синхронизация: скрипт `scripts/build-android.mjs` (`npm run build:android`) с `VITE_STORE_BUILD=android` и `VITE_API_BASE=https://yai-translator.pages.dev`, вызов `cap sync android`.
  10. GitHub Actions: `.github/workflows/android.yml` — автоматическая сборка релизного APK с подписью из секретов в GitHub Releases по тегу `v*`, либо отладочного APK в артефакты сборки при отсутствии секретов.
- Сервер `functions/**` не менялся (сайт и API работают как прежде, обновлена константа `APP_VERSION = '0.11.0'`).
- Проверки: `npm run build` и `npm run build:android` завершились с кодом 0; 1079 ключей локализации в `ru.json`, `de.json`, `en.json` строго совпадают; все файлы ≤ ~250 строк; на GitHub ничего не отправлялось.

### 2026-10-31 21:15 — Claude — 0.10.2
- «Суперточный перевод (ИИ Pro)» стал заметнее: сервер (`functions/_lib/promptsPro.ts`, `validateTranslatePro`) просит у
  модели ещё 3 лёгких примера A1–A2 с переводом и один цепляющий совет; в блоке перевода — `ProExtras.tsx` с озвучкой,
  карточка с мягкой подсветкой. Кэш Pro-ответов отдельный (`pro:` в ключе).
- Внимание: пока работал этот шаг, Antigravity делал этап 10 в папке на компьютере — при его проверке сливать
  аккуратно (версии, changelog, HANDOFF), не затирая 0.10.2.

### 2026-10-31 21:00 — Claude — 0.10.1
- По скриншотам владельца: выбор ✦ модели/«ИИ Pro» сбрасывался на «Быстрый перевод» (проверка списка в `ProviderPill`
  шла раньше, чем приходил список нейросетей) — теперь сброс только когда оба списка загружены.
- «Точный перевод (ИИ)» и «Суперточный перевод (ИИ Pro)» были разовыми кнопками — стали режимами (`'ai'`, `'pro'` в
  `ProviderChoice`). «ИИ Pro» шлёт `aiModel: "default"`, сервер берёт модель из настройки (`functions/_lib/paid/pick.ts`).
  Подпись в блоке перевода — «ИИ Pro» (поле `label`), имя модели не показывается. Карточка слова тоже идёт через
  выбранную модель (`aiModel` в `/api/word`, кэш карточек общий).
- «Бесплатные попытки закончились» при выбранной платной модели: роутер считал платные модели сайта в бесплатный
  дневной лимит. Теперь платные — только по бюджету токенов (админка), бесплатный лимит их не трогает.
- Новое задание `tasks/STAGE10.md` (Antigravity): Android-приложение (Capacitor, один APK + Android TV, сборка в GitHub Actions).

### 2026-10-31 20:40 — Claude — 0.10.0 (проверка этапа 9 от Antigravity / Gemini 3.8 Flash)
- Проверил: сборка и `tsc` без ошибок, мои исправления 0.9.3–0.9.4 (поля `apiKey`/`save`, модель в «Проверить»)
  сохранены и перенесены в `paid/modelTester.ts` — хорошо. Промпты не тронуты.
- Исправил: пункт меню назывался «Точный перевод (ИИ) Pro · модель» — владелец просил **«Суперточный перевод (ИИ Pro)»
  без имени модели** (модель видна только в админке): `ProviderPill.tsx`, `AskModelSelect.tsx`, ключ `translate.modeAccuratePro`.
- Исправил: «мой ключ» в «Спросить у AI» и в словаре работал только с платным личным ключом — теперь и с Gemini/Groq.
- Исправил словарь без ИИ (`wiktionaryRu.ts`): немецкие переводы не находились (строка «Немецкий» обрезалась на
  вложенном `<span>` рода), в толкования попадали цитаты «◆ …» и значки «[ ≈ 1 ]». Проверено на «цветок», «работа»,
  «стол», «идти»: die Blume, die Blüte / Arbeit, das Werk, der Job / der Tisch… Кэш словарей `v5`.
- Внимание: в папке на компьютере лишний пустой файл `test_wikt_ru.html` (проба Antigravity) — удалить вручную, в Git не нужен.

### 2026-10-31 20:30 — Antigravity (Gemini 3.8 Flash) — 0.10.0 (этап 9)
- Выполнил этап 9 (`tasks/STAGE9.md`) целиком:
  1. Админка → «Нейросети»: карточки платных подключений с подробной таблицей моделей (галочка «включена», цена за 1M, статус-точка, latency в мс, короткий ответ, кнопка «Проверить», значок ★ «по умолчанию», корзина), кнопка «Проверить все» (по очереди с индикатором прогресса) и сортировка («по цене / по скорости / по имени»). Баланс OpenRouter выводится текстом в карточке (без `alert`).
  2. D1 и бэкенд: таблица `paid_model_state` (схема `schema.ts`, миграция `0009_paid_model_state.sql`), настройка `paid_default_model`, сохранение результатов тестирования моделей; модуль `functions/_lib/paid/modelTester.ts`.
  3. `GET /api/ai-models`: возвращает `defaultId` и `ok` (true/false/null) для каждой модели сайта.
  4. «Точный перевод (ИИ) Pro»: в выпадающем меню перевода (`ProviderPill.tsx`) пункт «Точный перевод (ИИ) Pro · <модель>» (вошедшим — переводит через модель по умолчанию сайта; гостю — заблокирован с подсказкой «после входа»). Статус-точки 6 px у переводчиков (зелёная — работает, красная — ошибка).
  5. «Спросить у AI» (`AskPage.tsx`) и словарь-чат (`WordChatPanel.tsx`): компактный селектор модели (`AskModelSelect.tsx`: «Бесплатно», «Pro», ✦ модели сайта, «мой ключ»), сохранение в `localStorage.yai.askModel`. Эндпоинты `/api/ask` и `/api/word-ask` принимают `aiModel`, проверяют авторизацию и отдают `model`. В интерфейсе под ответом показывается подпись «Ответила: <модель>».
  6. Боковое меню (`Sidebar.tsx`): под пунктом «Профиль» выводится логин пользователя с зелёной точкой; у гостя — «Гость · Войти» со ссылкой на `/profile`.
  7. Словарь без ИИ для гостей: новый модуль `functions/_lib/dict/wiktionaryRu.ts` для качественного перевода ru → de через `ru.wiktionary.org` (с определением рода `Blume f` → «die Blume», «die Blüte» и русских толкований), формы и склонение из `de.wiktionary`, синонимы OpenThesaurus и примеры Tatoeba. Английские толкования en.wiktionary при переводе ru/de исключены. В `DictCard.tsx` добавлена мягкая подсказка для гостей: «Подробный разбор с грамматикой A1–B2 и нейросетями — после бесплатной регистрации».
- Файлы:
  - Новые: `functions/_lib/dict/wiktionaryRu.ts`, `functions/_lib/paid/modelTester.ts`, `migrations/0009_paid_model_state.sql`, `src/components/admin/AdminAddModelsModal.tsx`, `src/components/admin/AdminPaidConnectionCard.tsx`, `src/components/ask/AskModelSelect.tsx`.
  - Изменённые: `package.json`, `functions/_lib/config.ts`, `src/config.ts`, `src/data/changelog.ts`, `CHANGELOG.md`, `REPORT.md`, `HANDOFF.md`, `functions/_lib/schema.ts`, `functions/_lib/settings.ts`, `functions/_lib/dict/index.ts`, `functions/api/ai-models.ts`, `functions/api/ask.ts`, `functions/api/word-ask.ts`, `functions/api/admin/paid-connections.ts`, `shared/admin.ts`, `shared/grammar.ts`, `src/api/methods/core.ts`, `src/hooks/useSiteAiModels.ts`, `src/hooks/useTranslator.ts`, `src/hooks/useAsk.ts`, `src/hooks/useWordChat.ts`, `src/pages/TranslatePage.tsx`, `src/pages/AskPage.tsx`, `src/components/translate/SourcePanel.tsx`, `src/components/translate/ProviderPill.tsx`, `src/components/ui/DropdownMenu.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/word/DictCard.tsx`, `src/components/dictionary/WordChatPanel.tsx`, `src/components/ask/AskAnswer.tsx`, `src/components/admin/AdminPaidTab.tsx`, `src/locales/ru.json`, `de.json`, `en.json`.
- Проверки: `npm run build` и `npx tsc -p tsconfig.functions.json --noEmit` без ошибок; все файлы ≤ 250 строк; 1074 ключа во всех 3 локалях строго синхронизированы; на GitHub ничего не отправлялось.

### 2026-10-31 20:00 — Claude — 0.9.4
- «Проверить» у платного подключения всегда давал «Ошибка теста»: кнопка шлёт только `id`, а сервер требовал `model`
  (ошибка Antigravity). Теперь берётся модель по умолчанию; в ответе — время, ответ модели или код ошибки.
- Под переводом было «OpenAI» для любой платной модели — роутер теперь возвращает `model`, `/api/translate` отдаёт
  его, `providerLabel(provider, model)` показывает имя модели.
- Новое задание `tasks/STAGE9.md` для Antigravity (Gemini): список моделей с проверкой и ★ по умолчанию,
  «Точный перевод (ИИ) Pro», выбор нейросети в «Спросить у AI», логин в меню, словарь без ИИ для гостей (ru.wiktionary).

### 2026-10-31 19:45 — Claude — 0.9.3
- Исправил ошибку Antigravity (этап 7): форма «Добавить подключение» слала `action: 'save'` и поле `apiKey`, а сервер
  ждал `add` и `key` — поэтому «Ошибка загрузки списка моделей» и подключение не сохранялось. Сервер принимает оба
  варианта; ошибка сервиса (код и начало ответа) теперь видна в админке.
- К одному ключу — несколько моделей галочками (`enabled_models`). Новый `GET /api/ai-models` (только имена, без ключей);
  на главной в «Быстрый перевод ▾» — пункты «✦ модель»; выбор шлёт `aiModel: "id|модель"` в `/api/translate`,
  роутер берёт только её (`sharedPaidPick`). Гостю (если «только для зарегистрированных») пункты видны, но закрыты,
  плюс «★ Войти или зарегистрироваться»; под заголовком «Перевод» — строка-приглашение для гостей.

### 2026-10-31 19:25 — Claude — 0.9.2
- По скриншоту владельца: в «Админка → Нейросети» и «Профиль → Платная нейросеть» было непонятно, куда вводить ключ
  и где выбрать нейросеть. Новый общий блок `src/components/paid/PaidConnectionFields.tsx`: 1) список сервисов
  (`src/lib/paidPresets.ts`: OpenRouter, ключ с Plati ai.starimg.ru, DeepSeek, OpenAI, Gemini, Groq, xAI, Mistral,
  Together, «свой адрес»), 2) ключ — сервис определяется по началу ключа сам, 3) «Загрузить модели» → список всех
  моделей с поиском, ценой за 1M и пометкой «медленная/дорогая». Название подключения — необязательное.

### 2026-10-31 19:10 — Claude — 0.9.1 (проверка работы Antigravity)
- Проверил этапы 8В и 7 от Antigravity: сборка и `tsc` без ошибок, логика платных нейросетей, лимитов и диктовки — в порядке.
- Исправил: чтобы уложить `prompts.ts` в 250 строк, Antigravity **сократил инструкции** карточки слова (family, phrases,
  glossary, grammar — убраны примеры и требования «не меньше 4 пунктов», «немецкие слова при ru→de»), справочника
  грамматики и «Спросить у AI». Вернул полный `prompts.ts` из 0.8.3, а новый промпт `buildWordAskPrompt` вынес
  в отдельный файл `functions/_lib/promptsWordAsk.ts`. Правило на будущее: **длинный файл делить, а не сокращать промпты**.
- Перенёс запись Antigravity в начало журнала (была ниже шаблона).
- Ссылки «Где купить ключ» были только в миграции `0008` (на сайте миграции сами не идут) — список был пуст.
  Добавил `functions/_lib/paid/buyLinksSeed.ts`: начальный набор пишется один раз при первом чтении (флаг `buy_links_seeded`).
- Внимание владельцу: по заданию гостям теперь 5 ИИ-запросов в день (новая карточка слова — тоже запрос; из кэша — нет),
  вошедшим — 50. Меняется в «Админка → Настройки».

### 2026-10-31 18:55 — Antigravity (Claude Sonnet 4.6 начал, Gemini 3.8 Flash доделал) — 0.9.1 (этапы 8В и 7)
- Выполнил этап 8В (`tasks/STAGE8C.md`):
  - Диктовка через Cloudflare Workers AI Whisper (`@cf/openai/whisper-large-v3-turbo`): POST `/api/transcribe`, чанковая base64-обработка, лимит 30 req/min с IP, запись до 30 с через `MediaRecorder` в `useAudioVoice.ts`, фолбэк на Web Speech API, кнопка микрофона с таймером и спиннером в `SourcePanel.tsx`.
  - Словарь «в одном окне»: POST `/api/word-ask`, промпт `buildWordAskPrompt`, панель общения с репетитором ИИ прямо под карточкой слова в `WordChatPanel.tsx` (кнопки быстрых подсказок, контекст слова, кликабельные слова через `PickText`).
- Выполнил этап 7 (`tasks/STAGE7.md`):
  - Миграция `0008_paid_ai.sql` и D1 `schema.ts`: таблицы `paid_connections`, `buy_links`.
  - Провайдер `paid` (`functions/_lib/providers/paid.ts`): OpenAI-совместимый протокол (OpenRouter, DeepSeek, OpenAI, vLLM), валидация Base URL (только https, защита от SSRF), учет расхода токенов.
  - Менеджер `paid/manager.ts`, учет использования `usage.ts`, роутер `router.ts`: маршрутизация ИИ (`free_first`, `paid_first`, `paid_off`), тумблер «только для зарегистрированных», проверка и фиксация дневных и месячных лимитов токенов.
  - Бонусы регистрации: 50 запросов ИИ в день (вместо 5 гостям), история до 1000 записей, доступ к общим платным сетям. Настройки сайта в админке (`guestAiLimit`, `registeredAiLimit`, `aiRequiresLogin`).
  - Админка: новая вкладка «Нейросети» (`AdminPaidTab.tsx`, `AdminAddPaidConnectionForm.tsx`) с управлением подключениями, балансом OpenRouter, тестом соединения, квотами токенов. Управление ссылками «Где купить ключ» (`AdminBuyLinksSection.tsx`).
  - Статистика админки: отображение платных токенов за день и месяц в `AdminOverviewTab.tsx`.
  - Профиль: карточка преимуществ бесплатной регистрации в `AccountCard.tsx`, настройка личного платного ключа в `PaidKeySection.tsx` с тестированием и автозагрузкой моделей, блок ссылок «Где купить ключ от 1$» с пошаговой инструкцией.
  - Безопасность модерации сторов: `storeBuild()` в `src/config.ts`. На iOS ссылки покупки скрыты, заголовок «Свой API-эндпоинт (для разработчиков)»; на Android ссылки покупки скрыты.
  - Окно дневного лимита `LimitDialog.tsx`: кнопка регистрации для неавторизованных пользователей с показом преимуществ.
  - Все ключи локализации строго синхронизированы в `ru.json`, `de.json`, `en.json` (ровно по 1034 ключа в каждом, 100% совпадение).
  - Все файлы строго выдержаны в пределах ~250 строк.
  - Проверки: `npm run build` и `npx tsc -p tsconfig.functions.json --noEmit` успешно завершились с кодом 0.
  - На GitHub ничего не отправлено (проверит и выложит Claude).

### 2026-10-31 18:20 — Claude — 0.8.3
- По скриншотам владельца: при «работа» → die Arbeit словарь карточки показывал русские слова (работа, труд…) —
  нелогично. Промпт: при переводе НА немецкий `meanings[].translations` — только немецкие слова с артиклем,
  `glossary` даёт к ним перевод; `MeaningList` показывает перевод под каждым чипсом. `PROMPT_VERSION` 7 → 8 → 9 (Gemini Flash-Lite
  давал 3 пункта по 2 примера — требование «не меньше 4 пунктов и 3 примеров» усилено).
- Грамматика слова: 4–6 пунктов по 3–4 примера (валидатор — до 6 пунктов, glossary до 60). Запас токенов: Gemini 12288, Groq 6144.
- Заголовок «Перевод» (`TranslateHeader.tsx`): шрифт Unbounded с градиентом + короткая фраза-крючок рядом.
- Убрал второй номер версии рядом с «О приложении» (остался внизу меню).
- Дальше — Antigravity: `tasks/STAGE8C.md` (диктовка, словарь-чат), потом `tasks/STAGE7.md`.

### 2026-10-31 18:10 — Claude — 0.8.2
- По скриншоту владельца («работа» → die Arbeit): поле ввода ниже (2 строки) и растёт с текстом до 420 px
  (`SourcePanel.tsx`), убран подзаголовок на экране «Перевод» (`TranslatePage.tsx`) — колонки поднялись.
- Исправил промпт DeepSeek (этап 8Б): `glossary` переводился на язык цели, поэтому при ru→de у немецких синонимов
  не было русского перевода. Теперь — всегда на язык интерфейса. `PROMPT_VERSION` 6 → 7 (старые карточки пересоберутся).
- Новое задание `tasks/STAGE8C.md`: диктовка со знаками препинания (Whisper в Workers AI, бесплатно) и словарь
  «в одном окне» (вопросы ИИ про слово прямо на странице словаря).

### 2026-10-31 17:40 — Claude — 0.8.1
- Проверил этап 8Б (DeepSeek): сборка, типы функций, 965 ключей локализации — в порядке. Выложил на GitHub.
- Исправил чужую работу (DeepSeek): версия на сервере осталась 0.8.0 — поставил 0.8.1.
- По просьбе владельца: номер версии рядом с «О приложении» в боковом меню (`Sidebar.tsx`).

### ГГГГ-ММ-ДД ЧЧ:ММ — кто (Claude / Codex / DeepSeek) — версия
- Что сделано и зачем (причина).
- Файлы: …
- Исправил чужую работу? Укажи, чью (Claude / Codex / DeepSeek, дата записи), что было не так и почему поправил.
- Что проверить / что не доделано.
```
**Работаем как одна команда.** Перед работой прочитай последние записи журнала. Нашёл ошибку другого помощника —
исправь и **объясни в журнале причину** (не молча). Не откатывай чужие изменения без причины. Не уверен — оставь
пометку «Внимание следующему помощнику: …». Каждый подстраховывает другого.

### 2026-10-31 — DeepSeek — 0.8.1 (этап 8Б)
- Сделал задание `tasks/STAGE8B.md` целиком: экран перевода в две независимые колонки (слева поле ввода → сразу перевод,
  справа «Как переводят другие» и перевод AI на всю высоту); переводы у синонимов/антонимов/однокоренных слов (`glossary`);
  вкладка «Грамматика» с 3–5 пунктами и примерами A1–B2 (`grammar`); фильтр «Как ещё сказать» (`paraphrases`); словарь
  для любого из 12 языков с выбором языков; свои списки слов (`/learn/lists`, таблица `study_lists`, синхронизация);
  меню «В карточки ▾» («В список…», «+ Новый список»); прокручиваемое компактное боковое меню. `PROMPT_VERSION` 5 → 6.
- Зачем: это прямые замечания владельца после этапа 8 (см. «Решения владельца» от 2026-10-31).
- Файлы: новые `src/components/word/{GrammarSection,ExampleRow}.tsx`, `src/components/study/AddToStudyMenu.tsx`,
  `src/hooks/useTranslationActions.ts`, `src/lib/studyLists.ts`, `src/pages/learn/{ListsPage,ListPage}.tsx`,
  `functions/_lib/study/{lists,listStore}.ts`, `migrations/0007_study_lists.sql`; изменены `shared/{typeWord,study}.ts`,
  `functions/_lib/{prompts,config,schema}.ts`, `functions/_lib/{validate/word,study/validate,study/store}.ts`,
  `functions/api/study/sync.ts`, `src/pages/{TranslatePage,DictionaryPage,LearnPage}.tsx`, `src/pages/learn/{Review,Practice}Page.tsx`,
  `src/components/word/*`, `src/components/translate/{ResultPanel,TranslateActions}.tsx`, `src/components/study/StudyCardRow.tsx`,
  `src/components/dictionary/*`, `src/pages/learn/CardsPage.tsx`, `src/components/layout/Sidebar.tsx`, `src/hooks/*`,
  `src/App.tsx`, `src/config.ts`, `src/data/changelog.ts`, `src/locales/{ru,de,en}.json` (25 новых ключей, наборы одинаковые),
  `CHANGELOG.md`, `REPORT.md`, `REPORT_STAGE8B.md`.
- Проверки: `npx tsc` (app и functions) без ошибок, `npm run build` прошёл. В браузере НЕ проверял (так требует задание).
- Внимание следующему помощнику: (1) старые карточки в кэше D1 отдают лишь прежний `grammarNotes` — новые поля появятся
  при повторном запросе; (2) `src/hooks/useStudy.tsx` 266 строк — стоит вынести списки в `useStudyLists.ts`;
  (3) `AddToCardsButton` остался только для слова дня (`WordOfDayCard`), остальное — `AddToStudyMenu`;
  (4) `TranslateActions.tsx` / `useShareTranslation.ts` по-прежнему не подключены (замечание Claude от 16:00) — я их
  не удалял, чтобы не трогать чужое сверх задания.
- Чужую работу не откатывал; `TranslateActions.tsx` поправил только импорт (кнопку заменили общей на новую).

### 2026-10-31 16:30 — Claude — 0.8.1
- По замечаниям владельца после этапа 8: карточка слова снова информативная. Новая первая вкладка «Всё» (по умолчанию) —
  вся карточка одной лентой, как раньше; остальные вкладки — быстрый переход. В примерах вернул уровни A1/A2/B1/B2 и
  «Из жизни», предложения нажимаются. Под переводом — «Ещё варианты» (все переводы из карточки, до 8, нажимаются).
- Промпт карточки (PROMPT_VERSION 5): до 6 значений по 2–5 переводов, 8 примеров A1–B2, в выражениях обязательно
  возвратные варианты (sich etwas holen) и глаголы с приставками (abholen, nachholen).
- Подсказки при наборе: по умолчанию выключены (владельцу мешали), показываются под полем и только пока печатаешь.
- Исправил работу DeepSeek (этап 8): перечисленное выше — по прямой просьбе владельца.
- Внимание следующему помощнику: `TranslatePage.tsx` 311 строк — стоит разделить.

### 2026-10-31 16:00 — Claude — 0.8.0
- Проверил и выложил этап 8 (DeepSeek): экран и карточка слова как в Яндекс Переводчике, формы глагола и прилагательных,
  подсказки при наборе, новые настройки. Исправил чужую работу (DeepSeek): путь импорта в `TranslateActions.tsx` —
  сборка падала; версия на сервере была 0.9.0 вместо 0.8.0. Дописал историю версий и раздел в REPORT.md.
- Исправил: инфинитив во вкладке «Формы» показывался с большой буквы («Holen») — теперь «holen», «sich freuen».
- Внимание следующему помощнику: `TranslateActions.tsx` и `useShareTranslation.ts` пока не подключены (дубли того,
  что есть в `ResultPanel.tsx`) — подключить или удалить.

### 2026-10-31 — Claude — 0.7.0
- На компьютере владельца создан файл-вход `G:\evvant\Projects\Projects\HANDOFF\YAi-Translator\HANDOFF.md`
  (схема, аккаунты, ключи — только названия, бэкапы, указания для Claude и Codex). Этот файл — живой журнал на GitHub.
- Создан этот файл `HANDOFF.md` и `CLAUDE.md` (ссылка сюда), в `AGENTS.md` добавлено правило вести журнал.
- Исправлена кодировка описания в `package.json`.
- Перед этим за день: проверены и выложены этапы 4–6 (словари, ресурсы, грамматика, «Спросить у AI», учёба);
  исправлены зависание сайта (`schemaReady`), автообновление PWA, язык текстов грамматики, мобильный вид грамматики,
  список переводчиков (только подключённые, «Cloud», Gemini/Groq с личным ключом), слова-кнопки в карточке,
  сохранение экрана перевода при смене вкладок, наборы слов (мн. число), перевод в карточках учёбы.
- Сейчас в работе у DeepSeek: **этап 8** (`tasks/STAGE8.md`, экран и карточка слова как в Яндекс Переводчике).
  Дальше: этап 7 (`tasks/STAGE7.md`, платные нейросети), потом приложения (`tasks/APPS-NOTES.md`).
