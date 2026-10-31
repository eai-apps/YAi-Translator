/**
 * Последний APK на GitHub Releases (для страницы «Приложения»): версия, дата, размер, ссылка.
 * Нет ответа от GitHub — берём версию из /version.json сайта (без даты и размера).
 */
import { useEffect, useState } from 'react';

export const APK_URL = 'https://github.com/eai-apps/YAi-Translator/releases/latest/download/YAi-Translator.apk';
const RELEASE_API = 'https://api.github.com/repos/eai-apps/YAi-Translator/releases/latest';
const CACHE_KEY = 'yai.latestRelease';

export interface LatestRelease {
  version: string;
  /** ISO-дата публикации или null. */
  date: string | null;
  /** Размер APK в МБ или null. */
  sizeMb: number | null;
}

interface GithubRelease {
  tag_name?: string;
  published_at?: string;
  assets?: Array<{ name: string; size: number }>;
}

async function load(): Promise<LatestRelease | null> {
  try {
    const res = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (res.ok) {
      const data = (await res.json()) as GithubRelease;
      const apk = data.assets?.find((asset) => asset.name === 'YAi-Translator.apk');
      if (data.tag_name) {
        return {
          version: data.tag_name.replace(/^v/, ''),
          date: data.published_at ?? null,
          sizeMb: apk ? Math.round((apk.size / 1024 / 1024) * 10) / 10 : null,
        };
      }
    }
  } catch {
    // GitHub недоступен — ниже запасной вариант.
  }
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { versionName?: string };
    return data.versionName ? { version: data.versionName, date: null, sizeMb: null } : null;
  } catch {
    return null;
  }
}

export function useLatestRelease(): { release: LatestRelease | null; loading: boolean } {
  const [release, setRelease] = useState<LatestRelease | null>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? (JSON.parse(cached) as LatestRelease) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(release === null);

  useEffect(() => {
    if (release) return;
    let alive = true;
    void load().then((value) => {
      if (!alive) return;
      setRelease(value);
      setLoading(false);
      try {
        if (value) sessionStorage.setItem(CACHE_KEY, JSON.stringify(value));
      } catch {
        // sessionStorage недоступен — не страшно.
      }
    });
    return () => {
      alive = false;
    };
  }, [release]);

  return { release, loading };
}
