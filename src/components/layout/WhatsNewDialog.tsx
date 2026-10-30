/**
 * Окно «Что нового в версии X»: показывается один раз после обновления сайта.
 * Последняя показанная версия хранится в localStorage.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, STORAGE_KEYS } from '../../config';
import { CHANGELOG } from '../../data/changelog';
import { useSettings } from '../../hooks/useSettings';
import { readStorage, writeStorage } from '../../lib/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

function currentlyVisible(): boolean {
  const seen = readStorage<string>(STORAGE_KEYS.seenVersion, '');
  return seen !== APP_VERSION;
}

export function WhatsNewDialog() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const [open, setOpen] = useState(currentlyVisible);

  const close = () => {
    writeStorage(STORAGE_KEYS.seenVersion, APP_VERSION);
    setOpen(false);
  };

  const entry = CHANGELOG.find((item) => item.version === APP_VERSION) ?? CHANGELOG[0];
  const items = entry.items[uiLanguage];

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('about.whatsNewDialogTitle', { version: entry.version })}
      footer={
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={close}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
