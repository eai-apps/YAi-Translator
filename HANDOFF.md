# HANDOFF — как продолжить работу над YAi Translator (для Claude, Codex и любого ИИ-помощника)

> **Прочитай этот файл первым.** Он нужен, чтобы любой помощник (Claude, Codex, DeepSeek) мог продолжить работу
> с того места, где остановился другой. После своей работы **обязательно допиши запись в «Журнал работ» внизу.**
> Вход в проект (аккаунты, серверы, где ключи и бэкапы) — у владельца на компьютере:
> `G:\evvant\Projects\Projects\HANDOFF\YAi-Translator\HANDOFF.md`.
> Изменения работы пишутся **сюда** (на GitHub), а не в папку на компьютере.
> Владелец — не программист: объясняй ему по-русски, простыми словами, с полным путём кликов
> (какой сайт открыть → что слева/сверху → какую кнопку нажать).

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

---

## Журнал работ (новые записи — сверху)

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
