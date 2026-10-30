/**
 * «Как переводят другие» — сворачиваемый блок под основным переводом.
 * Для текста до 300 символов загружается сам (если настройка включена),
 * для длинного — по кнопке «Показать». Сервис основного перевода не повторяется.
 */
import { useTranslation } from 'react-i18next';
import { AiVariant } from './AiVariant';
import type { CompareResponse, LanguageCode, ProviderId, SourceLanguage } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import { OTHERS_AUTO_MAX_CHARS } from '../../config';
import type { SpeechController } from '../../hooks/useSpeech';
import { providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CopyButton } from '../ui/CopyButton';
import { Spinner } from '../ui/Spinner';
import { SpeakButton } from '../ui/SpeakButton';
import { IconCheck, IconAlert } from '../layout/icons';

interface OthersPanelProps {
  /** Ответ сервисов; null — ещё не загружалось. */
  data: CompareResponse | null;
  loading: boolean;
  failed: boolean;
  /** Включена ли настройка «Показывать другие переводчики автоматически». */
  autoEnabled: boolean;
  /** Сервис основного перевода — в списке не повторяется. */
  exclude: ProviderId | null;
  targetLang: LanguageCode;
  speech: SpeechController;
  /** true — пользователь уже раскрыл блок у длинного текста. */
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onUseVariant: (provider: ProviderId, text: string) => void;
  /** Вариант, который сейчас используется как основной. */
  usedProvider: ProviderId | null;
  /** Исходный текст и язык — для варианта ИИ (грузится только по кнопке). */
  sourceText: string;
  sourceLang: SourceLanguage;
  /** Ответ основного перевода дал ИИ — тогда вариант ИИ не нужен. */
  mainIsAi: boolean;
  onLimitReached: () => void;
}

/** Загружать ли варианты самим: короткий текст и включённая настройка. */
export function shouldAutoLoad(textLength: number, autoEnabled: boolean): boolean {
  return autoEnabled && textLength > 0 && textLength <= OTHERS_AUTO_MAX_CHARS;
}

export function OthersPanel(props: OthersPanelProps) {
  const { t } = useTranslation();
  const { data, loading, failed, exclude, targetLang, speech, expanded } = props;
  const shortText = (data?.items ?? []).filter((item) => item.provider !== exclude);
  // Ответившие — карточками; не ответившие — одной короткой строкой внизу, без «шума».
  const answered = shortText.filter((item) => item.text);
  const silent = shortText.filter((item) => !item.text);
  const hasItems = answered.length > 0;

  // Свернуто: показываем строку-заголовок с кнопкой «Показать».
  if (!expanded) {
    return (
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t('others.title')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('others.autoHint')}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={props.onExpand}>
            {t(props.data ? 'others.hide' : 'others.show')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t('others.title')}</p>
        <Button size="sm" variant="ghost" onClick={props.onCollapse}>
          {t('others.hide')}
        </Button>
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Spinner />
          <span>{t('others.loading')}</span>
        </div>
      ) : null}

      {failed && !loading ? (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-danger">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('others.error')}</span>
        </p>
      ) : null}

      {!loading && !failed && !hasItems ? (
        <p className="mt-2 text-sm text-muted">{t('others.empty')}</p>
      ) : null}

      <ul className="mt-2 space-y-2">
        {answered.map((item, index) => (
          <li key={item.provider} className="rounded-xl border border-line px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <IconCheck className="h-3.5 w-3.5 text-success" />
              {providerLabel(item.provider)}
            </p>
            <p dir={textDirection(targetLang)} className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {item.text}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={props.usedProvider === item.provider ? 'secondary' : 'primary'}
                icon={props.usedProvider === item.provider ? <IconCheck className="h-3.5 w-3.5" /> : undefined}
                onClick={() => props.onUseVariant(item.provider, item.text ?? '')}
              >
                {props.usedProvider === item.provider ? t('others.used') : t('others.use')}
              </Button>
              <CopyButton text={item.text ?? ''} label={t('common.copy')} />
              <SpeakButton
                text={item.text ?? ''}
                language={targetLang}
                id={`others-${index}`}
                speech={speech}
                label={t('common.listen')}
              />
            </div>
          </li>
        ))}
      </ul>

      {props.mainIsAi ? null : (
        <AiVariant
          text={props.sourceText}
          sourceLang={props.sourceLang}
          targetLang={targetLang}
          speech={speech}
          used={props.usedProvider === 'gemini' || props.usedProvider === 'groq' || props.usedProvider === 'workersai'}
          onUse={props.onUseVariant}
          onLimitReached={props.onLimitReached}
        />
      )}

      {!loading && silent.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
          {t('others.silent', { list: silent.map((item) => providerLabel(item.provider)).join(', ') })}
        </p>
      ) : null}
    </Card>
  );
}
