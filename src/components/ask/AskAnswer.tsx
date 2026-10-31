/** Ответ учителя: короткое объяснение, разделы, примеры и ссылки на темы справочника. */
import { useTranslation } from 'react-i18next';
import type { AskResponse } from '../../../shared/types';
import { shortModelName } from '../../hooks/useSiteAiModels';
import { Badge } from '../ui/Badge';
import { SectionTitle } from '../ui/SectionTitle';
import { GrammarLinkedInline } from '../grammar/GrammarLinkedText';
import { GrammarTopicLinks } from '../grammar/GrammarTopicLinks';

interface AskAnswerProps {
  answer: AskResponse;
  question: string;
}

export function AskAnswer({ answer, question }: AskAnswerProps) {
  const { t } = useTranslation();

  return (
    <article className="mt-4 rounded-2xl border border-line bg-card p-4 animate-fade-in sm:p-5">
      <p className="text-xs text-muted">{question}</p>
      <div className="mt-2 space-y-4">
        <GrammarLinkedInline text={answer.summary} />

        {answer.sections.map((section, index) => (
          <section key={index}>
            {section.heading ? <SectionTitle>{section.heading}</SectionTitle> : null}
            <p className="mt-1 text-sm leading-relaxed">
              <GrammarLinkedInline text={section.text} />
            </p>
          </section>
        ))}

        {answer.examples.length > 0 ? (
          <section>
            <SectionTitle>{t('ask.examples')}</SectionTitle>
            <ul className="mt-2 space-y-2">
              {answer.examples.map((example, index) => (
                <li key={index} className="rounded-xl bg-soft px-3 py-2">
                  <p className="text-sm font-medium leading-relaxed">
                    <GrammarLinkedInline text={example.text} />
                  </p>
                  {example.translation ? (
                    <p className="mt-0.5 text-sm text-muted">{example.translation}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GrammarTopicLinks topics={answer.topics} />

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
          <Badge>{t('ask.answeredBy', { provider: answer.provider })}</Badge>
          {answer.model ? (
            <span className="text-xs text-muted">
              {t('ask.repliedBy', { model: shortModelName(answer.model) })}
            </span>
          ) : null}
          {answer.cached ? <Badge tone="accent">{t('ask.fromCache')}</Badge> : null}
        </div>
      </div>
    </article>
  );
}
