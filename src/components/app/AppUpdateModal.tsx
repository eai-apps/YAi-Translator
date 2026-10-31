import React from 'react';
import { useTranslation } from 'react-i18next';

export interface AppUpdateInfo {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  notes_ru?: string;
  notes_de?: string;
  notes_en?: string;
  required?: boolean;
}

interface AppUpdateModalProps {
  info: AppUpdateInfo;
  onDismiss: () => void;
}

/**
 * Модальное окно сообщения о новой версии приложения для Android / Android TV.
 */
export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ info, onDismiss }) => {
  const { t, i18n } = useTranslation();

  const notes =
    (i18n.language.startsWith('de')
      ? info.notes_de
      : i18n.language.startsWith('en')
        ? info.notes_en
        : info.notes_ru) ||
    info.notes_ru ||
    info.notes_en ||
    '';

  const handleUpdate = () => {
    if (info.apkUrl) {
      window.open(info.apkUrl, '_system');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-update-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-2xl bg-card border border-line p-6 shadow-pop space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold text-xl">
            ↑
          </div>
          <div>
            <h2 id="app-update-title" className="text-lg font-bold text-ink">
              {t('appUpdate.title', 'Доступно обновление')}
            </h2>
            <p className="text-xs text-muted">
              {t('appUpdate.version', 'Версия')} {info.versionName}
            </p>
          </div>
        </div>

        {notes && (
          <div className="rounded-xl bg-soft/60 p-3.5 text-sm text-ink/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {notes}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {!info.required && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2.5 rounded-xl border border-line text-sm font-medium text-muted hover:text-ink hover:bg-soft transition"
            >
              {t('appUpdate.later', 'Позже')}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={handleUpdate}
            className="px-5 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition shadow-sm"
          >
            {t('appUpdate.update', 'Обновить')}
          </button>
        </div>
      </div>
    </div>
  );
};
