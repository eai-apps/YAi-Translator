/**
 * Вкладка «Формы» (этап 8, «Склонения и спряжения»).
 * Глагол — переключатель «настоящее / прошедшее / будущее», у каждой таблицы подсказка и 🔊.
 * Существительное — 4 падежа × ед./мн. с цветным артиклем.
 * Прилагательное — степени сравнения и три таблицы склонения (сильное / слабое / смешанное).
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordCard } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { VerbFormsSection } from './VerbFormsSection';
import { AdjectiveSection } from './AdjectiveSection';
import { NounDeclensionTable } from './NounDeclensionTable';

interface FormsSectionProps {
  card: WordCard;
  speech: SpeechController;
  /** Язык переводов — для склонения существительных без немецкого в предложении. */
  translationLang?: LanguageCode | null;
}

export function FormsSection({ card, speech }: FormsSectionProps) {
  const { t } = useTranslation();
  const hasVerb = Boolean(card.conjugation);
  const hasNoun = Boolean(card.declension) || Boolean(card.plural);
  const hasAdjective = card.language === 'de' && card.partOfSpeech === 'adjective';

  if (!hasVerb && !hasAdjective && !hasNoun) {
    return <p className="text-sm text-muted">{t('word.noForms')}</p>;
  }

  return (
    <div className="space-y-6">
      {card.conjugation ? <VerbFormsSection card={card} conjugation={card.conjugation} speech={speech} /> : null}
      {hasAdjective ? <AdjectiveSection lemma={card.lemma} speech={speech} language={card.language} /> : null}
      {!card.conjugation && hasNoun ? <NounDeclensionTable card={card} speech={speech} /> : null}
    </div>
  );
}
