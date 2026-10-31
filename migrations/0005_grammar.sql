-- Этап 5 (версия 0.6.0): справочник грамматики.
-- Таблица создаётся и автоматически (functions/_lib/schema.ts); эта миграция заливает список тем.
-- Запуск: npx wrangler d1 execute yai-translator-db --remote --file=./migrations/0005_grammar.sql
--
-- Текста правил здесь нет: body_json заполняется при первом открытии темы (ИИ, один раз на всех)
-- или в админке. Список тем совпадает с shared/grammarTopics.ts — меняйте оба файла вместе.
-- Повторный запуск миграции безопасен: INSERT OR IGNORE не трогает уже заполненные темы.

CREATE TABLE IF NOT EXISTS grammar_topics (
  slug TEXT PRIMARY KEY,
  lang TEXT NOT NULL DEFAULT 'de',
  level TEXT NOT NULL DEFAULT 'A1',
  category TEXT NOT NULL DEFAULT 'syntax',
  title_ru TEXT NOT NULL DEFAULT '',
  title_de TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'none',
  source_url TEXT,
  updated_at INTEGER,
  edited_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_grammar_topics_lang ON grammar_topics (lang, category, level);

INSERT OR IGNORE INTO grammar_topics (slug, lang, level, category, title_ru, title_de, title_en) VALUES
-- Артикли
('definite-articles', 'de', 'A1', 'articles', 'Определённый артикль der, die, das', 'Bestimmter Artikel', 'Definite articles'),
('indefinite-articles', 'de', 'A1', 'articles', 'Неопределённый артикль ein, eine, ein', 'Unbestimmter Artikel', 'Indefinite articles'),
('negative-article-kein', 'de', 'A1', 'articles', 'Отрицательный артикль kein', 'Negativartikel kein', 'Negative article kein'),
('possessive-articles', 'de', 'A1', 'articles', 'Притяжательные артикли mein, dein, sein …', 'Possessivartikel', 'Possessive articles'),
-- Существительные
('noun-gender', 'de', 'A1', 'nouns', 'Род существительных', 'Genus der Substantive', 'Noun gender'),
('noun-plurals', 'de', 'A1', 'nouns', 'Множественное число существительных', 'Plural der Substantive', 'Noun plurals'),
('n-declension', 'de', 'A2', 'nouns', 'n-склонение (слабое склонение существительных)', 'n-Deklination', 'n-declension (weak nouns)'),
-- Падежи
('cases-overview', 'de', 'A1', 'cases', 'Падежи: обзор', 'Die vier Fälle', 'The four cases'),
('nominativ', 'de', 'A1', 'cases', 'Nominativ', 'Nominativ', 'Nominative'),
('akkusativ', 'de', 'A1', 'cases', 'Akkusativ', 'Akkusativ', 'Accusative'),
('dativ', 'de', 'A1', 'cases', 'Dativ', 'Dativ', 'Dative'),
('genitiv', 'de', 'B1', 'cases', 'Genitiv', 'Genitiv', 'Genitive'),
-- Прилагательные
('adjectives-overview', 'de', 'A2', 'adjectives', 'Прилагательные: как они работают', 'Adjektive: Grundlagen', 'Adjectives: basics'),
('weak-declension', 'de', 'A2', 'adjectives', 'Слабое склонение прилагательных', 'Schwache Adjektivdeklination', 'Weak adjective declension'),
('strong-declension', 'de', 'A2', 'adjectives', 'Сильное склонение прилагательных', 'Starke Adjektivdeklination', 'Strong adjective declension'),
('mixed-declension', 'de', 'A2', 'adjectives', 'Смешанное склонение прилагательных', 'Gemischte Adjektivdeklination', 'Mixed adjective declension'),
('adjective-comparison', 'de', 'A2', 'adjectives', 'Степени сравнения прилагательных', 'Komparativ und Superlativ', 'Comparison of adjectives'),
-- Местоимения
('personal-pronouns', 'de', 'A1', 'pronouns', 'Личные местоимения', 'Personalpronomen', 'Personal pronouns'),
('reflexive-pronouns', 'de', 'A2', 'pronouns', 'Возвратные местоимения', 'Reflexivpronomen', 'Reflexive pronouns'),
('demonstrative-pronouns', 'de', 'B1', 'pronouns', 'Указательные местоимения', 'Demonstrativpronomen', 'Demonstrative pronouns'),
('relative-pronouns', 'de', 'B1', 'pronouns', 'Относительные местоимения', 'Relativpronomen', 'Relative pronouns'),
('indefinite-pronouns', 'de', 'A2', 'pronouns', 'Неопределённые местоимения man, jemand, nichts', 'Indefinitpronomen', 'Indefinite pronouns'),
-- Времена
('praesens', 'de', 'A1', 'tenses', 'Präsens: настоящее время', 'Präsens', 'Present tense'),
('perfekt', 'de', 'A1', 'tenses', 'Perfekt', 'Perfekt', 'Perfect tense'),
('perfekt-haben-sein', 'de', 'A2', 'tenses', 'Perfekt с haben и sein', 'Perfekt mit haben und sein', 'Perfect with haben and sein'),
('praeteritum', 'de', 'A2', 'tenses', 'Präteritum', 'Präteritum', 'Simple past'),
('plusquamperfekt', 'de', 'B1', 'tenses', 'Plusquamperfekt', 'Plusquamperfekt', 'Past perfect'),
('futur-1', 'de', 'A2', 'tenses', 'Futur I', 'Futur I', 'Future I'),
('futur-2', 'de', 'B1', 'tenses', 'Futur II', 'Futur II', 'Future II'),
('partizip-2', 'de', 'A2', 'tenses', 'Partizip II', 'Partizip II', 'Past participle'),
('tenses-overview', 'de', 'A2', 'tenses', 'Все времена: что и когда', 'Zeiten im Überblick', 'Tenses at a glance'),
-- Наклонения
('konjunktiv-1', 'de', 'B2', 'moods', 'Konjunktiv I: косвенная речь', 'Konjunktiv I', 'Subjunctive I'),
('konjunktiv-2', 'de', 'B1', 'moods', 'Konjunktiv II: сослагательное наклонение', 'Konjunktiv II', 'Subjunctive II'),
('konjunktiv-2-wuerde', 'de', 'B1', 'moods', 'Konjunktiv II с würde', 'Konjunktiv II mit würde', 'Subjunctive II with würde'),
('konjunktiv-2-haette-waere', 'de', 'B1', 'moods', 'Konjunktiv II: hätte и wäre', 'Konjunktiv II: hätte, wäre', 'Subjunctive II: hätte, wäre'),
('konjunktiv-2-modal', 'de', 'B2', 'moods', 'Konjunktiv II модальных глаголов', 'Konjunktiv II der Modalverben', 'Subjunctive II of modal verbs'),
('imperativ', 'de', 'A1', 'moods', 'Повелительное наклонение', 'Imperativ', 'Imperative'),
('indirekte-rede', 'de', 'B2', 'moods', 'Косвенная речь', 'Indirekte Rede', 'Reported speech'),
-- Залог
('passiv', 'de', 'B1', 'voice', 'Passiv: обзор', 'Passiv', 'Passive voice'),
('vorgangspassiv', 'de', 'B1', 'voice', 'Vorgangspassiv: действие', 'Vorgangspassiv', 'Process passive'),
('zustandspassiv', 'de', 'B2', 'voice', 'Zustandspassiv: состояние', 'Zustandspassiv', 'State passive'),
-- Глаголы
('modalverben', 'de', 'A1', 'verbs', 'Модальные глаголы', 'Modalverben', 'Modal verbs'),
('reflexive-verbs', 'de', 'A2', 'verbs', 'Возвратные глаголы', 'Reflexive Verben', 'Reflexive verbs'),
('separable-verbs', 'de', 'A2', 'verbs', 'Отделяемые приставки', 'Trennbare Verben', 'Separable verbs'),
('inseparable-verbs', 'de', 'A2', 'verbs', 'Неотделяемые приставки', 'Untrennbare Verben', 'Inseparable verbs'),
('strong-verbs', 'de', 'A2', 'verbs', 'Сильные и неправильные глаголы', 'Starke und unregelmäßige Verben', 'Strong and irregular verbs'),
('verbs-with-prepositions', 'de', 'B1', 'verbs', 'Глаголы с предлогами', 'Verben mit Präpositionen', 'Verbs with prepositions'),
-- Синтаксис
('word-order-main-clause', 'de', 'A1', 'syntax', 'Порядок слов в главном предложении', 'Wortstellung im Hauptsatz', 'Word order in main clauses'),
('word-order-subordinate', 'de', 'A2', 'syntax', 'Порядок слов в придаточном предложении', 'Wortstellung im Nebensatz', 'Word order in subordinate clauses'),
('word-order-questions', 'de', 'A1', 'syntax', 'Порядок слов в вопросах', 'Wortstellung in Fragen', 'Word order in questions'),
('tekamolo', 'de', 'A2', 'syntax', 'TeKaMoLo: порядок обстоятельств', 'TeKaMoLo', 'TeKaMoLo'),
('negation-nicht-kein', 'de', 'A1', 'syntax', 'Отрицание nicht и kein', 'Verneinung mit nicht und kein', 'Negation with nicht and kein'),
('relative-clauses', 'de', 'B1', 'syntax', 'Относительные придаточные', 'Relativsätze', 'Relative clauses'),
('infinitive-with-zu', 'de', 'A2', 'syntax', 'Инфинитив с zu', 'Infinitiv mit zu', 'Infinitive with zu'),
-- Союзы
('conjunctions-weil-denn-da', 'de', 'A2', 'conjunctions', 'weil, denn, da: причины', 'weil, denn, da', 'weil, denn, da (reason)'),
('conjunctions-obwohl-trotzdem', 'de', 'B1', 'conjunctions', 'obwohl и trotzdem: уступка', 'obwohl und trotzdem', 'obwohl and trotzdem (concession)'),
('conjunctions-dass', 'de', 'A2', 'conjunctions', 'Союз dass', 'dass', 'The conjunction dass'),
('conjunctions-ob', 'de', 'A2', 'conjunctions', 'Косвенный вопрос с ob', 'Indirekte Frage mit ob', 'Indirect question with ob'),
('conjunctions-wenn-als', 'de', 'A2', 'conjunctions', 'wenn и als: когда', 'wenn und als', 'wenn and als (when)'),
('conjunctions-damit-um-zu', 'de', 'B1', 'conjunctions', 'damit и um … zu: цель', 'damit und um … zu', 'damit and um … zu (purpose)'),
('conjunctions-overview', 'de', 'B1', 'conjunctions', 'Союзы: обзор и альтернативы', 'Konjunktionen im Überblick', 'Conjunctions overview'),
-- Предлоги
('prepositions-akkusativ', 'de', 'A1', 'prepositions', 'Предлоги с Akkusativ', 'Präpositionen mit Akkusativ', 'Prepositions with the accusative'),
('prepositions-dativ', 'de', 'A1', 'prepositions', 'Предлоги с Dativ', 'Präpositionen mit Dativ', 'Prepositions with the dative'),
('wechselpraepositionen', 'de', 'A2', 'prepositions', 'Wechselpräpositionen: Wo? и Wohin?', 'Wechselpräpositionen', 'Two-way prepositions'),
('prepositions-genitiv', 'de', 'B1', 'prepositions', 'Предлоги с Genitiv', 'Präpositionen mit Genitiv', 'Prepositions with the genitive'),
-- Числа и время
('numbers', 'de', 'A1', 'numbers', 'Числительные', 'Zahlwörter', 'Numbers'),
('telling-time', 'de', 'A1', 'numbers', 'Время и даты', 'Uhrzeit und Datum', 'Telling the time and dates'),
-- Стиль
('polite-forms', 'de', 'A1', 'style', 'Вежливые формы: Sie и du', 'Höfliche Anrede: Sie und du', 'Polite forms: Sie and du'),
('academic-language', 'de', 'C1', 'style', 'Письменный и научный язык', 'Schriftsprache und Wissenschaftssprache', 'Written and academic German');
