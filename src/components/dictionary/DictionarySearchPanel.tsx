/**
 * Вкладка «Слово» в словаре (этап 13):
 * 1. Поле поиска «Найти слово (немецкий или русский)», поиск мгновенный без кнопки.
 * 2. Пока ничего не введено — «Слово дня», «Вы недавно смотрели», алфавит и темы базы.
 * 3. Результат — та же карточка слова, что и в переводе.
 * 4. В каждой строке результата — «+ В учёбу».
 */
import { guessLanguage } from '../../../shared/detect';
import { useExamples } from '../../hooks/useExamples';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage, UiLanguage, WordResponse } from '../../../shared/types';
import { STUDY_DECKS } from '../../../shared/decks';
import type { DictState } from '../../hooks/useDictLookup';
import type { TranslatorError } from '../../lib/errors';
import { errorMessageKey, providerLabel } from '../../lib/errors';
import type { SpeechController } from '../../hooks/useSpeech';
import { ARTICLE_COLORS } from '../../config';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconAlert, IconBook, IconClock, IconSearch } from '../layout/icons';
import { LanguageBar } from '../translate/LanguageBar';
import { DictCard } from '../word/DictCard';
import { WordCard } from '../word/WordCard';
import { assembleClientCard } from '../../lib/offlineCards';
import { useLexicon } from '../../hooks/useLexicon';
import { useHistory } from '../../hooks/useHistory';
import { PickContext } from '../word/pick';
import { WordOfDayCard } from '../study/WordOfDayCard';
import { AddToStudyQuickButton } from '../study/AddToStudyQuickButton';
import {
  COMMON_DE_RU,
  getGermanTranslation,
  searchGermanByRussian,
} from '../../data/commonTranslationsDeRu';

interface DictionarySearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onAskAi: () => void;
  loading: boolean;
  card: WordResponse | null;
  dict: DictState;
  error: TranslatorError | null;
  speech: SpeechController;
  onOpenLimit: () => void;
  uiLang: UiLanguage;
  onPickWord?: (word: string) => void;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  onSourceChange: (value: SourceLanguage) => void;
  onTargetChange: (value: LanguageCode) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function DictionarySearchPanel({
  query,
  onQueryChange,
  onSearch,
  onAskAi,
  sourceLang,
  onSourceChange,
  onTargetChange,
  loading,
  card,
  dict,
  error,
  speech,
  onOpenLimit,
  onPickWord,
  targetLang,
}: DictionarySearchPanelProps) {
  const { t } = useTranslation();
  const { items: historyItems } = useHistory();

  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const cleanQuery = query.trim();
  const isCyrillic = /[а-яёА-ЯЁ]/i.test(cleanQuery);

  // 1. Мгновенный поиск по базе lex (для немецкого ввода)
  const lookupLang = sourceLang === 'auto' ? guessLanguage(cleanQuery) ?? 'de' : sourceLang;
  const { match: lexMatch } = useLexicon(cleanQuery, lookupLang, !card);
  const { examples: localExamples } = useExamples(lexMatch?.lemma ?? cleanQuery, lookupLang);

  // 2. Обратный поиск немецких слов по русскому запросу
  const russianMatches = useMemo(() => {
    if (!isCyrillic || cleanQuery.length < 2) return [];
    return searchGermanByRussian(cleanQuery, 10);
  }, [cleanQuery, isCyrillic]);

  const searchRef = useRef(onSearch);
  searchRef.current = onSearch;
  // 3. Автоматический запуск подробного поиска (debounce 400ms)
  useEffect(() => {
    if (!cleanQuery || cleanQuery.length < 2) return;
    const timer = setTimeout(() => {
      searchRef.current();
    }, 400);
    return () => clearTimeout(timer);
  }, [cleanQuery, sourceLang, targetLang]);

  // Недавно просмотренные слова (из истории)
  const recentWords = useMemo(() => {
    const list = historyItems.slice(0, 5);
    return list.map((item) => ({
      text: item.text,
      translation: item.translation,
      from: item.sourceLang,
      to: item.targetLang,
    }));
  }, [historyItems]);

  // Слова по выбранной букве алфавита
  const letterWords = useMemo(() => {
    if (!selectedLetter) return [];
    const results: Array<{ lemma: string; translation: string }> = [];
    for (const [lemma, tr] of Object.entries(COMMON_DE_RU)) {
      if (lemma.toUpperCase().startsWith(selectedLetter)) {
        results.push({ lemma, translation: tr });
        if (results.length >= 20) break;
      }
    }
    return results;
  }, [selectedLetter]);

  // Слова по выбранной теме
  const topicWords = useMemo(() => {
    if (!selectedTopicId) return [];
    const deck = STUDY_DECKS.find((d) => d.id === selectedTopicId);
    if (!deck) return [];
    return deck.words.map((w) => ({
      lemma: w.lemma,
      article: w.article,
      translation: w.translations?.ru || getGermanTranslation(w.lemma) || '',
    }));
  }, [selectedTopicId]);

  const handlePick = (word: string) => {
    onQueryChange(word);
    onPickWord?.(word);
  };

  return (
    <PickContext.Provider value={onPickWord ?? null}>
      <section className="mt-4 space-y-4">
        <LanguageBar sourceLang={sourceLang} targetLang={targetLang} onSourceChange={onSourceChange} onTargetChange={onTargetChange} onSwap={() => { onSourceChange(targetLang); onTargetChange(sourceLang === 'auto' ? 'ru' : sourceLang); }} />
        {/* Поле поиска: мгновенный поиск без обязательного нажатия кнопки */}
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
                onChange={(event) => {
                  onQueryChange(event.target.value);
                  setSelectedLetter(null);
                  setSelectedTopicId(null);
                }}
                placeholder={t('dictionary.searchPlaceholderUnified', {
                  defaultValue: 'Найти слово (немецкий или русский)',
                })}
                aria-label={t('dictionary.searchPlaceholderUnified', {
                  defaultValue: 'Найти слово (немецкий или русский)',
                })}
                maxLength={60}
                className="h-11 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
            {query.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onQueryChange('');
                  setSelectedLetter(null);
                  setSelectedTopicId(null);
                }}
                aria-label={t('common.clear')}
              >
                ✕
              </Button>
            ) : null}
          </form>
        </Card>

        {cleanQuery ? <Button loading={loading} onClick={onAskAi}>{t('word.askAiCard')}</Button> : null}
        {!card && !lexMatch && dict.data?.entry ? <Card className="p-4"><DictCard entry={dict.data.entry} speech={speech} withAi={false} /></Card> : null}
        {/* Результаты поиска по русскому запросу (список найденных немецких слов с «+ В учёбу») */}
        {isCyrillic && russianMatches.length > 0 && !card ? (
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              {t('dictionary.tabSearch')} ({russianMatches.length})
            </h3>
            <div className="divide-y divide-line">
              {russianMatches.map((item) => (
                <div
                  key={item.lemma}
                  className="flex items-center justify-between py-2.5 transition-colors hover:bg-soft rounded-lg px-2 cursor-pointer"
                  onClick={() => handlePick(item.lemma)}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-ink">{item.lemma}</span>
                    <span className="text-xs text-muted">· {item.translation}</span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddToStudyQuickButton
                      lemma={item.lemma}
                      translations={[item.translation]}
                      variant="compact"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Ошибка */}
        {error ? (
          <Card className="p-4">
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

        {/* 3. Результат: единая карточка слова (та же, что на экране перевода) */}
        {card || lexMatch ? (
          <Card className="p-4 sm:p-5">
            <WordCard
              card={
                card?.card ||
                assembleClientCard(
                  lexMatch!.lemma,
                  (lexMatch!.lang || targetLang) as LanguageCode,
                  targetLang === lookupLang ? 'ru' : targetLang,
                  lexMatch!.entry,
                  localExamples,
                  dict.data?.entry.senses.map((s) => s.translation).filter((s): s is string => Boolean(s)) ?? [],
                )
              }
              speech={speech}
              dictExamples={dict.data?.entry.examples.filter((example) => example.source === 'tatoeba') ?? []}
              dictLang={dict.data?.entry.sourceLang ?? null}
              translationLang={targetLang}
            />
            <p className="mt-4 border-t border-line pt-2 text-[11px] text-muted">
              {card ? (
                <>
                  {t('translate.provider', { provider: providerLabel(card.provider) })}
                  {card.cached ? ` · ${t('translate.fromCache')}` : ''}
                </>
              ) : (
                t('word.assembledFromDicts')
              )}
            </p>
          </Card>
        ) : null}

        {/* 2. Пока ничего не введено — «Слово дня», «Вы недавно смотрели», алфавит и темы базы */}
        {!cleanQuery ? (
          <div className="space-y-4">
            {/* Слово дня */}
            <WordOfDayCard />

            {/* Вы недавно смотрели */}
            {recentWords.length > 0 ? (
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <IconClock className="h-4 w-4" />
                  <span>{t('dictionary.recentLookups', { defaultValue: 'Вы недавно смотрели' })}</span>
                </div>
                <div className="divide-y divide-line">
                  {recentWords.map((item, idx) => (
                    <div
                      key={`recent-${idx}-${item.text}`}
                      className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-soft px-1 rounded-lg"
                      onClick={() => handlePick(item.text)}
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-semibold text-ink truncate">{item.text}</span>
                        {item.translation ? (
                          <span className="text-xs text-muted truncate">→ {item.translation}</span>
                        ) : null}
                      </div>
                      {!/\s/.test(item.text.trim()) && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <AddToStudyQuickButton
                          lemma={item.text}
                          translations={item.translation ? [item.translation] : undefined}
                          variant="compact"
                        />
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* Алфавит и темы базы */}
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <IconBook className="h-4 w-4" />
                <span>{t('dictionary.alphabetAndTopics', { defaultValue: 'Алфавит и темы' })}</span>
              </div>

              {/* Буквы алфавита */}
              <div className="flex flex-wrap gap-1 mb-4">
                {ALPHABET.map((letter) => {
                  const active = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => {
                        setSelectedLetter(active ? null : letter);
                        setSelectedTopicId(null);
                      }}
                      className={cn(
                        'h-7 w-7 rounded-lg text-xs font-semibold transition-colors',
                        active
                          ? 'bg-accent text-accentInk'
                          : 'bg-soft text-ink hover:bg-line',
                      )}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Темы из базы */}
              <div className="flex flex-wrap gap-1.5">
                {STUDY_DECKS.map((deck) => {
                  const active = selectedTopicId === deck.id;
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(active ? null : deck.id);
                        setSelectedLetter(null);
                      }}
                      className={cn(
                        'rounded-xl px-2.5 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'bg-accent text-accentInk'
                          : 'bg-soft text-ink hover:bg-line',
                      )}
                    >
                      {t(deck.titleKey)}
                    </button>
                  );
                })}
              </div>

              {/* Результаты просмотра буквы */}
              {selectedLetter && letterWords.length > 0 ? (
                <div className="mt-4 border-t border-line pt-3">
                  <h4 className="mb-2 text-xs font-semibold text-muted">
                    {t('dictionary.browseByLetter', {
                      letter: selectedLetter,
                      defaultValue: `Слова на букву ${selectedLetter}`,
                    })}
                  </h4>
                  <div className="divide-y divide-line max-h-64 overflow-y-auto">
                    {letterWords.map((item) => (
                      <div
                        key={item.lemma}
                        className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-soft px-1 rounded-lg"
                        onClick={() => handlePick(item.lemma)}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-ink">{item.lemma}</span>
                          <span className="text-xs text-muted">· {item.translation}</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <AddToStudyQuickButton
                            lemma={item.lemma}
                            translations={[item.translation]}
                            variant="compact"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Результаты просмотра темы */}
              {selectedTopicId && topicWords.length > 0 ? (
                <div className="mt-4 border-t border-line pt-3">
                  <h4 className="mb-2 text-xs font-semibold text-muted">
                    {topicWords.length} слов
                  </h4>
                  <div className="divide-y divide-line max-h-64 overflow-y-auto">
                    {topicWords.map((item) => (
                      <div
                        key={item.lemma}
                        className="flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-soft px-1 rounded-lg"
                        onClick={() => handlePick(item.lemma)}
                      >
                        <div className="flex items-baseline gap-2">
                          {item.article ? (
                            <span
                              className={cn(
                                'text-xs font-bold uppercase tracking-wide',
                                ARTICLE_COLORS[item.article],
                              )}
                            >
                              {item.article}
                            </span>
                          ) : null}
                          <span className="font-semibold text-ink">{item.lemma}</span>
                          {item.translation ? (
                            <span className="text-xs text-muted">· {item.translation}</span>
                          ) : null}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <AddToStudyQuickButton
                            lemma={item.lemma}
                            article={item.article}
                            translations={item.translation ? [item.translation] : undefined}
                            variant="compact"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        ) : null}
      </section>
    </PickContext.Provider>
  );
}
