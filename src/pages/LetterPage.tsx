/**
 * Страница «Объясни письмо из Behörde» (/letter, Часть 17).
 * Разбор официальных писем (Jobcenter, Finanzamt, Bürgeramt, Krankenkasse, Vermieter):
 * - Вставка текста или фото с камеры (OCR Tesseract.js);
 * - Выделение срока (дедлайна);
 * - Пошаговый план действий;
 * - Готовый вежливый шаблон ответа на немецком языке.
 * Текст письма не сохраняется на сервере ради конфиденциальности.
 */
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LetterExplainResponse } from '../../shared/types';
import { api } from '../api/client';
import { useSettings } from '../hooks/useSettings';
import { recognizeTextFromImage } from '../lib/ocr';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import {
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconClock,
  IconCopy,
  IconFileText,
  IconLock,
  IconSparkles,
} from '../components/layout/icons';

const SAMPLE_LETTERS = [
  {
    key: 'letter.samples.jobcenter',
    text: `Jobcenter Berlin Mitte
Lehrter Straße 46, 10557 Berlin

Einladung zum persönlichen Gespräch

Sehr geehrte(r) Frau/Herr Mustermann,

bitte kommen Sie am Donnerstag, den 20.11.2026 um 10:30 Uhr in das Zimmer 204 zu Ihrem persönlichen Ansprechpartner Herrn Schmidt.

Wir möchten mit Ihnen über Ihre aktuelle berufliche Situation und weitere Fördermöglichkeiten sprechen.
Bitte bringen Sie Ihren Personalausweis und die Nachweise über Ihre letzten Bewerbungen mit.

Sollten Sie zu diesem Termin arbeitsunfähig erkrankt sein, legen Sie bitte eine ärztliche Bescheinigung vor.
Rechtsfolgenbelehrung: Wenn Sie ohne wichtigen Grund dieser Einladung nicht nachkommen, kann Ihr Leistungsanspruch um 10 Prozent gemindert werden (§ 32 SGB II).

Mit freundlichen Grüßen,
Ihr Jobcenter`,
  },
  {
    key: 'letter.samples.mahnung',
    text: `Stadtwerke Energie GmbH
Kundenservice

Mahnung / Zahlungserinnerung
Kunden-Nr: 8493021
Rechnungs-Nr: RE-2026-9912

Sehr geehrte Kundin, sehr geehrter Kunde,

bei Durchsicht unserer Buchhaltung haben wir festgestellt, dass der fällige Rechnungsbetrag für die Stromabrechnung in Höhe von 142,50 Euro noch nicht auf unserem Konto eingegangen ist.

Bitte überweisen Sie den fälligen Betrag unter Angabe Ihrer Kunden-Nummer bis spätestens zum 15.11.2026 auf unser unten genanntes Bankkonto.

Sollte die Zahlung in den letzten Tagen bereits erfolgt sein, betrachten Sie dieses Schreiben bitte als gegenstandslos.

Mit freundlichen Grüßen,
Buchhaltung Stadtwerke`,
  },
];

export default function LetterPage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LetterExplainResponse | null>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrProgress(0);
    setError(null);
    try {
      const recognized = await recognizeTextFromImage(file, 'de', (p) => {
        setOcrProgress(Math.round(p.progress * 100));
      });
      if (recognized.trim()) {
        setText(recognized.trim());
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError(t('letter.ocrError'));
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExplain = async () => {
    const clean = text.trim();
    if (clean.length < 10 || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.explainLetter({
        text: clean,
        uiLang: uiLanguage,
      });
      setResult(res);
    } catch (err) {
      console.error('Explain letter error:', err);
      setError(t('letter.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = () => {
    if (!result?.replyTemplate) return;
    void navigator.clipboard?.writeText(result.replyTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <>
      <PageHeader
        title={t('letter.title')}
        subtitle={t('letter.subtitle')}
        action={
          <Link to="/ask">
            <Button size="sm" variant="ghost" icon={<IconArrowLeft className="h-4 w-4" />}>
              {t('ask.title')}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Левая колонка: форма ввода письма */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t('letter.inputTitle')}
              </span>

              {/* Кнопка OCR с фото */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading || loading}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-soft px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {ocrLoading ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    <span>{ocrProgress}%</span>
                  </>
                ) : (
                  <>
                    <IconCamera className="h-4 w-4" />
                    <span>{t('letter.photoBtn')}</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('letter.placeholder')}
              rows={8}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-card p-3 text-sm text-ink placeholder:text-muted outline-none focus:border-accent"
            />

            {/* Примеры писем */}
            <div className="mt-2.5">
              <span className="text-[11px] text-muted">{t('letter.samplesTitle')}:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SAMPLE_LETTERS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setText(s.text)}
                    className="rounded-lg border border-line bg-soft px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-ink"
                  >
                    {t(s.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <IconLock className="h-3.5 w-3.5 shrink-0" />
                <span>{t('letter.privacyNotice')}</span>
              </span>

              <Button
                variant="primary"
                onClick={handleExplain}
                disabled={text.trim().length < 10}
                loading={loading}
                icon={<IconSparkles className="h-4 w-4" />}
              >
                {t('letter.analyzeBtn')}
              </Button>
            </div>
          </Card>

          {/* Предупреждение */}
          <div className="rounded-xl border border-line bg-soft p-3.5 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-ink">⚠️ {t('letter.disclaimerTitle')}</p>
            <p className="mt-1">{t('letter.disclaimerText')}</p>
          </div>
        </div>

        {/* Правая колонка: результаты анализа */}
        <div className="space-y-4">
          {error ? (
            <Card className="p-4 sm:p-5 border-danger/40 bg-soft">
              <p className="text-sm font-medium text-danger">{error}</p>
            </Card>
          ) : null}

          {loading ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <Spinner className="h-8 w-8 text-accent" />
              <p className="mt-3 text-sm font-medium text-ink">{t('letter.analyzing')}</p>
              <p className="mt-1 text-xs text-muted">{t('letter.analyzingSub')}</p>
            </Card>
          ) : result ? (
            <Card className="p-4 sm:p-5 space-y-4">
              {/* Отправитель и дедлайн */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-soft p-1.5 text-muted">
                    <IconFileText className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="text-[11px] font-medium text-muted">{t('letter.sender')}:</span>
                    <p className="text-sm font-semibold text-ink">{result.sender}</p>
                  </div>
                </div>

                {/* Срок (Frist) */}
                {result.hasDeadline && result.deadline ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-3 py-1.5 text-danger">
                    <IconClock className="h-4 w-4 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block">
                        {t('letter.deadline')}:
                      </span>
                      <span className="text-sm font-bold">{result.deadline}</span>
                    </div>
                  </div>
                ) : (
                  <span className="rounded-lg bg-soft px-2.5 py-1 text-xs text-muted">
                    {t('letter.noDeadline')}
                  </span>
                )}
              </div>

              {/* Суть письма */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t('letter.summaryTitle')}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{result.summary}</p>
              </div>

              {/* Пошаговые действия */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t('letter.stepsTitle')}
                </h3>
                <ul className="mt-1.5 space-y-2">
                  {result.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accentSoft text-[10px] font-bold text-accent">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Готовый шаблон ответа */}
              {result.replyTemplate ? (
                <div className="border-t border-line pt-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {t('letter.replyTemplateTitle')}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyTemplate}
                      icon={
                        copiedTemplate ? (
                          <IconCheck className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <IconCopy className="h-3.5 w-3.5" />
                        )
                      }
                    >
                      {copiedTemplate ? t('common.copied') : t('common.copy')}
                    </Button>
                  </div>
                  <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-soft p-3 font-mono text-xs leading-relaxed text-ink">
                    {result.replyTemplate}
                  </pre>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center text-muted">
              <IconFileText className="h-10 w-10 text-muted/60" />
              <p className="mt-3 text-sm font-medium">{t('letter.emptyPrompt')}</p>
              <p className="mt-1 text-xs">{t('letter.emptyPromptSub')}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
