/**
 * Вкладка «Слово» в словаре: поле поиска (слово на любом языке), выбор языка слова и языка перевода,
 * карточка ИИ и, если ИИ недоступен, карточка из словарей.
 * Этап 8Б: подсказка «Введите слово на любом языке…», «Определить» по умолчанию.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage, WordResponse } from '../../../shared/types';
import { groupedLanguages } from '../../../shared/languages';
import type { DictState } from '../../hooks/useDictLookup';
import type { TranslatorError } from '../../lib/errors';
import { errorMessageKey, providerLabel } from '../../lib/errors';
import type { SpeechController } from '../../hooks/useSpeech';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { IconAlert, IconBook, IconSearch, IconSwap } from '../layout/icons';
import { DictPanel } from '../word/DictPanel';
import { WordCard } from '../word/WordCard';

interface DictionarySearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  card: WordResponse | null;
  dict: DictState;
  error: TranslatorError | null;
  speech: SpeechController;
  onOpenLimit: () => void;
  /** Язык слова и язык перевода (этап 8Б). */
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  onSourceChange: (value: SourceLanguage) => void;
  onTargetChange: (value: LanguageCode) => void;
}

const SELECT_CLASS =
  'h-8 cursor-pointer appearance-none rounded-lg bg-transparent px-1.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:bg-soft hover:text-ink focus:bg-soft';

export function DictionarySearchPanel({
  query,
  onQueryChange,
  onSearch,
  loading,
  card,
  dict,
  error,
  speech,
  onOpenLimit,
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
}: DictionarySearchPanelProps) {
  const { t } = useTranslation();
  const groups = useMemo(() => groupedLanguages(), []);

  return (
    <section className="mt-4">
      <Card className="p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
          className="flex gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t('dictionary.searchPlaceholder')}
              aria-label={t('dictionary.searchPlaceholder')}
              maxLength={60}
              className="h-11 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="primary" loading={loading} disabled={!query.trim()}>
            {t('dictionary.search')}
          </Button>
        </form>

        {/* Компактный выбор языков, как на экране перевода: слово на любом языке. */}
        <div className="mt-2 flex items-center gap-1 border-t border-line pt-2">
          <label className="min-w-0">
            <span className="sr-only">{t('translate.sourceLanguage')}</span>
            <select
              value={sourceLang}
              onChange={(event) => onSourceChange(event.target.value as SourceLanguage)}
              className={SELECT_CLASS}
            >
              <option value="auto">{t('dictionary.detect')}</option>
              {(['pinned', 'other'] as const).map((group) => (
                <optgroup key={group} label={t(`languages.${group}`)}>
                  {groups[group].map((language) => (
                    <option key={language.code} value={language.code}>
                      {t(`languages.${language.code}`)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {/* Стрелка показывает направление: язык слова → язык перевода. */}
          <button
            type="button"
            aria-label={t('dictionary.swap')}
            title={t('dictionary.swap')}
            onClick={() => {
              // «Определить» менять не на что: тогда берём немецкий как самый частый.
              const from: LanguageCode = sourceLang === 'auto' ? 'de' : sourceLang;
              onSourceChange(targetLang);
              onTargetChange(from);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-accent"
          >
            <IconSwap className="h-4 w-4" />
          </button>
          <label className="min-w-0">
            <span className="sr-only">{t('translate.targetLanguage')}</span>
            <select
              value={targetLang}
              onChange={(event) => onTargetChange(event.target.value as LanguageCode)}
              className={SELECT_CLASS}
            >
              {(['pinned', 'other'] as const).map((group) => (
                <optgroup key={group} label={t(`languages.${group}`)}>
                  {groups[group].map((language) => (
                    <option key={language.code} value={language.code}>
                      {t(`languages.${language.code}`)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {error ? (
        <Card className="mt-3 p-4">
          <div className="flex items-start gap-2 text-danger">
            <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm leading-relaxed">{t(errorMessageKey(error.code))}</p>
              {error.code === 'LIMIT_REACHED' ? (
                <Button size="sm" variant="primary" className="mt-2" onClick={onOpenLimit}>
                  {t('limit.title')}
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {card ? (
        <Card className="mt-3 p-4 sm:p-5">
          <WordCard
            card={card.card}
            speech={speech}
            dictExamples={dict.data?.entry.examples.filter((example) => example.source === 'tatoeba') ?? []}
            dictLang={dict.data?.entry.sourceLang ?? null}
            translationLang={targetLang}
          />
          <p className="mt-4 border-t border-line pt-2 text-[11px] text-muted">
            {t('translate.provider', { provider: providerLabel(card.provider) })}
            {card.cached ? ` · ${t('translate.fromCache')}` : ''}
          </p>
        </Card>
      ) : null}

      {/* ИИ не ответил — карточка из настоящих словарей. */}
      {!card && (dict.loading || dict.data) ? <DictPanel dict={dict} speech={speech} /> : null}

      {!card && !error && !loading && !dict.data ? (
        <Card className="mt-3">
          <EmptyState
            icon={<IconBook className="h-6 w-6" />}
            title={t('dictionary.title')}
            text={t('dictionary.searchPlaceholder')}
          />
        </Card>
      ) : null}
    </section>
  );
}
