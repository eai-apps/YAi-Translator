/** Тексты проверки сервисов на трёх языках. */
import type { ServiceCheck, UiLanguage } from '../../../shared/types';

const NOT_CONFIGURED: Record<UiLanguage, string> = {
  ru: 'Ключ сервиса не задан на сайте.',
  de: 'Der Schlüssel des Dienstes ist auf der Seite nicht hinterlegt.',
  en: 'The service key is not configured on the site.',
};

const UNREACHABLE: Record<UiLanguage, (service: string) => string> = {
  ru: (service) => `Не удалось связаться с ${service}. Проверьте интернет или попробуйте позже.`,
  de: (service) => `${service} ist nicht erreichbar. Prüfen Sie die Verbindung oder versuchen Sie es später.`,
  en: (service) => `${service} could not be reached. Check the connection or try again later.`,
};

const STATUS: Record<UiLanguage, (service: string, status: number) => string> = {
  ru: (service, status) => `${service} ответил кодом ${status}.`,
  de: (service, status) => `${service} antwortete mit Status ${status}.`,
  en: (service, status) => `${service} responded with status ${status}.`,
};

export const messages = {
  notConfigured(uiLang: UiLanguage): ServiceCheck {
    return { ok: false, latencyMs: 0, message: NOT_CONFIGURED[uiLang] };
  },
  unreachable(service: string, latencyMs: number, uiLang: UiLanguage): ServiceCheck {
    return { ok: false, latencyMs, message: UNREACHABLE[uiLang](service) };
  },
  status(service: string, status: number, latencyMs: number, uiLang: UiLanguage): ServiceCheck {
    return { ok: false, latencyMs, message: STATUS[uiLang](service, status) };
  },
} as const;
