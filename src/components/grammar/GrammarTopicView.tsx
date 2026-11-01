/**
 * Карточка темы справочника (версия 0.6.0): правило, когда нужно, как образуется,
 * примеры, исключения, типичные ошибки и ссылки на открытые источники.
 * Используется и на странице /grammar, и во всплывающем окне.
 */
import { useTranslation } from 'react-i18next';
import type { GrammarTopicResponse } from '../../../shared/types';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';
import { grammarCategoryKey } from './grammarLabels';
import { GrammarLinkedText } from './GrammarLinkedText';
import { GrammarQuiz } from './GrammarQuiz';
import { GrammarTableSection } from './GrammarTableSection';

interface GrammarTopicViewProps {
  topic: GrammarTopicResponse;
  /** Переход к связанной теме (в окне — новый текст, на странице — адрес темы). */
  onOpenTopic: (slug: string) => void;
  /** Всплывающее окно: меньше отступов, заголовок уже есть сверху. */
  compact?: boolean;
}

/** Список пунктов с маркером; термины внутри — ссылки на справочник. */
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <GrammarLinkedText items={[item]} />
        </li>
      ))}
    </ul>
  );
}

/** Ссылка на связанную тему: без перехода на страницу, через onOpenTopic. */
function RelatedButton({ slug, onOpenTopic }: { slug: string; onOpenTopic: (slug: string) => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onOpenTopic(slug)}
      className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {t(`grammar.topics.${slug}`, { defaultValue: slug })}
    </button>
  );
}

/** Открытые источники: только ссылки, текст не копируем (лицензии CC BY-SA и других). */
function Sources({ links }: { links: GrammarTopicResponse['links'] }) {
  const { t } = useTranslation();
  return (
    <section className="border-t border-line pt-3">
      <p className="text-xs font-medium text-muted">{t('grammar.sourcesTitle')}</p>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener"
              className="text-xs text-accent underline decoration-dotted underline-offset-2"
            >
              {link.title}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t('grammar.sourcesHint')}</p>
    </section>
  );
}

export function GrammarTopicView({ topic, onOpenTopic, compact = false }: GrammarTopicViewProps) {
  const { t } = useTranslation();
  const body = topic.body;

  return (
    <div className={compact ? 'space-y-5' : 'space-y-6'}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{topic.level}</Badge>
        <Badge>{t(grammarCategoryKey(topic.category))}</Badge>
      </div>

      {!body ? (
        <div className="rounded-xl bg-soft px-3 py-3">
          <p className="text-sm leading-relaxed">{t('grammar.notReady')}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {topic.offlineReason === 'limit' ? t('grammar.notReadyLimit') : t('grammar.notReadyError')}
          </p>
        </div>
      ) : (
        <>
          <GrammarLinkedText items={[body.summary]} />

          {body.whenToUse.length > 0 ? (
            <section>
              <SectionTitle>{t('grammar.whenToUse')}</SectionTitle>
              <Bullets items={body.whenToUse} />
            </section>
          ) : null}

          {body.formation.length > 0 ? (
            <section>
              <SectionTitle>{t('grammar.formation')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {body.formation.map((item, index) => (
                  <li key={index} className="rounded-xl border border-line px-3 py-2">
                    <GrammarLinkedText items={[item.rule]} />
                    {item.example ? <p className="mt-1 text-sm font-medium">{item.example}</p> : null}
                    {item.translation ? <p className="text-sm text-muted">{item.translation}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {body.examples.length > 0 ? (
            <section>
              <SectionTitle>{t('grammar.examples')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {body.examples.map((item, index) => (
                  <li key={index} className="rounded-xl bg-soft px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-relaxed">{item.text}</p>
                      <Badge>{item.level}</Badge>
                    </div>
                    {item.translation ? <p className="mt-0.5 text-sm text-muted">{item.translation}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {body.exceptions.length > 0 ? (
            <section>
              <SectionTitle>{t('grammar.exceptions')}</SectionTitle>
              <Bullets items={body.exceptions} />
            </section>
          ) : null}

          {body.commonMistakes.length > 0 ? (
            <section>
              <SectionTitle>{t('grammar.commonMistakes')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {body.commonMistakes.map((item, index) => (
                  <li key={index} className="rounded-xl border border-line px-3 py-2">
                    {item.wrong ? <p className="text-sm text-danger line-through">{item.wrong}</p> : null}
                    <p className="text-sm font-medium text-success">{item.right}</p>
                    {item.why ? (
                      <div className="mt-1 text-muted">
                        <GrammarLinkedText items={[item.why]} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {body.table ? <GrammarTableSection table={body.table} /> : null}

          {body.quiz && body.quiz.length > 0 ? <GrammarQuiz quiz={body.quiz} /> : null}

          {body.related.length > 0 ? (
            <section>
              <SectionTitle>{t('grammar.related')}</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {body.related.map((slug) => (
                  <RelatedButton key={slug} slug={slug} onOpenTopic={onOpenTopic} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <Sources links={topic.links} />
    </div>
  );
}
