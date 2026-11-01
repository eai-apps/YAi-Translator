/**
 * Публичные настройки сайта (/api/site-settings), загружаются один раз за запуск.
 */
import { useEffect, useState } from 'react';
import type { SiteSettingsResponse } from '../../shared/types';
import { api } from '../api/client';

let cache: SiteSettingsResponse | null = null;
let pending: Promise<SiteSettingsResponse | null> | null = null;

function load(): Promise<SiteSettingsResponse | null> {
  pending ??= api
    .siteSettings()
    .then((data) => {
      cache = data;
      return data;
    })
    .catch(() => null);
  return pending;
}

export function useSiteSettings(): SiteSettingsResponse | null {
  const [data, setData] = useState<SiteSettingsResponse | null>(cache);
  useEffect(() => {
    if (cache) return;
    let active = true;
    void load().then((value) => {
      if (active && value) setData(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return data;
}
