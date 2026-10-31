/**
 * «Спросить у AI» (/ask): учитель грамматики в чате (версия 0.6.0).
 * Вопрос → ответ на языке интерфейса с примерами и ссылками на справочник.
 * Одинаковый вопрос повторно ИИ не спрашивается: ответ кэшируется на 90 дней.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ASK_EXAMPLE_QUESTIONS, ASK_MAX_QUESTION_LENGTH } from '../config';
import { useAsk } from '../hooks/useAsk';
import { useSettings } from '../hooks/useSettings';
import { AskModelSelect, useAskModelPreference } from '../components/ask/AskModelSelect';
import { AskAnswer } from '../components/ask/AskAnswer';
import { AskHistory } from '../components/ask/AskHistory';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { IconArrowLeft, IconSparkles } from '../components/layout/icons';

export default function AskPage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const ask = useAsk(uiLanguage);
  const [params, setParams] = useSearchParams();
  const [question, setQuestion] = useState('');
  const [limitOpen, setLimitOpen] = useState(false);
  const [askModel, setAskModel] = useAskModelPreference();

  const send = (value: string, modelOverride?: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || ask.loading) return;
    setQuestion(trimmed);
    const chosenModel = modelOverride ?? askModel;
    void ask.submit(trimmed, chosenModel === 'free' ? undefined : chosenModel);
  };

  // Вопрос из адреса (?q=…): пришёл со страницы темы или из окна «Спросить у AI».
  const incoming = params.get('q');
  useEffect(() => {
    if (!incoming) return;
    setQuestion(incoming);
    void ask.submit(incoming, askModel === 'free' ? undefined : askModel);
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next, { replace: true });
    // Отправляем только на пришедший вопрос: повторный поиск по адресу не нужен.
  }, [incoming]);

  const errorText =
    ask.error?.code === 'LIMIT_REACHED'
      ? t('errors.limit')
      : ask.error
        ? t('ask.error')
        : null;

  return (
    <>
      <PageHeader
        title={t('ask.title')}
        subtitle={t('ask.subtitle')}
        action={
          <Link to="/grammar">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('grammar.title')}
            </Button>
          </Link>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <AskModelSelect value={askModel} onChange={setAskModel} />
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(question);
          }}
          className="space-y-2"
        >
          <label className="block">
            <span className="text-xs font-medium text-muted">{t('ask.questionLabel')}</span>
            <textarea
              value={question}
              rows={3}
              maxLength={ASK_MAX_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                // Enter отправляет, Shift+Enter — перенос строки.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(question);
                }
              }}
              placeholder={t('ask.placeholder')}
              className="mt-1 w-full resize-none rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted">
              {question.length} / {ASK_MAX_QUESTION_LENGTH}
            </span>
            <Button
              type="submit"
              variant="primary"
              loading={ask.loading}
              disabled={question.trim().length < 3}
              icon={<IconSparkles className="h-4 w-4" />}
            >
              {t('ask.send')}
            </Button>
          </div>
        </form>

        {/* Подсказки-примеры: показываются, пока ответа нет. */}
        {!ask.answer && !ask.loading ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted">{t('ask.examplesTitle')}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ASK_EXAMPLE_QUESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => send(t(key))}
                  className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {ask.loading ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-soft px-3 py-3 text-sm text-muted">
            <Spinner />
            <span>{t('ask.thinking')}</span>
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 flex flex-col items-start gap-2 rounded-xl bg-soft px-3 py-3">
            <p className="text-sm text-danger">{errorText}</p>
            {ask.error?.code === 'LIMIT_REACHED' ? (
              <Button size="sm" variant="primary" onClick={() => setLimitOpen(true)}>
                {t('limit.title')}
              </Button>
            ) : (
              <Button size="sm" onClick={() => ask.shownQuestion && send(ask.shownQuestion)}>
                {t('common.retry')}
              </Button>
            )}
          </div>
        ) : null}

        {ask.answer && !ask.loading ? (
          <AskAnswer answer={ask.answer} question={ask.shownQuestion ?? question} />
        ) : null}
      </Card>

      <AskHistory
        items={ask.history.items}
        activeQuestion={ask.shownQuestion}
        onSelect={(item) => {
          setQuestion(item.question);
          ask.show(item);
        }}
        onRemove={ask.history.remove}
        onClear={ask.history.clear}
      />

      <p className="mt-3 text-xs leading-relaxed text-muted">{t('ask.hint')}</p>

      {/* Окно подключения своего ключа открывается только при исчерпании лимита. */}
      {limitOpen ? <AskLimitHint onClose={() => setLimitOpen(false)} /> : null}
    </>
  );
}

/** Подсказка о лимите: ссылка в профиль, где можно подключить свой бесплатный ключ. */
function AskLimitHint({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Card className="mt-3 flex flex-wrap items-center justify-between gap-2 p-4">
      <p className="text-sm text-muted">{t('ask.limitHint')}</p>
      <div className="flex gap-2">
        <Link to="/profile">
          <Button size="sm" variant="primary">
            {t('nav.profile')}
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Card>
  );
}
