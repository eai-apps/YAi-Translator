/** Грамматический разбор: порядок слов, союзы, падежи, времена, ошибки, слова. */
import { useTranslation } from 'react-i18next';
import type { ExplainResponse } from '../../../shared/types';
import type { TranslatorError } from '../../hooks/useTranslator';
import { AsyncPanel } from '../ui/AsyncPanel';
import { SectionTitle } from '../ui/SectionTitle';

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
    <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2">
          <span className="mt-[2px] text-accent">•</span>
          <span>{item}</span>
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
            <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
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
                      {item.conjunction}
                      {item.meaning ? <span className="font-normal text-muted"> — {item.meaning}</span> : null}
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
                    <p className="text-sm font-medium">{item.grammaticalCase}</p>
                    <p className="text-sm text-muted">{item.usage}</p>
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
                    <p className="text-sm font-medium">{item.tense}</p>
                    <p className="text-sm text-muted">{item.usage}</p>
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
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.explanation}</p>
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
