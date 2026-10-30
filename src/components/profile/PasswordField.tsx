/** Поле пароля с кнопкой «показать пароль». */
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: 'current-password' | 'new-password';
  inputRef?: RefObject<HTMLInputElement>;
}

export function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  inputRef,
}: PasswordFieldProps) {
  const { t } = useTranslation();

  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5 flex gap-2">
        <input
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-pressed={visible}
          className="h-11 shrink-0 rounded-xl border border-line px-3 text-xs font-medium text-muted hover:bg-soft hover:text-ink"
        >
          {visible ? t('account.hidePassword') : t('account.showPassword')}
        </button>
      </div>
    </label>
  );
}
