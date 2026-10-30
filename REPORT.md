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
