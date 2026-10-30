/**
 * Мастер «ключ за 3 нажатия»: большая кнопка получения ключа, три шага,
 * поле с кнопкой «Вставить», автоматическая проверка и сохранение.
 * Используется и в карточке «Мои ключи ИИ», и в окне дневного лимита.
 */
import { useTranslation } from 'react-i18next';
import type { KeyProvider } from '../../../shared/types';
import { useKeyWizard } from '../../hooks/useKeyWizard';
import { Button } from '../ui/Button';
import { IconLock, IconSparkles } from '../layout/icons';
import { KEY_PROVIDER_NAMES, KEY_STEPS, openKeyLink } from './keyLinks';
import { KeyStatus } from './KeyStatus';

interface KeyWizardProps {
  provider: KeyProvider;
  /** Показывать ли подсказку «Войдите, чтобы ключ работал на всех устройствах». */
  showAccountHint?: boolean;
  /** Вызывается после того, как ключ сохранён (окно лимита повторяет перевод). */
  onSaved?: () => void;
}

export function KeyWizard({ provider, showAccountHint = true, onSaved }: KeyWizardProps) {
  const { t } = useTranslation();
  const wizard = useKeyWizard(provider);
  const name = KEY_PROVIDER_NAMES[provider];
  const hasKey = wizard.state.mask !== null;

  const handleSave = async () => {
    if (await wizard.save()) onSaved?.();
  };

  return (
    <div className="rounded-2xl border border-line p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t('keys.serviceTitle', { name })}</h4>
        {wizard.state.stored ? (
          <span className="rounded-full bg-accentSoft px-2 py-1 text-[11px] font-medium text-accent">
            {t('keys.inAccount')}
          </span>
        ) : null}
      </div>

      {/* 1. Большая кнопка: сразу на страницу создания ключа. */}
      <Button
        variant="primary"
        className="mt-2 h-12 w-full text-base"
        icon={<IconSparkles className="h-5 w-5" />}
        onClick={() => openKeyLink(provider)}
      >
        {t('keys.getFreeKey')}
      </Button>

      {/* 2. Три коротких шага. */}
      <ol className="mt-3 space-y-1.5">
        {KEY_STEPS[provider].map((stepKey, index) => (
          <li key={stepKey} className="flex gap-2 text-sm text-ink">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentSoft text-[11px] font-semibold text-accent">
              {index + 1}
            </span>
            <span className="leading-relaxed">{t(stepKey)}</span>
          </li>
        ))}
      </ol>

      {/* 3. Поле ключа и кнопка «Вставить». */}
      <div className="mt-3 flex gap-2">
        <input
          ref={wizard.inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={wizard.value}
          onChange={(event) => wizard.updateValue(event.target.value)}
          placeholder={
            hasKey && !wizard.value && wizard.state.mask
              ? wizard.state.mask
              : t('keys.keyPlaceholder', { name })
          }
          aria-label={t('keys.keyLabel', { name })}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-card px-3 font-mono text-sm outline-none focus:border-accent"
        />
        <Button size="sm" className="h-11 shrink-0" onClick={() => void wizard.paste()}>
          {t('keys.paste')}
        </Button>
      </div>

      <KeyStatus
        check={wizard.check}
        latencyMs={wizard.latencyMs}
        message={wizard.message}
        savedNotice={wizard.savedNotice}
      />

      {wizard.saveError ? (
        <p className="mt-1 text-xs text-danger">{wizard.saveError}</p>
      ) : null}

      {/* Сохранённый ключ: «••••1234» с кнопками «Проверить» и «Удалить». */}
      {hasKey ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-soft px-3 py-2">
          <span className="font-mono text-sm">{wizard.state.mask}</span>
          <span className="text-[11px] text-muted">
            {wizard.state.stored
              ? t('keys.whereAccount')
              : wizard.state.local
                ? t('keys.whereDevice')
                : ''}
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" loading={wizard.check === 'testing'} onClick={() => void wizard.retest()}>
              {t('keys.testAgain')}
            </Button>
            <Button size="sm" variant="danger" onClick={() => void wizard.remove()}>
              {t('keys.remove')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <Button
          variant="primary"
          size="sm"
          loading={wizard.saving}
          disabled={!wizard.value.trim() || wizard.check === 'fail'}
          onClick={() => void handleSave()}
        >
          {wizard.signedIn && wizard.keysStorageEnabled ? t('keys.saveToAccount') : t('keys.saveOnDevice')}
        </Button>
      </div>

      {showAccountHint && !wizard.signedIn ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{t('keys.accountHint')}</p>
      ) : null}

      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
        <IconLock className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{wizard.signedIn && wizard.keysStorageEnabled ? t('keys.privacyAccount') : t('keys.privacyDevice')}</span>
      </p>
    </div>
  );
}
