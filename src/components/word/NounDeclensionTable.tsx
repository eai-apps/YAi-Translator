/** Существительное: 4 падежа × ед./мн. с артиклем цветом (вкладка «Формы»). */
import { useTranslation } from 'react-i18next';
import type { WordCard } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { grammaticalCaseKey } from '../../lib/labels';
import { SpeakButton } from '../ui/SpeakButton';

interface NounDeclensionTableProps {
  card: WordCard;
  speech: SpeechController;
}

/** «der Tisch» → артикль цветом, слово обычное. */
function ArticleWord({ value }: { value: string }) {
  const match = value.match(/^(der|die|das)\s+(.+)$/i);
  if (!match) return <>{value}</>;
  const article = match[1].toLowerCase() as 'der' | 'die' | 'das';
  return (
    <>
      <span className={cn('font-semibold', ARTICLE_COLORS[article])}>{match[1]}</span> {match[2]}
    </>
  );
}

export function NounDeclensionTable({ card, speech }: NounDeclensionTableProps) {
  const { t } = useTranslation();
  if (!card.declension) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t('word.declensionTitle')}</h4>
        <SpeakButton
          text={card.meanings[0]?.translations[0] ?? card.lemma}
          language={card.language}
          id="forms-noun-speak"
          speech={speech}
          label={t('common.listen')}
        />
      </div>
      <div className="table-scroll mt-2">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-medium">{t('word.case')}</th>
              <th className="py-2 pr-3 font-medium">{t('word.singular')}</th>
              <th className="py-2 font-medium">{t('word.plural')}</th>
            </tr>
          </thead>
          <tbody>
            {card.declension.map((row) => (
              <tr key={row.grammaticalCase} className="border-b border-line last:border-0">
                <td className="py-2 pr-3 text-xs text-muted">{t(grammaticalCaseKey(row.grammaticalCase))}</td>
                <td className="py-2 pr-3 font-medium">
                  <ArticleWord value={row.singular} />
                </td>
                <td className="py-2">
                  {row.plural ? <ArticleWord value={row.plural} /> : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
