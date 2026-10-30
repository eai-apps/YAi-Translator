/** Словарь: поиск слова, избранное и история. Всё хранится на устройстве. */
import { useCallback, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { WordResponse } from '../../shared/types';
import { api } from '../api/client';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';
import { useHistory } from '../hooks/useHistory';
import { useSettings } from '../hooks/useSettings';
import { useSpeech } from '../hooks/useSpeech';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Segmented';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionTitle } from '../components/ui/SectionTitle';
import { IconAlert, IconBook, IconClock, IconSearch, IconStar, IconTrash } from '../components/layout/icons';
import { WordCard } from '../components/word/WordCard';
import { HistoryRow } from '../components/dictionary/HistoryRow';
import { LimitDialog } from '../components/limit/LimitDialog';
import { errorMessageKey, providerLabel } from '../lib/errors';

type Tab = 'search' | 'favorites' | 'history';

export default function DictionaryPage() {
  const { t, i18n } = useTranslation();
  const { uiLanguage } = useSettings();
  const { items, favorites, toggleFavorite, removeItem, clearHistory } = useHistory();
  const navigate = useNavigate();
  const speech = useSpeech();

  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [card, setCard] = useState<WordResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TranslatorError | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const word = query.trim();
      if (!word) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      try {
        const response = await api.word(
          { word, sourceLang: 'auto', targetLang: uiLanguage === 'de' ? 'ru' : 'de' },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setCard(response);
      } catch (caught) {
        if (controller.signal.aborted) return;
        const apiError = toTranslatorError(caught, t('errors.unknown'));
        setCard(null);
        setError(apiError);
        if (apiError.code === 'LIMIT_REACHED') setLimitOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [query, uiLanguage, t],
  );

  const openInTranslator = (text: string, from: string, to: string) => {
    const params = new URLSearchParams({ text, from, to });
    navigate(`/?${params.toString()}`);
  };

  const historyCount = items.length;

  return (
    <>
      <PageHeader title={t('dictionary.title')} subtitle={t('dictionary.subtitle')} />

      <Segmented
        ariaLabel={t('dictionary.title')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'search', label: t('dictionary.tabSearch') },
          { value: 'favorites', label: t('dictionary.tabFavorites') },
          { value: 'history', label: t('dictionary.tabHistory') },
        ]}
      />

      {tab === 'search' ? (
        <section className="mt-4">
          <Card className="p-3">
            <form onSubmit={(event) => void search(event)} className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('dictionary.searchPlaceholder')}
                  aria-label={t('dictionary.searchPlaceholder')}
                  maxLength={60}
                  className="h-11 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <Button type="submit" variant="primary" loading={loading} disabled={!query.trim()}>
                {t('dictionary.search')}
              </Button>
            </form>
          </Card>

          {error ? (
            <Card className="mt-3 p-4">
              <div className="flex items-start gap-2 text-danger">
                <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm leading-relaxed">{t(errorMessageKey(error.code))}</p>
                  {error.code === 'LIMIT_REACHED' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="mt-2"
                      onClick={() => setLimitOpen(true)}
                    >
                      {t('limit.title')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {card ? (
            <Card className="mt-3 p-4 sm:p-5">
              <WordCard card={card.card} speech={speech} />
              <p className="mt-4 border-t border-line pt-2 text-[11px] text-muted">
                {t('translate.provider', { provider: providerLabel(card.provider) })}
                {card.cached ? ` · ${t('translate.fromCache')}` : ''}
              </p>
            </Card>
          ) : null}

          {!card && !error && !loading ? (
            <Card className="mt-3">
              <EmptyState
                icon={<IconBook className="h-6 w-6" />}
                title={t('dictionary.title')}
                text={t('dictionary.searchPlaceholder')}
              />
            </Card>
          ) : null}
        </section>
      ) : null}

      {tab === 'favorites' ? (
        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>{t('dictionary.favoritesTitle')}</SectionTitle>
            <span className="text-xs text-muted">{favorites.length}</span>
          </div>
          {favorites.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconStar className="h-6 w-6" />}
                title={t('dictionary.tabFavorites')}
                text={t('dictionary.favoritesEmpty')}
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {favorites.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onOpen={() => openInTranslator(item.text, item.sourceLang, item.targetLang)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'history' ? (
        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <SectionTitle>{t('dictionary.historyTitle')}</SectionTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">
                {new Intl.NumberFormat(i18n.language).format(historyCount)}
              </span>
              {historyCount > 0 ? (
                <Button
                  size="sm"
                  variant="danger"
                  icon={<IconTrash className="h-4 w-4" />}
                  onClick={clearHistory}
                >
                  {t('dictionary.clearHistory')}
                </Button>
              ) : null}
            </div>
          </div>
          {historyCount === 0 ? (
            <Card>
              <EmptyState
                icon={<IconClock className="h-6 w-6" />}
                title={t('dictionary.tabHistory')}
                text={t('dictionary.historyEmpty')}
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onOpen={() => openInTranslator(item.text, item.sourceLang, item.targetLang)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} onSaved={() => void search()} />
    </>
  );
}
