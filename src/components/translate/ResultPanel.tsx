/** Правая колонка: перевод, выбор переводчика, ошибки и действия («Спросить у AI», «Разобрать»…). */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, SourceLanguage, TranslateResponse } from '../../../shared/types';
import { getLanguage } from '../../../shared/languages';
import type { ProviderChoice, TranslatorError } from '../../hooks/useTranslator';
import type { SpeechController } from '../../hooks/useSpeech';
import { errorMessageKey, isAiProvider, providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { CopyButton } from '../ui/CopyButton';
import { IconButton } from '../ui/IconButton';
import { Spinner } from '../ui/Spinner';
import { SpeakButton } from '../ui/SpeakButton';
import { IconAlert, IconCheck, IconSearch, IconSparkles, IconStar, IconTranslate } from '../layout/icons';
import { AlternativesList } from './AlternativesList';
import { ProviderSelect } from './ProviderSelect';

interface ResultPanelProps {
  result: TranslateResponse | null;
  loading: boolean;
  error: TranslatorError | null;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  detectedLang: LanguageCode | null;
  isFavorite: boolean;
  canUseTools: boolean;
  speech: SpeechController;
  providerChoice: ProviderChoice;
  aiLoading: boolean;
  onProviderChange: (next: ProviderChoice) => void;
  onAskAi: () => void;
  onRetry: () => void;
  onOpenLimit: () => void;
  onExplain: () => void;
  onCheck: () => void;
  onCompare: () => void;
  onToggleFavorite: () => void;
}

export function ResultPanel(props: ResultPanelProps) {
  const { result, loading, error, sourceLang, targetLang, detectedLang, speech } = props;
  const { t } = useTranslation();

  const sourceName =
    sourceLang === 'auto'
      ? detectedLang
        ? getLanguage(detectedLang)?.nativeName ?? t('languages.auto')
        : t('languages.auto')
      : getLanguage(sourceLang)?.nativeName ?? sourceLang;
  const targetName = getLanguage(targetLang)?.nativeName ?? targetLang;
  const copyValue = result?.translatedText ?? '';
  const answeredByAi = result ? isAiProvider(result.provider) : false;

  return (
    <Card className="flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">
            {sourceName} → {targetName}
          </span>
          {detectedLang && sourceLang === 'auto' ? (
            <Badge tone="accent">
              {t('translate.detected', { language: getLanguage(detectedLang)?.nativeName ?? detectedLang })}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Spinner className="text-muted" /> : null}
          <ProviderSelect value={props.providerChoice} onChange={props.onProviderChange} />
        </div>
      </div>

      <div className="mt-2 flex-1" aria-live="polite">
        {error ? (
          <div className="flex flex-col items-start justify-center gap-3 py-8">
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
            <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">
                <IconTranslate className="h-6 w-6" />
              </div>
              <p className="font-medium">{t('translate.emptyTitle')}</p>
              <p className="max-w-xs text-sm leading-relaxed text-muted">{t('translate.emptyText')}</p>
            </div>
          )
        ) : (
          <>
            <p className="whitespace-pre-wrap break-words text-lg leading-relaxed sm:text-xl">
              {result.translatedText}
            </p>
            <AlternativesList alternatives={result.alternatives} targetLang={targetLang} speech={speech} />
          </>
        )}
      </div>

      {result ? (
        <div className="mt-4 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={copyValue} label={t('translate.copyResult')} />
            <SpeakButton text={copyValue} language={targetLang} id="result" speech={speech} label={t('translate.speakResult')} />
            <IconButton
              label={props.isFavorite ? t('translate.favoriteRemove') : t('translate.favoriteAdd')}
              icon={<IconStar className="h-[18px] w-[18px]" filled={props.isFavorite} />}
              active={props.isFavorite}
              onClick={props.onToggleFavorite}
            />
            {!answeredByAi ? (
              <Button
                size="sm"
                variant="primary"
                icon={<IconSparkles className="h-4 w-4" />}
                loading={props.aiLoading}
                onClick={props.onAskAi}
              >
                {t('translate.askAi')}
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" icon={<IconSparkles className="h-4 w-4" />} onClick={props.onExplain} disabled={!props.canUseTools}>
              {t('translate.explain')}
            </Button>
            <Button size="sm" variant="secondary" icon={<IconSearch className="h-4 w-4" />} onClick={props.onCompare} disabled={!props.canUseTools}>
              {t('translate.compare')}
            </Button>
            <Button size="sm" variant="secondary" icon={<IconCheck className="h-4 w-4" />} onClick={props.onCheck} disabled={!props.canUseTools}>
              {t('translate.check')}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {t('translate.provider', { provider: providerLabel(result.provider) })}
            {result.cached ? ` · ${t('translate.fromCache')}` : ''}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
