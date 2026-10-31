/**
 * Карточка перевода (этап 8, «как в Яндексе»): строка «Определён · переводчик», разделитель,
 * крупный перевод, ниже действия 🔊 / копировать / «В карточки» / ⭐ / «⋯»
 * (Разобрать, Проверить мой немецкий, Поделиться). Под карточкой — «Как переводят другие».
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage, StudyCardInput, TranslateResponse } from '../../../shared/types';
import { getLanguage, textDirection } from '../../../shared/languages';
import type { TranslatorError } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { errorMessageKey, providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { CopyButton } from '../ui/CopyButton';
import { IconButton } from '../ui/IconButton';
import { Spinner } from '../ui/Spinner';
import { SpeakButton } from '../ui/SpeakButton';
import { IconAlert, IconStar, IconTranslate } from '../layout/icons';
import { AddToStudyMenu } from '../study/AddToStudyMenu';
import { AlternativesList } from './AlternativesList';
import { CardMenu } from './CardMenu';

interface ResultPanelProps {
  result: TranslateResponse | null;
  loading: boolean;
  error: TranslatorError | null;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  detectedLang: LanguageCode | null;
  isFavorite: boolean;
  /** «⭐» работает только когда перевод сохранён в историю. */
  canFavorite: boolean;
  canUseTools: boolean;
  speech: SpeechController;
  onRetry: () => void;
  onOpenLimit: () => void;
  onExplain: () => void;
  onCheck: () => void;
  onToggleFavorite: () => void;
  /** Снимок слова для карточек, если перевод — 1–3 слова (этап 6). */
  studyInput?: StudyCardInput | null;
  /** Блок «Как переводят другие» (или null, если он выключен в настройках). */
  others?: ReactNode;
  /** «Ещё варианты» для 1–3 слов — переводы из карточки слова (брать, приносить, позвать…). */
  moreVariants?: string[];
  /** Нажатие на вариант — перевести его обратно. */
  onPickVariant?: (value: string) => void;
  /** Исходный текст — для «Поделиться». */
  sourceText: string;
}

/** Есть ли системное окно «Поделиться» (на телефоне) — иначе копируем текст. */
function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function ResultPanel(props: ResultPanelProps) {
  const { result, loading, error, sourceLang, targetLang, detectedLang, speech } = props;
  const { t } = useTranslation();

  const targetName = getLanguage(targetLang)?.nativeName ?? targetLang;
  const copyValue = result?.translatedText ?? '';
  const targetDir = textDirection(targetLang);

  /** «Поделиться»: текст перевода + исходник; без navigator.share — копирование. */
  const share = async () => {
    if (!result) return;
    const text = props.sourceText.trim() ? `${props.sourceText}\n→ ${result.translatedText}` : result.translatedText;
    try {
      if (canShare()) {
        await navigator.share({ title: t('common.appName'), text });
        return;
      }
      await navigator.clipboard.writeText(result.translatedText);
    } catch {
      // Пользователь закрыл окно или браузер запретил — ничего не показываем.
    }
  };


  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Card className="flex min-h-[220px] flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">
            {detectedLang && sourceLang === 'auto'
              ? t('translate.autoDetected', { language: getLanguage(detectedLang)?.nativeName ?? detectedLang })
              : targetName}
          </span>
          <div className="flex items-center gap-2">
            {loading ? <Spinner className="text-muted" /> : null}
            {result ? <Badge tone="accent">{result.label ?? providerLabel(result.provider, result.model)}</Badge> : null}
          </div>
        </div>

        <div className="my-3 border-t border-line" />

        <div className="flex-1" aria-live="polite">
          {error ? (
            <div className="flex flex-col items-start justify-center gap-3 py-6">
              <div className="flex items-start gap-2 text-danger">
                <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-relaxed">{t(errorMessageKey(error.code))}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {error.code !== 'VALIDATION' ? (
                  <Button size="sm" onClick={props.onRetry}>
                    {t('common.retry')}
                  </Button>
                ) : null}
                {error.code === 'LIMIT_REACHED' ? (
                  <Button size="sm" variant="primary" onClick={props.onOpenLimit}>
                    {t('limit.title')}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : !result ? (
            loading ? (
              <div className="flex h-full items-center justify-center gap-2 py-10 text-sm text-muted">
                <Spinner />
                <span>{t('translate.loadingTitle')}</span>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">
                  <IconTranslate className="h-6 w-6" />
                </div>
                <p className="font-medium">{t('translate.emptyTitle')}</p>
                <p className="max-w-xs text-sm leading-relaxed text-muted">{t('translate.emptyText')}</p>
              </div>
            )
          ) : (
            <>
              <p
                dir={targetDir}
                className={`whitespace-pre-wrap break-words text-xl leading-relaxed sm:text-2xl ${
                  targetDir === 'rtl' ? 'text-right' : ''
                }`}
              >
                {result.translatedText}
              </p>
              <AlternativesList alternatives={result.alternatives} targetLang={targetLang} speech={speech} />
              {props.moreVariants && props.moreVariants.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5" dir={targetDir}>
                  <span className="text-xs text-muted">{t('translate.moreVariants')}</span>
                  {props.moreVariants.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => props.onPickVariant?.(variant)}
                      className="rounded-full bg-accentSoft px-2.5 py-0.5 text-sm text-accent transition hover:ring-2 hover:ring-accent/40"
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        {result ? (
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <SpeakButton
                text={copyValue}
                language={targetLang}
                id="result"
                speech={speech}
                label={t('translate.speakResult')}
              />
              <CopyButton text={copyValue} label={t('translate.copyResult')} />
              <AddToStudyMenu input={props.studyInput ?? null} iconOnly />
              <IconButton
                label={props.isFavorite ? t('translate.favoriteRemove') : t('translate.favoriteAdd')}
                icon={<IconStar className="h-[18px] w-[18px]" filled={props.isFavorite} />}
                active={props.isFavorite}
                onClick={props.onToggleFavorite}
                disabled={!props.canFavorite}
              />
              <CardMenu
                onExplain={props.onExplain}
                onCheck={props.onCheck}
                onShare={() => void share()}
                canUseTools={props.canUseTools}
                shareSupported={canShare()}
                className="ml-auto"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {t('translate.provider', { provider: result.label ?? providerLabel(result.provider, result.model) })}
              {result.cached ? ` · ${t('translate.fromCache')}` : ''}
            </p>
          </div>
        ) : null}
      </Card>

      {props.others}
    </div>
  );
}
