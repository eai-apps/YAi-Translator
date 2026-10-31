/**
 * Какие переводчики сейчас подключены и включены на сайте (по /api/health).
 * Ответ запоминается на всё время работы страницы: список нужен в выпадающем меню переводчиков.
 */
import { useEffect, useState } from 'react';
import type { ProviderId } from '../../shared/types';
import { api } from '../api/client';

let cached: Record<ProviderId, boolean> | null = null;
let pending: Promise<Record<ProviderId, boolean> | null> | null = null;

function load(): Promise<Record<ProviderId, boolean> | null> {
  pending ??= api
    .health()
    .then((health) => {
      cached = health.providers;
      return cached;
    })
    .catch(() => {
      pending = null; // попробуем ещё раз при следующем открытии страницы
      return null;
    });
  return pending;
}

/** null — ещё не знаем (показываем только «Авто»). */
export function useSiteProviders(): Record<ProviderId, boolean> | null {
  const [providers, setProviders] = useState(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    void load().then((value) => {
      if (alive && value) setProviders(value);
    });
    return () => {
      alive = false;
    };
  }, []);
  return providers;
}
