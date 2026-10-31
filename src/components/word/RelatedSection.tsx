/**
 * Вкладка «Связанные слова» (этап 8): синонимы, антонимы, однокоренные слова (family),
 * управление и устойчивые выражения. Всё чипсами, всё нажимается; длинные списки — «…ещё».
 */
import { useTranslation } from 'react-i18next';
import type { Phrase, WordCard } from '../../../shared/types';
import { SectionTitle } from '../ui/SectionTitle';
import { usePick } from './pick';
import { Chips } from './Chips';

/** Сколько показывать без нажатия «…ещё». */
const VISIBLE = 10;

/** Фраза-выражение: немецкая часть нажимается, перевод — обычный текст. */
function PhraseChips({ phrases, onPick }: { phrases: Phrase[]; onPick: (value: string) => void }) {
  if (phrases.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {phrases.slice(0, VISIBLE).map((phrase, index) => (
        <li key={`${phrase.text}-${index}`} className="rounded-xl bg-soft px-3 py-1.5">
          <button
            type="button"
            onClick={() => onPick(phrase.text)}
            className="text-left text-sm font-medium leading-relaxed hover:underline hover:decoration-dotted hover:underline-offset-4"
          >
            {phrase.text}
          </button>
          {phrase.translation ? (
            <p className="text-sm leading-relaxed text-muted">{phrase.translation}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function RelatedSection({
  card,
  onPick,
}: {
  card: WordCard;
  onPick?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const pick = usePick();
  // На странице перевода контекст нажатия важнее переданного обработчика.
  const handlePick = pick ?? onPick;

  const groups = [
    { title: t('word.synonyms'), items: card.synonyms, tone: 'neutral' as const },
    { title: t('word.antonyms'), items: card.antonyms, tone: 'danger' as const },
    { title: t('word.family'), items: card.family ?? [], tone: 'neutral' as const },
    { title: t('word.governance'), items: card.governance, tone: 'neutral' as const },
  ].filter((group) => group.items.length > 0);

  if (groups.length === 0 && card.phrases.length === 0) {
    return <p className="text-sm text-muted">{t('word.noRelated')}</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.title}>
          <SectionTitle>{group.title}</SectionTitle>
          <Chips className="mt-2" items={group.items} tone={group.tone} limit={VISIBLE} onPick={handlePick ?? (() => undefined)} />
        </section>
      ))}

      {card.phrases.length > 0 ? (
        <section>
          <SectionTitle>{t('word.phrases')}</SectionTitle>
          <PhraseChips phrases={card.phrases} onPick={handlePick ?? (() => undefined)} />
        </section>
      ) : null}
    </div>
  );
}
