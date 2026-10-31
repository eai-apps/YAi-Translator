/**
 * Вкладка «Словарь» (этап 8): пронумерованные значения, переводы кнопками-чипсами
 * (нажатие переводит нажатый перевод обратно) и короткая пометка значения.
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, WordMeaning } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import { Chips } from './Chips';

interface MeaningListProps {
  meanings: WordMeaning[];
  /** Язык переводов: клик по чипсе переводит его обратно на язык карточки. */
  translationLang: LanguageCode;
  /** Клик по переводу: слово и язык переводов. Без обработчика чипсы неактивны. */
  onPickTranslation?: (translation: string, lang: LanguageCode) => void;
}

export function MeaningList({ meanings, translationLang, onPickTranslation }: MeaningListProps) {
  const { t } = useTranslation();
  if (meanings.length === 0) return null;

  return (
    <ol className="space-y-3.5">
      {meanings.map((meaning, index) => (
        <li key={`${meaning.sense}-${index}`} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-soft text-[11px] font-semibold text-muted">
            {index + 1}
          </span>
          <div className="min-w-0">
            {meaning.translations.length > 0 ? (
              onPickTranslation ? (
                <Chips
                  items={meaning.translations}
                  tone="accent"
                  onPick={(value) => onPickTranslation(value, translationLang)}
                />
              ) : (
                <p
                  dir={textDirection(translationLang)}
                  className="text-base font-medium leading-snug text-accent sm:text-lg"
                >
                  {meaning.translations.join(', ')}
                </p>
              )
            ) : null}
            {meaning.sense || meaning.note ? (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {meaning.sense}
                {meaning.sense && meaning.note ? ' — ' : ''}
                {meaning.note}
              </p>
            ) : null}
          </div>
        </li>
      ))}
      {onPickTranslation ? (
        <li className="pl-[1.875rem] text-[11px] leading-relaxed text-muted">{t('word.chipHint')}</li>
      ) : null}
    </ol>
  );
}
