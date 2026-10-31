# Задание: этап 10 — Android-приложение (один APK для телефона, планшета и Android TV) (версия 0.11.0)

Сначала прочитай `HANDOFF.md` (правила и журнал — записи Claude 0.10.0–0.10.1), `AGENTS.md` и **`tasks/APPS-NOTES.md`**
(решения владельца по приложениям — их выполнять).

**Правила этапа (обязательно):**
- Не сокращай промпты и чужой код ради 250 строк — дели файлы. Имена полей клиент↔сервер проверяй с обеих сторон.
- **Не трогай:** логотип; `functions/**` (сервер в этом этапе не меняется); `deeplUrl()`; `schemaReady`;
  `functions/_lib/prompts.ts`; `src/main.tsx` (кроме ветки «если это приложение» — см. п. 3); снимок экрана в `useTranslator.ts`.
- Сайт должен работать как раньше: всё новое включается только в сборке приложения (`VITE_STORE_BUILD=android`).
- Проверки в браузере не делай. Работай без subagent, по шагам. На GitHub ничего не отправляй — выложит Claude.
- Android SDK на компьютере владельца **нет** и не нужен: APK собирает GitHub Actions. Локально проверяй только
  `npm run build` и `npm run build:android` (сборка веб-части для приложения).

## 1. Capacitor

- Добавь Capacitor (последние стабильные версии `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`,
  `@capacitor/app`, `@capacitor/splash-screen`, `@capacitor/status-bar`), `capacitor.config.ts`:
  `appId: "app.yai.translator"`, `appName: "YAi Translator"`, `webDir: "dist"`.
- Скрипт `build:android` в `package.json`: сборка веб-части с `VITE_STORE_BUILD=android` и `VITE_API_BASE=https://yai-translator.pages.dev`
  (приложение ходит в API сайта — проверь, как `API_BASE` в `src/config.ts` уже это поддерживает, и куки/сессия
  работают через заголовок `Authorization`, как сейчас в `src/api/request.ts`), затем `npx cap sync android`.
- Папку `android/` создать командой `npx cap add android` и **положить в репозиторий** (без `build/`, `.gradle/` —
  добавь в `.gitignore`).

## 2. Один APK для всего (из APPS-NOTES)

В `android/app/src/main/AndroidManifest.xml`:
- `LAUNCHER` и `LEANBACK_LAUNCHER` у главной activity;
- `<uses-feature android:name="android.software.leanback" android:required="false"/>` и
  `<uses-feature android:name="android.hardware.touchscreen" android:required="false"/>`;
- `android:banner="@drawable/tv_banner"` — баннер 320×180 из нашего логотипа (сделай скриптом из `public/logo.svg`,
  как `scripts/render-icons.mjs`), иконки приложения всех размеров — тоже из логотипа;
- разрешение `RECORD_AUDIO` (диктовка) и `INTERNET`. Никаких нативных библиотек под отдельные процессоры.

## 3. Управление пультом (Android TV) и поведение приложения

- Видимый фокус у всех кнопок, вкладок, чипсов, пунктов меню и полей: `:focus-visible` с заметной рамкой акцентного
  цвета (в `src/styles/index.css`). Проверь, что до всех элементов можно дойти стрелками (без «ловушек» фокуса).
- В приложении (`storeBuild() === 'android'`): кнопка «Назад» Android закрывает открытое меню/окно, иначе идёт назад
  по истории, на главной — сворачивает приложение (`@capacitor/app`). Сплэш-экран и цвет статус-бара — по теме.
- PWA-регистрацию service worker в приложении **не** включать (в `src/main.tsx`: если `storeBuild() !== 'web'`, не вызывать `registerSW`).

## 4. Проверка обновлений (без магазина)

По APPS-NOTES, п. 2: файл `public/version.json` — `{ "versionCode": 1, "versionName": "0.11.0", "apkUrl": "<ссылка на
GitHub Releases>", "notes_ru": "...", "notes_de": "...", "notes_en": "...", "required": false }`.
Приложение при запуске (только `storeBuild() === 'android'`) читает `https://yai-translator.pages.dev/version.json`;
если `versionCode` больше своего — окно «Доступна версия X — Обновить» (кнопка открывает `apkUrl` в браузере
системы через `@capacitor/app`/`window.open`). Своя версия — из `capacitor.config`/`package.json` при сборке.

## 5. Сборка APK в GitHub Actions

`.github/workflows/android.yml`: по тегу `v*` и вручную (`workflow_dispatch`):
Node 20 → `npm ci` → `npm run build:android` → JDK 21 → Gradle `assembleRelease` → подпись ключом из секретов
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` →
APK в GitHub Releases (`softprops/action-gh-release`) с именем `YAi-Translator-<версия>.apk`.
Если секретов нет — собрать отладочный APK (`assembleDebug`) и выложить как артефакт сборки. Ключи в код не класть.
Создавать ключ и секреты будет Claude — в отчёте напиши, какие именно секреты нужны и как сделать keystore
(одна команда `keytool`).

## 6. Проверка и отчёт

- `npm run build` (сайт) и `npm run build:android` без ошибок; ключи ru/de/en совпадают; файлы ≤ ~250 строк.
- Версия **0.11.0** (`functions/_lib/config.ts`, `src/config.ts`, `package.json`), `src/data/changelog.ts`, `CHANGELOG.md`,
  раздел «Этап 10» в `REPORT.md`, запись **вверху** «Журнала работ» в `HANDOFF.md` (кто — Antigravity, какая модель).
