/**
 * Окно «Что нового в версии X»: показывается один раз после обновления сайта.
 * Последняя показанная версия хранится в localStorage.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, STORAGE_KEYS } from '../../config';
import { CHANGELOG } from '../../data/changelog';
import { useSettings } from '../../hooks/useSettings';
import { readStorage, writeStorage } from '../../lib/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useSiteSettings } from '../../hooks/useSiteSettings';

function currentlyVisible(): boolean {
  const seen = readStorage<string>(STORAGE_KEYS.seenVersion, '');
  return seen !== APP_VERSION;
}

export function WhatsNewDialog() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const [open, setOpen] = useState(currentlyVisible);
  const site = useSiteSettings();
  const custom = site?.whatsNew;
  const displayVersion = custom?.version || APP_VERSION;

  useEffect(() => {
    if (custom) setOpen(readStorage<string>(STORAGE_KEYS.seenVersion, '') !== displayVersion);
  }, [custom, displayVersion]);

  const close = () => {
    writeStorage(STORAGE_KEYS.seenVersion, displayVersion);
    setOpen(false);
  };

  const entry = CHANGELOG.find((item) => item.version === APP_VERSION) ?? CHANGELOG[0];
  const items = custom?.text ? custom.text.split('\n').filter(Boolean) : entry.items[uiLanguage];

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('about.whatsNewDialogTitle', { version: displayVersion })}
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
