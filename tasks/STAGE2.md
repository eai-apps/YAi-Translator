# Задание: этап 2 — аккаунт, личные ключи, проверка ключей (версия 0.3.0)

Сначала прочитай `AGENTS.md` целиком (особенно разделы 4, 5 и 5а). Логику перевода (`functions/api/translate.ts`,
`compare.ts`, `functions/_lib/classic/*`) **не трогай**. Админку и вход через Google/Apple **пока не делай**.

---

## 1. Аккаунт: логин + пароль (без Google/Apple)

Цель: человек заводит аккаунт за 10 секунд, входит с любого количества телефонов и компьютеров одним логином
и паролем (можно поделиться логином с семьёй), и его ключи ИИ, избранное и история везде одинаковые.

### База D1 (добавь в `functions/_lib/schema.ts` и новый файл `migrations/0002_accounts.sql`)

```
users(id TEXT PK, login TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL, last_login_at INTEGER)
sessions(token_hash TEXT PK, user_id TEXT NOT NULL, device TEXT, created_at INTEGER NOT NULL,
         last_seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)          + индекс по user_id
user_keys(user_id TEXT NOT NULL, provider TEXT NOT NULL, ciphertext TEXT NOT NULL, iv TEXT NOT NULL,
          last4 TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, provider))
user_items(user_id TEXT NOT NULL, item_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL,
           deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id, item_id))   -- избранное и история
login_attempts(ip_hash TEXT NOT NULL, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL,
               PRIMARY KEY(ip_hash, window_start))
```

### Безопасность (строго так)

- Логин: 3–32 символа, латиница/цифры/`_.-`, без учёта регистра (храни в нижнем регистре). Пароль: минимум 8 символов.
- Пароль: PBKDF2-SHA256 через WebCrypto, **100 000 итераций** (больше Cloudflare Workers не разрешает), соль 16 байт.
  Сравнение хешей — за постоянное время.
- Сессия: случайный токен 32 байта. В базе хранится **только SHA-256 от токена**. Срок 90 дней, продлевается при входе.
- Токен отдаётся двумя способами: cookie `yai_session` (`HttpOnly; Secure; SameSite=Lax; Path=/`) для сайта
  и в теле ответа для будущих приложений (они шлют `Authorization: Bearer <token>`). Сервер принимает оба.
- Защита от подбора: не больше 10 попыток входа/регистрации с одного IP за 15 минут (таблица `login_attempts`,
  IP только как хеш, как в `usage.ts`). Ошибка — новый код `TOO_MANY_ATTEMPTS` (429) с текстом на 3 языках.
- На неверный логин и неверный пароль — одна и та же ошибка `INVALID_CREDENTIALS`.
- Ключи ИИ пользователя шифруются AES-GCM. Ключ шифрования — секрет Cloudflare `KEY_ENCRYPTION_SECRET`
  (32 случайных байта в base64). Если секрет не задан — сохранять ключи на сервер нельзя, API отвечает
  `KEYS_STORAGE_DISABLED`, а фронтенд хранит ключ только на устройстве (как сейчас).
  Ключ целиком никогда не возвращается клиенту — только последние 4 символа (`last4`).
- Новые модули: `functions/_lib/auth/password.ts`, `session.ts`, `crypto.ts`, `ratelimit.ts` (один файл — одна задача).

### API (новые файлы в `functions/api/`)

| Метод и путь | Что делает |
|---|---|
| `POST /api/auth/register` `{login, password}` | создаёт аккаунт, сразу входит, переносит ключи с устройства, если они переданы в заголовках |
| `POST /api/auth/login` `{login, password, device?}` | вход |
| `POST /api/auth/logout` | выход с этого устройства |
| `POST /api/auth/logout-all` | выход со всех устройств |
| `GET /api/auth/me` | `{login, createdAt, sessions:[{device, lastSeenAt, current}], keys:{gemini:{last4}|null, groq:…}}` |
| `POST /api/auth/password` `{oldPassword, newPassword}` | смена пароля (все другие сессии завершаются) |
| `PUT /api/keys/:provider` `{key}` | сначала проверяет ключ (как `key-test.ts`), только рабочий шифрует и сохраняет |
| `DELETE /api/keys/:provider` | удаляет ключ |
| `POST /api/keys/:provider/test` | проверяет сохранённый ключ, `{ok, latencyMs, message}` |
| `GET /api/sync?since=` / `PUT /api/sync` | избранное и история: последняя запись по `updated_at` побеждает, удаление — `deleted=1` |

- `provider` — только `gemini` или `groq`. Общий код проверки ключа вынеси из `key-test.ts` в `functions/_lib/keytest.ts`.
- **Главное:** в `getUserKeys` (файл `functions/_lib/http.ts`) — если запрос пришёл с сессией, сервер сам берёт
  расшифрованные ключи пользователя из D1 (ключи из заголовков `X-User-*` имеют приоритет). Тогда ИИ у вошедшего
  пользователя работает на его ключе на любом устройстве, а общий дневной лимит не тратится.
  Функция станет асинхронной — обнови все места вызова.
- Все ответы и ошибки — через `jsonResponse` / `ApiError`, тексты ошибок на ru/de/en.

## 2. Проверка общих ключей сайта

- `GET /api/health?check=1` — настоящий маленький запрос к каждому **настроенному** сервису (Gemini, Groq, DeepL,
  Microsoft, Google, MyMemory, Workers AI, M2M100) параллельно, с таймаутом 8 с.
  Ответ: `checks: {gemini:{ok, latencyMs, message}, …}`. Результат кэшируется в D1 на 10 минут, чтобы кнопку
  нельзя было использовать для расхода лимитов.
- Без `check=1` — как сейчас (только «настроен / не настроен»).

## 3. Фронтенд (экран «Профиль»)

Порядок карточек: **Аккаунт → Мои ключи ИИ → Сервисы сайта → Настройки → Установка → О приложении.**

1. **AccountCard** (`src/components/profile/AccountCard.tsx`, отдельные файлы форм):
   - не вошёл: две вкладки «Вход» / «Регистрация», поля логин и пароль (кнопка «показать пароль»),
     подсказка «Один логин можно использовать на нескольких телефонах»;
   - вошёл: логин, список устройств («это устройство» помечено), кнопки «Выйти», «Выйти на всех устройствах»,
     «Сменить пароль».
   - хук `src/hooks/useAccount.tsx` (контекст, как `useSettings`): состояние входа, `login`, `register`, `logout`.
   - Все запросы — `credentials: 'include'` в `src/api/client.ts`; токен из ответа сохрани в localStorage
     (для Capacitor) и отправляй в `Authorization`, если cookie недоступна.
2. **KeysCard — мастер «за 3 нажатия»** (как в проекте «Мозги для колонки»):
   - Для каждого сервиса (Gemini, Groq) карточка с крупной кнопкой **«Получить бесплатный ключ»** — открывает в новой
     вкладке прямую страницу создания ключа (`https://aistudio.google.com/apikey`, `https://console.groq.com/keys`).
   - Под ней 3 коротких пронумерованных шага на языке интерфейса («1. Войдите через Google. 2. Нажмите Create API key.
     3. Скопируйте ключ и вернитесь сюда»).
   - Поле ключа + кнопка **«Вставить»** (`navigator.clipboard.readText()`, с try/catch — на iPhone может не сработать,
     тогда просто фокус на поле). После вставки ключ **проверяется автоматически**, показывается ✅ «Ключ работает,
     ответ за N мс» или ❌ с понятной причиной. Отдельная кнопка «Проверить ещё раз».
   - Вошёл в аккаунт → ключ сохраняется в аккаунт (на все устройства), иначе — только на это устройство,
     с подсказкой «Войдите, чтобы ключ работал на всех ваших устройствах».
   - Сохранённый ключ показывается как `••••1234` с кнопками «Проверить» и «Удалить».
   - Окно `LimitDialog` использует тот же мастер (вынеси общий компонент `KeyWizard.tsx`).
3. **SiteServicesCard** (замена списка в `AboutCard`): список всех сервисов с пометкой «ИИ» / «Переводчик»,
   кнопка **«Проверить сервисы сайта»** → `/api/health?check=1` → ✅/❌ и время ответа у каждого.
4. **Синхронизация:** вошёл — `useHistory` раз в минуту и при изменении отправляет изменения в `/api/sync`
   и подтягивает чужие (с других устройств). Без входа всё работает как сейчас (localStorage).
5. Все новые тексты — в `ru.json`, `de.json`, `en.json` (наборы ключей должны совпадать).

## 4. Проверка и отчёт

- `npm run build` без ошибок.
- Локально (`npm run dev:api` + `npm run dev`) проверь: регистрация, вход, вход вторым браузером,
  «выйти везде», сохранение и проверка ключа, синхронизация избранного между двумя браузерами, 11-я попытка входа → 429.
- В `README.md` добавь шаг: как создать секрет `KEY_ENCRYPTION_SECRET` в Cloudflare
  (Settings → Variables and secrets → Add → Secret) и как сгенерировать значение
  (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
- Версия `0.3.0` в `package.json`, `src/config.ts`, `functions/_lib/config.ts`; запись в `CHANGELOG.md`;
  раздел «Этап 2» в `REPORT.md`: файлы, что проверено, что не сделано.
