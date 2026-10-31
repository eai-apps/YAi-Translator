/** Словарь: поиск слова, избранное и история. Всё хранится на устройстве. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDictionarySearch } from '../hooks/useDictionarySearch';
import { useHistory } from '../hooks/useHistory';
import { useSettings } from '../hooks/useSettings';
import { useSpeech } from '../hooks/useSpeech';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Segmented';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionTitle } from '../components/ui/SectionTitle';
import { IconClock, IconStar, IconTrash } from '../components/layout/icons';
import { DictionarySearchPanel } from '../components/dictionary/DictionarySearchPanel';
import { HistoryRow } from '../components/dictionary/HistoryRow';
import { LimitDialog } from '../components/limit/LimitDialog';

type Tab = 'search' | 'favorites' | 'history';

export default function DictionaryPage() {
  const { t, i18n } = useTranslation();
  const { uiLanguage } = useSettings();
  const { items, favorites, toggleFavorite, removeItem, clearHistory } = useHistory();
  const navigate = useNavigate();
  const speech = useSpeech();
  const [tab, setTab] = useState<Tab>('search');
  const search = useDictionarySearch(uiLanguage);

  const openInTranslator = (text: string, from: string, to: string) => {
    navigate(`/?${new URLSearchParams({ text, from, to }).toString()}`);
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
        <DictionarySearchPanel
          query={search.query}
          onQueryChange={search.setQuery}
          onSearch={() => void search.search()}
          loading={search.loading}
          card={search.card}
          dict={search.dict}
          error={search.error}
          speech={speech}
          onOpenLimit={search.onLimit}
          uiLang={uiLanguage}
          onPickWord={(w) => void search.search(w)}
          sourceLang={search.sourceLang}
          targetLang={search.targetLang}
          onSourceChange={search.setSourceLang}
          onTargetChange={search.setTargetLang}
        />
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
              <span className="text-xs text-muted">{new Intl.NumberFormat(i18n.language).format(historyCount)}</span>
              {historyCount > 0 ? (
                <Button size="sm" variant="danger" icon={<IconTrash className="h-4 w-4" />} onClick={clearHistory}>
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

      <LimitDialog
        open={search.limitOpen}
        onClose={search.closeLimit}
        onSaved={() => void search.search()}
      />
    </>
  );
}
