/**
 * Источники словаря на странице «О приложении»: подписи лицензий и ссылки (этап 4).
 * Для OpenThesaurus обязательна обычная ссылка на www.openthesaurus.de (без nofollow).
 */
import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../ui/SectionTitle';

const SOURCES = [
  { id: 'wiktionary', name: 'Wiktionary', url: 'https://de.wiktionary.org/', licenseKey: 'about.licenseWiktionary' },
  {
    id: 'openthesaurus',
    name: 'OpenThesaurus',
    url: 'https://www.openthesaurus.de/',
    licenseKey: 'about.licenseOpenThesaurus',
  },
  { id: 'tatoeba', name: 'Tatoeba', url: 'https://tatoeba.org/de', licenseKey: 'about.licenseTatoeba' },
  { id: 'pons', name: 'PONS', url: 'https://de.pons.com', licenseKey: 'about.licensePons' },
  { id: 'dwds', name: 'DWDS', url: 'https://www.dwds.de/', licenseKey: 'about.licenseDwds' },
  {
    id: 'german-nouns',
    name: 'German Nouns (gambolputty)',
    url: 'https://github.com/gambolputty/german-nouns',
    licenseKey: 'about.licenseGermanNouns',
  },
  {
    id: 'kaikki',
    name: 'Wiktionary / Kaikki.org',
    url: 'https://kaikki.org/dictionary/German/',
    licenseKey: 'about.licenseKaikki',
  },
  {
    id: 'frequency-words',
    name: 'FrequencyWords (Hermit Dave)',
    url: 'https://github.com/hermitdave/FrequencyWords',
    licenseKey: 'about.licenseFrequencyWords',
  },
];

export function DictionarySources() {
  const { t } = useTranslation();

  return (
    <>
      <SectionTitle>{t('about.sourcesTitle')}</SectionTitle>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t('about.sourcesText')}</p>
      <ul className="mt-3 divide-y divide-line">
        {SOURCES.map((source) => (
          <li key={source.id} className="py-2">
            <a
              href={source.url}
              target="_blank"
              rel="noopener"
              className="text-sm font-medium text-accent underline decoration-dotted underline-offset-2"
            >
              {source.name}
            </a>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{t(source.licenseKey)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
