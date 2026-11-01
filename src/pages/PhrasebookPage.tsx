/**
 * Страница «Разговорник» (/phrasebook): фразы по 12 жизненным темам (Часть 17).
 * Темы: Приветствие, Behörde, Врач, Жильё, Покупки, Ресторан, Транспорт,
 * Экстренные случаи, Работа, Школа, Телефон, Банк.
 * Озвучка 🔊, копирование, добавление в учёбу (+ В карточки).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../shared/types';
import { getPhraseTopics, type PhraseItem } from '../../shared/phrasebook';
import { useSpeech } from '../hooks/useSpeech';
import { useStudy } from '../hooks/useStudy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconLearn,
  IconSearch,
  IconVolume,
  IconClose,
} from '../components/layout/icons';
import { cn } from '../lib/cn';

const ALL_TOPICS = getPhraseTopics();

function getPhraseText(phrase: PhraseItem, lang: LanguageCode): string {
  if (lang === 'de') return phrase.de;
  if (lang === 'en') return phrase.en;
  if (lang === 'uk') return phrase.uk;
  if (lang === 'ru') return phrase.ru;
  return phrase.de || phrase.en || phrase.ru;
}

export default function PhrasebookPage() {
  const { t } = useTranslation();
  const speech = useSpeech();
  const study = useStudy();

  const [search, setSearch] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [learningLang, setLearningLang] = useState<LanguageCode>('de');
  const [targetLang, setTargetLang] = useState<LanguageCode>('ru');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Выбранная тема или все темы
  const activeTopics = useMemo(() => {
    if (selectedTopicId === 'all') return ALL_TOPICS;
    return ALL_TOPICS.filter((t) => t.id === selectedTopicId);
  }, [selectedTopicId]);

  // Фильтрация по поисковому запросу
  const filteredPhrases = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list: Array<{ phrase: PhraseItem; topicTitleKey: string; icon: string }> = [];

    for (const topic of activeTopics) {
      for (const p of topic.phrases) {
        if (!q) {
          list.push({ phrase: p, topicTitleKey: topic.titleKey, icon: topic.icon });
          continue;
        }
        const matches =
          p.de.toLowerCase().includes(q) ||
          p.en.toLowerCase().includes(q) ||
          p.ru.toLowerCase().includes(q) ||
          p.uk.toLowerCase().includes(q);
        if (matches) {
          list.push({ phrase: p, topicTitleKey: topic.titleKey, icon: topic.icon });
        }
      }
    }
    return list;
  }, [activeTopics, search]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleAddToStudy = (phrase: PhraseItem) => {
    const text = getPhraseText(phrase, learningLang);
    const translation = getPhraseText(phrase, targetLang);

    study.addCard({
      lemma: text,
      lang: learningLang,
      deckId: 'phrasebook',
      article: null,
      plural: null,
      partOfSpeech: 'phrase',
      translations: [translation],
      example: null,
      perfekt: null,
    });
  };

  return (
    <>
      <PageHeader
        title={t('phrasebook.title')}
        subtitle={t('phrasebook.subtitle')}
        action={
          <Link to="/">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('nav.translate')}
            </Button>
          </Link>
        }
      />

      {/* Панель управления: выбор языков и строка поиска */}
      <Card className="mb-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">{t('phrasebook.learningLang')}:</span>
            <select
              value={learningLang}
              onChange={(e) => setLearningLang(e.target.value as LanguageCode)}
              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink outline-none"
            >
              <option value="de">🇩🇪 Deutsch</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">{t('phrasebook.translationLang')}:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink outline-none"
            >
              <option value="ru">🇷🇺 Русский</option>
              <option value="uk">🇺🇦 Українська</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        {/* Поиск */}
        <div className="relative mt-3">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('phrasebook.searchPlaceholder')}
            className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-9 text-sm text-ink placeholder:text-muted outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <IconClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Чипсы категорий с горизонтальной прокруткой */}
        <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedTopicId('all')}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              selectedTopicId === 'all'
                ? 'bg-accent text-white'
                : 'border border-line bg-soft text-muted hover:text-ink'
            )}
          >
            {t('phrasebook.allTopics')} ({ALL_TOPICS.reduce((acc, it) => acc + it.phrases.length, 0)})
          </button>
          {ALL_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopicId(topic.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                selectedTopicId === topic.id
                  ? 'bg-accent text-white'
                  : 'border border-line bg-soft text-muted hover:text-ink'
              )}
            >
              <span>{topic.icon}</span>
              <span>{t(topic.titleKey)}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Список фраз */}
      <div className="space-y-2.5">
        {filteredPhrases.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-sm text-muted">{t('phrasebook.notFound')}</p>
          </Card>
        ) : (
          filteredPhrases.map(({ phrase, topicTitleKey, icon }) => {
            const mainText = getPhraseText(phrase, learningLang);
            const subText = getPhraseText(phrase, targetLang);
            const inStudy = study.hasCard(mainText, learningLang);

            return (
              <Card key={phrase.id} className="p-3.5 sm:p-4 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{icon}</span>
                      <span className="text-[11px] font-medium text-muted">{t(topicTitleKey)}</span>
                      {phrase.context ? (
                        <span className="rounded bg-soft px-1.5 py-0.5 text-[10px] text-muted">
                          {phrase.context}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-base font-semibold leading-snug text-ink sm:text-lg">
                      {mainText}
                    </p>
                    <p className="mt-0.5 text-sm text-muted leading-relaxed">{subText}</p>
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={t('translate.speak')}
                      title={t('translate.speak')}
                      onClick={() => speech.speak(mainText, learningLang, phrase.id)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-ink',
                        speech.speakingId === phrase.id && 'text-accent'
                      )}
                    >
                      <IconVolume className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label={t('common.copy')}
                      title={t('common.copy')}
                      onClick={() => handleCopy(phrase.id, mainText)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-ink"
                    >
                      {copiedId === phrase.id ? (
                        <IconCheck className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <IconCopy className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={t('study.addToStudy')}
                      title={inStudy ? t('study.alreadyInStudy') : t('study.addToStudy')}
                      onClick={() => handleAddToStudy(phrase)}
                      className={cn(
                        'flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors',
                        inStudy
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'text-muted hover:bg-soft hover:text-ink'
                      )}
                    >
                      {inStudy ? (
                        <>
                          <IconCheck className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t('study.added')}</span>
                        </>
                      ) : (
                        <>
                          <IconLearn className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t('study.addToStudy')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
