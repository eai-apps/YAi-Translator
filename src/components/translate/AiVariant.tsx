/**
 * Вариант перевода от ИИ внутри «Как переводят другие».
 * Грузится только по кнопке, чтобы не тратить бесплатный лимит ИИ на каждый перевод.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, ProviderId, SourceLanguage, TranslateResponse } from '../../../shared/types';
import { textDirection } from '../../../shared/languages';
import { api } from '../../api/client';
import type { SpeechController } from '../../hooks/useSpeech';
import { providerLabel, toTranslatorError } from '../../lib/errors';
import { Button } from '../ui/Button';
import { CopyButton } from '../ui/CopyButton';
import { SpeakButton } from '../ui/SpeakButton';
import { IconCheck, IconSparkles } from '../layout/icons';

interface AiVariantProps {
  text: string;
  sourceLang: SourceLanguage;
  targetLang: LanguageCode;
  speech: SpeechController;
  used: boolean;
  onUse: (provider: ProviderId, text: string) => void;
  onLimitReached: () => void;
}

export function AiVariant({ text, sourceLang, targetLang, speech, used, onUse, onLimitReached }: AiVariantProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Новый текст или языки — старый ответ ИИ больше не подходит.
  useEffect(() => {
    setResult(null);
    setFailed(false);
  }, [text, sourceLang, targetLang]);

  const ask = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setResult(await api.translate({ text: text.trim(), sourceLang, targetLang, mode: 'ai' }));
    } catch (caught) {
      if (toTranslatorError(caught, '').code === 'LIMIT_REACHED') onLimitReached();
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line px-3 py-2.5">
        <p className="text-sm text-muted">{failed ? t('others.aiFailed') : t('others.aiHint')}</p>
        <Button size="sm" variant="secondary" icon={<IconSparkles className="h-4 w-4" />} loading={loading} onClick={() => void ask()}>
          {t('others.aiShow')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-accent/40 bg-accentSoft/40 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        <IconSparkles className="h-3.5 w-3.5 text-accent" />
        {t('others.aiLabel', { provider: providerLabel(result.provider) })}
      </p>
      <p dir={textDirection(targetLang)} className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
        {result.translatedText}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant={used ? 'secondary' : 'primary'}
          icon={used ? <IconCheck className="h-3.5 w-3.5" /> : undefined}
          onClick={() => onUse(result.provider, result.translatedText)}
        >
          {used ? t('others.used') : t('others.use')}
        </Button>
        <CopyButton text={result.translatedText} label={t('common.copy')} />
        <SpeakButton text={result.translatedText} language={targetLang} id="others-ai" speech={speech} label={t('common.listen')} />
      </div>
    </div>
  );
}
