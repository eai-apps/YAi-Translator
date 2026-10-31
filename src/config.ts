/**
 * Настройки клиента. Адрес API берётся из VITE_API_BASE:
 * пусто — тот же домен (обычный сайт), иначе — внешний сервер (приложения Capacitor).
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

/** Версия показывается в профиле; совпадает с package.json. */
export const APP_VERSION = '0.12.0';

/** Код версии приложения Android (увеличивается при каждом обновлении APK). */
export const ANDROID_VERSION_CODE = 2;

export const STORAGE_KEYS = {
  theme: 'yai.theme',
  uiLanguage: 'yai.uiLanguage',
  keys: 'yai.keys',
  sourceLang: 'yai.sourceLang',
  targetLang: 'yai.targetLang',
  history: 'yai.history',
  provider: 'yai.provider',
  /** Токен входа для приложений (на сайте сессия живёт в cookie HttpOnly). */
  session: 'yai.session',
  /** Логин последнего входа — только чтобы подставить его в форму. */
  lastLogin: 'yai.lastLogin',
  /** Удалённые записи истории и избранного, которые ещё не отправлены на сервер. */
  syncTombstones: 'yai.syncTombstones',
  /** До какого момента забрали изменения с сервера (передаётся в ?since=). */
  syncSince: 'yai.syncSince',
  /** Блок «Как переводят другие» показывается автоматически (по умолчанию да). */
  showOthers: 'yai.showOthers',
  /** Настройки перевода (этап 8): история, определение языка, подсказки, Enter и «другие». */
  translateSettings: 'yai.translateSettings',
  /** Последняя версия, про которую пользователь видел окно «Что нового». */
  seenVersion: 'yai.seenVersion',
  /** Закрытый посетителем баннер-объявление (по тексту). */
  bannerClosed: 'yai.bannerClosed',
  /** Язык на странице «Ресурсы», выбранный посетителем (иначе — язык перевода). */
  resourcesLang: 'yai.resourcesLang',
  /** История «Спросить у AI»: вопросы и сохранённые ответы (этап 5). */
  askHistory: 'yai.askHistory',
  /** Учёба (этап 6): карточки, прогресс, дни, цель и слово дня. */
  studyCards: 'yai.study.cards',
  studyProgress: 'yai.study.progress',
  studyDays: 'yai.study.days',
  studyGoal: 'yai.study.goal',
  studyNewPerDay: 'yai.study.newPerDay',
  /** До какого момента прогресс уже забрали с сервера. */
  studySyncSince: 'yai.study.since',
  /** День, на который посетитель скрыл слово дня. */
  studyWordOfDayClosed: 'yai.study.wordOfDayClosed',
  /** Уже отправленные на сервер карточки, прогресс и дни (id → updatedAt). */
  studyMarksCards: 'yai.study.marks.cards',
  studyMarksProgress: 'yai.study.marks.progress',
  studyMarksDays: 'yai.study.marks.days',
  /** Свои списки слов «Мои списки» (этап 8Б). */
  studyLists: 'yai.study.lists',
  /** Уже отправленные на сервер списки (id → updatedAt). */
  studyMarksLists: 'yai.study.marks.lists',
} as const;

/** Отметки отправленного для синхронизации: у истории переводов и у вопросов ИИ — свои. */
export const SYNC_MARKS = {
  history: `${STORAGE_KEYS.syncTombstones}.history`,
  ask: `${STORAGE_KEYS.syncTombstones}.ask`,
} as const;

/** Длина вопроса в «Спросить у AI» (совпадает с ASK.maxQuestionLength на сервере). */
export const ASK_MAX_QUESTION_LENGTH = 500;

/** Примеры вопросов на странице «Спросить у AI»: показывают, что можно спросить. */
export const ASK_EXAMPLE_QUESTIONS = [
  'ask.example1',
  'ask.example2',
  'ask.example3',
  'ask.example4',
] as const;

/** До какой длины текста блок «Как переводят другие» загружается сам. */
export const OTHERS_AUTO_MAX_CHARS = 300;

/** Как часто вошедший пользователь обменивается изменениями с сервером. */
export const SYNC_INTERVAL_MS = 60_000;

/** Докуда хранить список удалённых записей (длиннее не нужно: сервер их уже знает). */
export const SYNC_TOMBSTONE_LIMIT = 500;

/** Задержка перевода после окончания ввода. */
export const TRANSLATE_DEBOUNCE_MS = 600;

/** Совпадает с LIMITS.maxTextLength на сервере (functions/_lib/config.ts). */
export const MAX_TEXT_LENGTH = 3000;

/** Сколько последних переводов хранится в истории (избранное не удаляется). */
export const HISTORY_LIMIT = 50;

export const HISTORY_STORAGE_LIMIT = 300;

/** Цвета артиклей: der — синий, die — красный, das — зелёный. */
export const ARTICLE_COLORS = {
  der: 'text-der',
  die: 'text-die',
  das: 'text-das',
} as const;

/** Тип сборки: web, ios, android или rustore. */
export function storeBuild(): 'web' | 'ios' | 'android' | 'rustore' {
  const env = (import.meta.env.VITE_STORE_BUILD ?? '').toLowerCase();
  if (env === 'ios') return 'ios';
  if (env === 'android') return 'android';
  if (env === 'rustore') return 'rustore';
  return 'web';
}
