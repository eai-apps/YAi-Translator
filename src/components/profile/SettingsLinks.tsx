/**
 * Внизу настроек (этап 8): «О приложении», «Обратная связь» (mailto: с адресом из админки,
 * пусто — пункт скрыт) и «Справка» (/help).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { Button } from '../ui/Button';

export function SettingsLinks() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string | null>(null);

  // Адрес обратной связи задаётся в админке (Настройки → «E-mail для обратной связи»).
  useEffect(() => {
    let alive = true;
    void api
      .siteSettings()
      .then((response) => {
        if (alive) setEmail(response.feedbackEmail ?? null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-sm font-medium">{t('profile.appLinksTitle')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to="/about">
          <Button size="sm" variant="secondary">
            {t('profile.aboutLinkShort')}
          </Button>
        </Link>
        <Link to="/help">
          <Button size="sm" variant="secondary">
            {t('profile.help')}
          </Button>
        </Link>
        {email ? (
          <a href={`mailto:${email}`}>
            <Button size="sm" variant="secondary">
              {t('profile.feedback')}
            </Button>
          </a>
        ) : null}
      </div>
    </div>
  );
}
