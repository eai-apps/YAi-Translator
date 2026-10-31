/**
 * Страница «Грамматика» (/grammar): слева список тем с поиском и фильтром по уровню,
 * справа правило выбранной темы (версия 0.6.0).
 * Адрес /grammar/<slug> можно сохранить или отправить кому угодно — откроется та же тема.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GrammarTopicResponse, GrammarTopicSummary } from '../../shared/types';
import { api } from '../api/client';
import { useSettings } from '../hooks/useSettings';
import { grammarTitle } from '../components/grammar/grammarLabels';
import { GrammarTopicList } from '../components/grammar/GrammarTopicList';
import { GrammarTopicView } from '../components/grammar/GrammarTopicView';
import { useGrammarContext } from '../components/grammar/useGrammar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { IconArrowLeft, IconSparkles } from '../components/layout/icons';

interface GrammarPageProps {
  /** Список тем (общий для страницы и всплывающего окна). */
  topics: {
    data: { items: GrammarTopicSummary[] } | null;
    loading: boolean;
    failed: boolean;
    reload: () => void;
  };
}

export default function GrammarPage({ topics }: GrammarPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { uiLanguage } = useSettings();
  const { slug } = useParams<{ slug?: string }>();
  const [params] = useSearchParams();
  const { openTopic } = useGrammarContext();

  const [topic, setTopic] = useState<GrammarTopicResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Текст темы запрашивается только когда тема выбрана в адресе.
  useEffect(() => {
    if (!slug) {
      setTopic(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    api
      .grammarTopic(slug, uiLanguage, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setTopic(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, uiLanguage, attempt]);

  // Выбранная тема попадает в адрес: фильтр по уровню и поиск при переходе сохраняются.
  const select = (next: string) => {
    const query = params.toString();
    navigate(`/grammar/${next}${query ? `?${query}` : ''}`);
    // На телефоне список был прокручен вниз — тему показываем с начала.
    if (window.matchMedia('(max-width: 1023px)').matches) window.scrollTo({ top: 0 });
  };

  return (
    <>
      <PageHeader
        title={t('grammar.title')}
        subtitle={t('grammar.subtitle')}
        action={
          <Link to="/ask">
            <Button size="sm" variant="secondary" icon={<IconSparkles className="h-4 w-4" />}>
              {t('ask.title')}
            </Button>
          </Link>
        }
      />

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-4">
        {/* На телефоне — либо список, либо тема (иначе тема оказывалась под списком из 69 строк). */}
        <Card className={`p-4 sm:p-5 ${slug ? 'hidden lg:block' : ''}`}>
          {topics.loading && !topics.data ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted">
              <Spinner />
              <span>{t('common.loading')}</span>
            </div>
          ) : topics.failed ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted">{t('grammar.loadError')}</p>
              <Button size="sm" onClick={topics.reload}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <GrammarTopicList
              items={topics.data?.items ?? []}
              uiLanguage={uiLanguage}
              activeSlug={slug ?? null}
              onSelect={select}
            />
          )}
        </Card>

        <Card className={`p-4 sm:p-5 lg:sticky lg:top-5 ${slug ? '' : 'hidden lg:block'}`}>
          {slug ? (
            <Link to={`/grammar${params.toString() ? `?${params.toString()}` : ''}`} className="mb-3 inline-block lg:hidden">
              <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
                {t('grammar.allTopics')}
              </Button>
            </Link>
          ) : null}
          {!slug ? (
            <div className="flex flex-col items-start gap-2 py-4">
              <p className="text-sm font-medium">{t('grammar.pickTopic')}</p>
              <p className="max-w-prose text-sm leading-relaxed text-muted">{t('grammar.intro')}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted">
              <Spinner />
              <span>{t('grammar.generating')}</span>
            </div>
          ) : failed ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted">{t('grammar.loadError')}</p>
              <Button size="sm" onClick={() => setAttempt((value) => value + 1)}>
                {t('common.retry')}
              </Button>
            </div>
          ) : topic ? (
            <>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-xl font-semibold leading-snug">{grammarTitle(topic, uiLanguage)}</h2>
                <Link to={`/ask?q=${encodeURIComponent(topic.titleDe || topic.titleRu)}`}>
                  <Button size="sm" variant="ghost" icon={<IconSparkles className="h-4 w-4" />}>
                    {t('grammar.askAbout')}
                  </Button>
                </Link>
              </div>
              <GrammarTopicView topic={topic} onOpenTopic={openTopic} />
              {!topic.body ? (
                <div className="mt-3">
                  <Button size="sm" onClick={() => setAttempt((value) => value + 1)}>
                    {t('grammar.retryLater')}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted">{t('grammar.notFound')}</p>
              <Link to="/grammar">
                <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
                  {t('grammar.allTopics')}
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
