/**
 * Нейросети сайта (платные подключения из админки) для списка «Быстрый перевод ▾» (0.9.3, Claude).
 * defaultId и статус ok моделей (0.10.0, Antigravity).
 * Ответ запоминается на всё время работы страницы.
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';

export interface SiteAiModelItem {
  id: string;
  model: string;
  ok?: boolean | null;
}

export interface SiteAiModels {
  models: SiteAiModelItem[];
  regOnly: boolean;
  defaultId?: string | null;
}

let cached: SiteAiModels | null = null;
let pending: Promise<SiteAiModels | null> | null = null;

function load(): Promise<SiteAiModels | null> {
  pending ??= api
    .aiModels()
    .then((value) => {
      cached = value;
      return value;
    })
    .catch(() => {
      pending = null;
      return null;
    });
  return pending;
}

/** Короткое имя модели: «openai/gpt-4o-mini» → «gpt-4o-mini». */
export function shortModelName(model: string): string {
  const last = model.split('/').pop() ?? model;
  return last.replace(/^models\//, '');
}

export function useSiteAiModels(): SiteAiModels | null {
  const [value, setValue] = useState(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    void load().then((next) => {
      if (alive && next) setValue(next);
    });
    return () => {
      alive = false;
    };
  }, []);
  return value;
}
