/** Загрузка полезных ресурсов (/api/resources) с понятной ошибкой и повтором. */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ResourcesResponse } from '../../shared/types';

export interface ResourcesState {
  data: ResourcesResponse | null;
  loading: boolean;
  failed: boolean;
  reload: () => void;
}

export function useResources(): ResourcesState {
  const [data, setData] = useState<ResourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    api
      .resources(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, loading, failed, reload };
}
