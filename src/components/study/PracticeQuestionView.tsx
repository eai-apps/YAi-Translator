/**
 * Один вопрос упражнения (этап 6). Здесь аудирование и сборка предложения;
 * выбор вариантов (артикль, множественное число, перевод) — в PracticeOptions.tsx.
 * Компонент только показывает вопрос и сообщает «правильно / неправильно».
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { checkListening } from '../../lib/practice';
import type { PracticeQuestion } from '../../lib/practice';
import type { SpeechController } from '../../hooks/useSpeech';
import { Button } from '../ui/Button';
import { SpeakButton } from '../ui/SpeakButton';
import { ArticleQuestion, ChoiceQuestion } from './PracticeOptions';

interface TypedQuestionProps<T extends PracticeQuestion> {
  question: T;
  onAnswer: (correct: boolean) => void;
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
        <SpeakButton text={question.answer} language="de" id="practice-listening" speech={speech} />
        <span className="text-sm text-muted">{t('study.practiceListenHint')}</span>
      </div>
      <input
        type="text"
        value={value}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        lang="de"
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
    case 'listening':
      return <ListeningQuestion question={question} speech={speech} onAnswer={onAnswer} />;
    case 'sentence':
      return <SentenceQuestion question={question} onAnswer={onAnswer} />;
  }
}
