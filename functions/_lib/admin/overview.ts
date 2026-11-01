/** Сборка данных вкладки «Обзор» админки: пользователи, посетители, переводы, график за 30 дней. */
import type { AdminOverview } from '../../../shared/types';
import { ADMIN } from '../config';
import type { Env } from '../env';
import { countActiveUsersSince, countUsers, countUsersSince } from '../auth/users';
import { countVisitors, dayKey, dayKeyBefore, sumSince } from '../stats';
import { getPaidTokensUsage } from '../paid/manager';
import { readSetting, SETTINGS_KEYS } from '../settings';
import { TOTAL_WARM_TASKS } from '../../../shared/warmWords';
import { countStoredWordCards } from '../wordStore';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Популярные языковые пары за сегодня: metric «pair:de-ru». */
function popularPairs(totals: Record<string, number>): AdminOverview['popularPairs'] {
  return Object.entries(totals)
    .filter(([metric]) => metric.startsWith('pair:'))
    .map(([metric, count]) => {
      const [from, to] = metric.slice('pair:'.length).split('-');
      return { from: from ?? '', to: to ?? '', count };
    })
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

export async function buildOverview(env: Env): Promise<AdminOverview> {
  const now = Date.now();
  const today = dayKey();

  const [total, todayUsers, weekUsers, monthUsers, activeWeek, visitorsTodayUnique, visitorsWeek, visitorsMonth] =
    await Promise.all([
      countUsers(env),
      countUsersSince(env, now - DAY_MS),
      countUsersSince(env, now - 7 * DAY_MS),
      countUsersSince(env, now - 30 * DAY_MS),
      countActiveUsersSince(env, now - 7 * DAY_MS),
      countVisitors(env, today),
      countVisitors(env, dayKeyBefore(6)),
      countVisitors(env, dayKeyBefore(29)),
    ]);

  // Счётчики за сегодня.
  const todayTotals = await sumSince(env, today);
  const translationsToday: Record<string, number> = {};
  for (const [metric, value] of Object.entries(todayTotals)) {
    if (metric.startsWith('translations:')) translationsToday[metric.slice('translations:'.length)] = value;
  }

  const translationsTodayTotal = todayTotals.total ?? 0;
  const cacheHits = todayTotals.cache_hits ?? 0;
  const aiRequestsToday = todayTotals.ai_requests ?? 0;

  // Сбор подробной посуточной статистики за ADMIN.chartDays дней (этап 20):
  // переводы, уникальные посетители, новые пользователи, ошибки и какие переводчики отвечали.
  const oldestDay = dayKeyBefore(ADMIN.chartDays - 1);
  const oldestMs = Date.parse(`${oldestDay}T00:00:00Z`);

  const newUsersByDay: Record<string, number> = {};
  const errorsByDay: Record<string, number> = {};
  const translatorsByDay: Record<string, Record<string, number>> = {};
  const totalsByDay: Record<string, number> = {};
  const visitorsMapByDay: Record<string, number> = {};

  if (env.DB) {
    try {
      const [userRows, errorRows, statsRows, visitorRows] = await Promise.all([
        env.DB.prepare(
          "SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS day, COUNT(*) AS count FROM users WHERE created_at >= ? GROUP BY day",
        )
          .bind(oldestMs)
          .all<{ day: string; count: number }>(),
        env.DB.prepare(
          "SELECT strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch') AS day, COUNT(*) AS count FROM client_errors WHERE timestamp >= ? GROUP BY day",
        )
          .bind(oldestMs)
          .all<{ day: string; count: number }>()
          .catch(() => ({ results: [] })),
        env.DB.prepare('SELECT day, metric, value FROM stats_daily WHERE day >= ?')
          .bind(oldestDay)
          .all<{ day: string; metric: string; value: number }>(),
        env.DB.prepare('SELECT day, COUNT(DISTINCT visitor_hash) AS count FROM visitors WHERE day >= ? GROUP BY day')
          .bind(oldestDay)
          .all<{ day: string; count: number }>(),
      ]);

      for (const row of userRows.results ?? []) {
        if (row.day) newUsersByDay[row.day] = row.count;
      }
      for (const row of errorRows.results ?? []) {
        if (row.day) errorsByDay[row.day] = row.count;
      }
      for (const row of statsRows.results ?? []) {
        if (row.metric === 'total') {
          totalsByDay[row.day] = row.value;
        } else if (row.metric.startsWith('translations:')) {
          const provider = row.metric.slice('translations:'.length);
          if (!translatorsByDay[row.day]) translatorsByDay[row.day] = {};
          translatorsByDay[row.day][provider] = row.value;
        }
      }
      for (const row of visitorRows.results ?? []) {
        if (row.day) visitorsMapByDay[row.day] = row.count;
      }
    } catch (e) {
      console.warn('Ошибка сбора посуточной статистики:', e);
    }
  }

  const daily: AdminOverview['daily'] = [];
  for (let offset = ADMIN.chartDays - 1; offset >= 0; offset -= 1) {
    const day = dayKeyBefore(offset);
    daily.push({
      day,
      translations: totalsByDay[day] ?? 0,
      visitors: visitorsMapByDay[day] ?? 0,
      newUsers: newUsersByDay[day] ?? 0,
      errors: errorsByDay[day] ?? 0,
      translators: translatorsByDay[day] ?? {},
    });
  }

  const [paidUsage, dailyLimitSetting, monthlyLimitSetting] = await Promise.all([
    getPaidTokensUsage(env),
    readSetting<number>(env, SETTINGS_KEYS.paidDailyTokenLimit),
    readSetting<number>(env, SETTINGS_KEYS.paidMonthlyTokenLimit),
  ]);

  let warmedCards = { ready: 0, total: TOTAL_WARM_TASKS };
  if (env.DB) {
    try {
      const ready = await countStoredWordCards(env);
      warmedCards = { ready, total: TOTAL_WARM_TASKS };
    } catch {
      // Игнорируем ошибку при отсутствии таблицы
    }
  }

  return {
    users: { total, today: todayUsers, week: weekUsers, month: monthUsers, activeWeek },
    visitors: { today: visitorsTodayUnique, week: visitorsWeek, month: visitorsMonth },
    translationsToday,
    translationsTodayTotal,
    cacheHitRate: translationsTodayTotal > 0 ? Math.min(1, cacheHits / translationsTodayTotal) : 0,
    aiRequestsToday,
    study: {
      reviewsToday: todayTotals.study_reviews ?? 0,
      exercisesToday: todayTotals.study_exercises ?? 0,
    },
    popularPairs: popularPairs(todayTotals),
    daily,
    paidTokens: {
      today: paidUsage.today,
      month: paidUsage.month,
      dailyLimit: dailyLimitSetting ?? 50_000,
      monthlyLimit: monthlyLimitSetting ?? 1_000_000,
    },
    warmedCards,
  };
}
