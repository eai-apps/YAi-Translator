/**
 * «Офлайн-режим» в настройках (этап 8): что работает без сети и кнопка «Проверить офлайн-готовность» —
 * сколько карточек, избранного и подсказок-слов уже лежит на устройстве/в кэше сервера.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { useHistory } from '../../hooks/useHistory';
import { useStudy } from '../../hooks/useStudy';
import { Button } from '../ui/Button';

export function OfflineCard() {
  const { t } = useTranslation();
  const { cards } = useStudy();
  const { favorites } = useHistory();
  const [result, setResult] = useState<{ cards: number; favorites: number; suggestions: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const check = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await api.suggestCount();
      setResult({
        cards: cards.length,
        favorites: favorites.length,
        suggestions: response.cachedWords ?? 0,
      });
    } catch {
      setResult(null);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-sm font-medium">{t('profile.offlineTitle')}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t('profile.offlineText')}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" loading={busy} onClick={() => void check()}>
          {busy ? t('profile.offlineChecking') : t('profile.offlineCheck')}
        </Button>
        {result ? (
          <p className="text-xs leading-relaxed text-muted" role="status">
            {t('profile.offlineResult', {
              cards: result.cards,
              favorites: result.favorites,
              suggestions: result.suggestions,
            })}
          </p>
        ) : null}
        {failed ? (
          <p className="text-xs text-danger" role="alert">
            {t('profile.offlineError')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
