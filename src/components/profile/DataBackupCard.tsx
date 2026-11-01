/**
 * Карточка «Резервная копия и перенос данных» (этап 20):
 * экспорт всех данных (JSON) и импорт из файла для гостей и пользователей с аккаунтом.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportAllUserData, importUserData } from '../../lib/dataBackup';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconDownload, IconUpload } from '../layout/icons';

export function DataBackupCard() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleExport = () => {
    try {
      exportAllUserData();
      setStatusMsg({ text: t('account.exportSuccess') });
    } catch {
      setStatusMsg({ text: t('account.exportError'), error: true });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = importUserData(text);
      setStatusMsg({
        text: t('account.importSuccess', {
          history: res.historyCount,
          cards: res.cardsCount,
        }),
      });
    } catch {
      setStatusMsg({ text: t('account.importError'), error: true });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('account.backupTitle')}</SectionTitle>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t('account.backupHint')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={<IconDownload className="h-4 w-4" />}
          onClick={handleExport}
        >
          {t('account.exportBtn')}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<IconUpload className="h-4 w-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          {t('account.importBtn')}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      {statusMsg ? (
        <p
          className={`mt-3 text-xs leading-relaxed ${statusMsg.error ? 'text-danger' : 'text-success'}`}
          role="status"
        >
          {statusMsg.text}
        </p>
      ) : null}
    </Card>
  );
}
