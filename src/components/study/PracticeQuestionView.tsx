/**
 * Один вопрос упражнения (этап 6, часть 16).
 * Виды: перевод, написание («напиши слово»), аудирование, артикль (de),
 * сборка предложения и сопоставление пар.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { checkListening, shuffle } from '../../lib/practice';
import type { PracticeQuestion } from '../../lib/practice';
import { hashCode } from '../../../shared/study';
import type { SpeechController } from '../../hooks/useSpeech';
import { Button } from '../ui/Button';
import { SpeakButton } from '../ui/SpeakButton';
import { ArticleQuestion, ChoiceQuestion } from './PracticeOptions';

interface TypedQuestionProps<T extends PracticeQuestion> {
  question: T;
  onAnswer: (correct: boolean) => void;
}

/** Напиши слово: даётся перевод и подсказка первой буквы, проверка умлаутов ae/oe/ue. */
function WriteQuestion({
  question,
  onAnswer,
}: TypedQuestionProps<Extract<PracticeQuestion, { type: 'write' }>>) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<'exact' | 'umlaut' | null>(null);
  const [wrong, setWrong] = useState(false);

  const check = () => {
    if (result || wrong) return;
    const answer = checkListening(value, question.answer);
    if (answer) {
      setResult(answer);
      onAnswer(true);
    } else {
      setWrong(true);
      onAnswer(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xl font-bold text-ink">{question.prompt}</p>
        <p className="mt-1 text-xs text-muted">
          {t('study.practiceFirstLetterHint', { letter: question.hint })}
        </p>
      </div>

      <input
        type="text"
        value={value}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        lang={question.card.lang || 'de'}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') check();
        }}
        placeholder={`${question.hint}...`}
        aria-label={t('study.practiceTypeWord')}
        className="h-12 w-full rounded-xl border border-line bg-card px-3 text-center text-lg outline-none focus:border-accent"
      />

      {result === 'umlaut' ? (
        <p className="text-center text-sm text-warning">{t('study.practiceUmlaut', { word: question.answer })}</p>
      ) : null}
      {wrong ? (
        <p className="text-center text-sm text-danger">{t('study.practiceRight', { word: question.answer })}</p>
      ) : null}
      {!result && !wrong ? (
        <Button variant="primary" className="w-full" disabled={!value.trim()} onClick={check}>
          {t('study.practiceCheck')}
        </Button>
      ) : null}
    </div>
  );
}

/** Аудирование: слово звучит, нужно написать его; умлауты можно писать ae/oe/ue/ss. */
function ListeningQuestion({
  question,
  speech,
  onAnswer,
}: TypedQuestionProps<Extract<PracticeQuestion, { type: 'listening' }>> & { speech: SpeechController }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<'exact' | 'umlaut' | null>(null);
  const [wrong, setWrong] = useState(false);

  const check = () => {
    if (result || wrong) return;
    const answer = checkListening(value, question.answer);
    if (answer) {
      setResult(answer);
      onAnswer(true);
    } else {
      setWrong(true);
      onAnswer(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <SpeakButton
          text={question.answer}
          language={question.card.lang || 'de'}
          id="practice-listening"
          speech={speech}
        />
        <span className="text-sm text-muted">{t('study.practiceListenHint')}</span>
      </div>
      <input
        type="text"
        value={value}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        lang={question.card.lang || 'de'}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') check();
        }}
        placeholder={t('study.practiceTypeWord')}
        aria-label={t('study.practiceTypeWord')}
        className="h-12 w-full rounded-xl border border-line bg-card px-3 text-center text-lg outline-none focus:border-accent"
      />
      {result === 'umlaut' ? (
        <p className="text-center text-sm text-warning">{t('study.practiceUmlaut', { word: question.answer })}</p>
      ) : null}
      {wrong ? (
        <p className="text-center text-sm text-danger">{t('study.practiceRight', { word: question.answer })}</p>
      ) : null}
      {!result && !wrong ? (
        <Button variant="primary" className="w-full" disabled={!value.trim()} onClick={check}>
          {t('study.practiceCheck')}
        </Button>
      ) : null}
    </div>
  );
}

/** Сопоставление 5 пар: слово и перевод. */
function PairsQuestion({
  question,
  onAnswer,
}: TypedQuestionProps<Extract<PracticeQuestion, { type: 'pairs' }>>) {
  const { t } = useTranslation();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTr, setSelectedTr] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mismatch, setMismatch] = useState<boolean>(false);

  // Перемешиваем слова и переводы отдельно
  const words = useMemo(
    () => shuffle(question.pairs.map((p) => ({ id: p.id, text: p.word })), hashCode(`${question.card.id}:w`)),
    [question.pairs, question.card.id],
  );
  const translations = useMemo(
    () => shuffle(question.pairs.map((p) => ({ id: p.id, text: p.translation })), hashCode(`${question.card.id}:tr`)),
    [question.pairs, question.card.id],
  );

  const handleWordClick = (id: string) => {
    if (matchedIds.has(id) || mismatch) return;
    if (selectedTr) {
      if (selectedTr === id) {
        const next = new Set(matchedIds);
        next.add(id);
        setMatchedIds(next);
        setSelectedWord(null);
        setSelectedTr(null);
        if (next.size === question.pairs.length) {
          onAnswer(true);
        }
      } else {
        setMismatch(true);
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedTr(null);
          setMismatch(false);
        }, 700);
      }
    } else {
      setSelectedWord(id === selectedWord ? null : id);
    }
  };

  const handleTrClick = (id: string) => {
    if (matchedIds.has(id) || mismatch) return;
    if (selectedWord) {
      if (selectedWord === id) {
        const next = new Set(matchedIds);
        next.add(id);
        setMatchedIds(next);
        setSelectedWord(null);
        setSelectedTr(null);
        if (next.size === question.pairs.length) {
          onAnswer(true);
        }
      } else {
        setMismatch(true);
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedTr(null);
          setMismatch(false);
        }, 700);
      }
    } else {
      setSelectedTr(id === selectedTr ? null : id);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted">{t('study.practicePairsHint')}</p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-2">
          {words.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedWord === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleWordClick(item.id)}
                className={cn(
                  'w-full min-h-[44px] rounded-xl border p-2 text-center text-sm font-medium transition-all',
                  isMatched && 'border-line bg-soft text-muted line-through opacity-50',
                  isSelected && !mismatch && 'border-accent bg-accentSoft text-accent font-semibold',
                  isSelected && mismatch && 'border-danger bg-soft text-danger',
                  !isMatched && !isSelected && 'border-line bg-card text-ink hover:border-accent',
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {translations.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedTr === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleTrClick(item.id)}
                className={cn(
                  'w-full min-h-[44px] rounded-xl border p-2 text-center text-sm font-medium transition-all',
                  isMatched && 'border-line bg-soft text-muted line-through opacity-50',
                  isSelected && !mismatch && 'border-accent bg-accentSoft text-accent font-semibold',
                  isSelected && mismatch && 'border-danger bg-soft text-danger',
                  !isMatched && !isSelected && 'border-line bg-card text-ink hover:border-accent',
                )}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Сборка предложения: слова перемешаны, нужно нажимать по порядку. */
function SentenceQuestion({ question, onAnswer }: TypedQuestionProps<Extract<PracticeQuestion, { type: 'sentence' }>>) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const tokens = useMemo(() => question.tokens.map((text, index) => ({ text, index })), [question.tokens]);
  const remaining = tokens.filter((token) => !picked.includes(token.index));

  const check = () => {
    const correct = picked.every((index, position) => question.answer[position] === question.tokens[index]);
    setChecked(correct);
    onAnswer(correct);
  };

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-muted">{t('study.practiceSentenceHint')}</p>
      <div className="flex min-h-[56px] flex-wrap content-start items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-soft p-2">
        {picked.length === 0 ? <span className="text-xs text-muted">{t('study.practiceSentenceEmpty')}</span> : null}
        {picked.map((index, position) => (
          <button
            key={`${index}-${position}`}
            type="button"
            disabled={checked !== null}
            onClick={() => setPicked((previous) => previous.filter((item) => item !== index))}
            className="rounded-lg border border-line bg-card px-2 py-1 text-sm hover:bg-soft"
          >
            {question.tokens[index]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {remaining.map((token) => (
          <button
            key={token.index}
            type="button"
            disabled={checked !== null}
            onClick={() => setPicked((previous) => [...previous, token.index])}
            className="rounded-lg border border-line bg-card px-2 py-1 text-sm hover:border-accent"
          >
            {token.text}
          </button>
        ))}
      </div>
      {checked !== null ? (
        <p className={cn('text-center text-sm', checked ? 'text-success' : 'text-danger')}>
          {checked ? t('study.practiceCorrect') : t('study.practiceRight', { word: question.answer.join(' ') })}
        </p>
      ) : (
        <Button variant="primary" className="w-full" disabled={picked.length !== tokens.length} onClick={check}>
          {t('study.practiceCheck')}
        </Button>
      )}
    </div>
  );
}

/** Переключает вид вопроса: разметка выше, здесь только выбор. */
export function PracticeQuestionView({
  question,
  speech,
  onAnswer,
}: {
  question: PracticeQuestion;
  speech: SpeechController;
  onAnswer: (correct: boolean) => void;
}) {
  switch (question.type) {
    case 'article':
      return <ArticleQuestion question={question} onAnswer={onAnswer} />;
    case 'plural':
    case 'translation':
      return <ChoiceQuestion question={question} onAnswer={onAnswer} />;
    case 'write':
      return <WriteQuestion question={question} onAnswer={onAnswer} />;
    case 'listening':
      return <ListeningQuestion question={question} speech={speech} onAnswer={onAnswer} />;
    case 'sentence':
      return <SentenceQuestion question={question} onAnswer={onAnswer} />;
    case 'pairs':
      return <PairsQuestion question={question} onAnswer={onAnswer} />;
  }
}
