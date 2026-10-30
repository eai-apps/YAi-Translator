/** Сборка данных вкладки «Обзор» админки: пользователи, посетители, переводы, график за 30 дней. */
import type { AdminOverview } from '../../../shared/types';
import { ADMIN } from '../config';
import type { Env } from '../env';
import { countActiveUsersSince, countUsers, countUsersSince } from '../auth/users';
import { countVisitors, dayKey, dayKeyBefore, sumSince, valueOf, visitorsOnDay } from '../stats';

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

  // График за ADMIN.chartDays дней: переводы и посетители по дням.
  const daily: AdminOverview['daily'] = [];
  for (let offset = ADMIN.chartDays - 1; offset >= 0; offset -= 1) {
    const day = dayKeyBefore(offset);
    const [translations, visitors] = await Promise.all([
      valueOf(env, day, 'total'),
      visitorsOnDay(env, day),
    ]);
    daily.push({ day, translations, visitors });
  }

  return {
    users: { total, today: todayUsers, week: weekUsers, month: monthUsers, activeWeek },
    visitors: { today: visitorsTodayUnique, week: visitorsWeek, month: visitorsMonth },
    translationsToday,
    translationsTodayTotal,
    cacheHitRate: translationsTodayTotal > 0 ? Math.min(1, cacheHits / translationsTodayTotal) : 0,
    aiRequestsToday,
    popularPairs: popularPairs(todayTotals),
    daily,
  };
}
