/** Грамматический разбор: порядок слов, союзы, падежи, времена, ошибки, слова. */
import { useTranslation } from 'react-i18next';
import type { ExplainResponse } from '../../../shared/types';
import type { TranslatorError } from '../../hooks/useTranslator';
import { AsyncPanel } from '../ui/AsyncPanel';
import { SectionTitle } from '../ui/SectionTitle';
import { GrammarLinkedInline, GrammarLinkedText } from '../grammar/GrammarLinkedText';
import { GrammarTopicLinks } from '../grammar/GrammarTopicLinks';

interface ExplanationPanelProps {
  data: ExplainResponse | null;
  loading: boolean;
  error: TranslatorError | null;
  onClose: () => void;
  onRetry: () => void;
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>
            {/* Названия тем внутри пункта — ссылки на справочник (этап 5). */}
            <GrammarLinkedInline text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ExplanationPanel({ data, loading, error, onClose, onRetry }: ExplanationPanelProps) {
  const { t } = useTranslation();

  return (
    <AsyncPanel
      title={t('explain.title')}
      subtitle={t('explain.subtitle')}
      loading={loading}
      error={error}
      onClose={onClose}
      onRetry={onRetry}
    >
      {data ? (
        <div className="space-y-5">
          <section>
            <SectionTitle>{t('explain.summary')}</SectionTitle>
            <div className="mt-2">
              <GrammarLinkedText items={[data.summary]} />
            </div>
            {/* Темы, которые назвал сам ИИ: точные ссылки, даже если слово не встретилось в тексте. */}
            <GrammarTopicLinks topics={data.topics} />
          </section>

          {data.wordOrder.length > 0 ? (
            <section>
              <SectionTitle>{t('explain.wordOrder')}</SectionTitle>
              <Bullets items={data.wordOrder} />
            </section>
          ) : null}

          {data.conjunctions.length > 0 ? (
            <section>
              <SectionTitle>{t('explain.conjunctions')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {data.conjunctions.map((item, index) => (
                  <li key={index} className="rounded-xl bg-soft px-3 py-2">
                    <p className="text-sm font-medium">
                      <GrammarLinkedInline text={item.conjunction} />
                      {item.meaning ? (
                        <span className="font-normal text-muted">
                          {' — '}
                          <GrammarLinkedInline text={item.meaning} />
                        </span>
                      ) : null}
                    </p>
                    {item.alternatives.length > 0 ? (
                      <p className="mt-1 text-xs text-muted">
                        {t('explain.alternatives')}: {item.alternatives.join(' · ')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.cases.length > 0 ? (
            <section>
              <SectionTitle>{t('explain.cases')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {data.cases.map((item, index) => (
                  <li key={index} className="border-l-2 border-accent pl-3">
                    <p className="text-sm font-medium">
                      <GrammarLinkedInline text={item.grammaticalCase} />
                    </p>
                    <div className="text-muted">
                      <GrammarLinkedText items={[item.usage]} />
                    </div>
                    {item.example ? <p className="mt-0.5 text-sm italic">{item.example}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.tenses.length > 0 ? (
            <section>
              <SectionTitle>{t('explain.tenses')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {data.tenses.map((item, index) => (
                  <li key={index} className="border-l-2 border-accent pl-3">
                    <p className="text-sm font-medium">
                      <GrammarLinkedInline text={item.tense} />
                    </p>
                    <div className="text-muted">
                      <GrammarLinkedText items={[item.usage]} />
                    </div>
                    {item.example ? <p className="mt-0.5 text-sm italic">{item.example}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.commonMistakes.length > 0 ? (
            <section>
              <SectionTitle>{t('explain.mistakes')}</SectionTitle>
              <ul className="mt-2 space-y-2">
                {data.commonMistakes.map((item, index) => (
                  <li key={index} className="rounded-xl border border-line px-3 py-2">
                    {item.wrong ? (
                      <p className="text-sm text-danger line-through">{item.wrong}</p>
                    ) : null}
                    <p className="text-sm font-medium text-success">{item.right}</p>
                    <div className="mt-1 text-muted">
                      <GrammarLinkedText items={[item.explanation]} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.vocabulary.length > 0 ? (
            <section>
              <SectionTitle>{t('explain.vocabulary')}</SectionTitle>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {data.vocabulary.map((item, index) => (
                  <li key={index} className="rounded-xl bg-soft px-3 py-2">
                    <p className="text-sm font-medium">
                      {item.word}
                      {item.translation ? (
                        <span className="font-normal text-muted"> — {item.translation}</span>
                      ) : null}
                    </p>
                    {item.note ? <p className="text-xs text-muted">{item.note}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </AsyncPanel>
  );
}
