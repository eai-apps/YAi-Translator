/**
 * «Мои ключи ИИ»: мастер за три нажатия для Gemini и Groq.
 * Вошёл в аккаунт — ключ сохраняется туда и работает на всех устройствах,
 * иначе — только на этом устройстве.
 */
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../hooks/useAccount';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { KeyWizard } from '../keys/KeyWizard';
import { IconLock } from '../layout/icons';

export function KeysCard() {
  const { t } = useTranslation();
  const { status, account } = useAccount();

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('profile.keysTitle')}</SectionTitle>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {status === 'signedIn' && account?.keysStorageEnabled
          ? t('keys.introAccount')
          : t('keys.introDevice')}
      </p>

      <div className="mt-3 space-y-3">
        <KeyWizard provider="gemini" />
        <KeyWizard provider="groq" />
      </div>

      {status === 'signedIn' && account && !account.keysStorageEnabled ? (
        <p className="mt-3 text-xs leading-relaxed text-warning">{t('account.errors.keysStorageDisabled')}</p>
      ) : null}

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
        <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t('profile.privacy')}</span>
      </p>
    </Card>
  );
}
