/**
 * Автоматическая заливка списка тем справочника (файл генерируется из shared/grammarTopics.ts,
 * команда в README). Используется seedOnce в store.ts — вручную запускать не нужно.
 * Список совпадает с migrations/0005_grammar.sql: меняешь темы — меняй оба файла.
 */
export const GERMAN_GRAMMAR_SEED_SQL =
  "INSERT OR IGNORE INTO grammar_topics (slug, lang, level, category, title_ru, title_de, title_en) VALUES\n" +
  "('definite-articles', 'de', 'A1', 'articles', 'Определённый артикль der, die, das', 'Bestimmter Artikel', 'Definite articles'),\n" +
  "('indefinite-articles', 'de', 'A1', 'articles', 'Неопределённый артикль ein, eine, ein', 'Unbestimmter Artikel', 'Indefinite articles'),\n" +
  "('negative-article-kein', 'de', 'A1', 'articles', 'Отрицательный артикль kein', 'Negativartikel kein', 'Negative article kein'),\n" +
  "('possessive-articles', 'de', 'A1', 'articles', 'Притяжательные артикли mein, dein, sein …', 'Possessivartikel', 'Possessive articles'),\n" +
  "('noun-gender', 'de', 'A1', 'nouns', 'Род существительных', 'Genus der Substantive', 'Noun gender'),\n" +
  "('noun-plurals', 'de', 'A1', 'nouns', 'Множественное число существительных', 'Plural der Substantive', 'Noun plurals'),\n" +
  "('n-declension', 'de', 'A2', 'nouns', 'n-склонение (слабое склонение существительных)', 'n-Deklination', 'n-declension (weak nouns)'),\n" +
  "('cases-overview', 'de', 'A1', 'cases', 'Падежи: обзор', 'Die vier Fälle', 'The four cases'),\n" +
  "('nominativ', 'de', 'A1', 'cases', 'Nominativ', 'Nominativ', 'Nominative'),\n" +
  "('akkusativ', 'de', 'A1', 'cases', 'Akkusativ', 'Akkusativ', 'Accusative'),\n" +
  "('dativ', 'de', 'A1', 'cases', 'Dativ', 'Dativ', 'Dative'),\n" +
  "('genitiv', 'de', 'B1', 'cases', 'Genitiv', 'Genitiv', 'Genitive'),\n" +
  "('adjectives-overview', 'de', 'A2', 'adjectives', 'Прилагательные: как они работают', 'Adjektive: Grundlagen', 'Adjectives: basics'),\n" +
  "('weak-declension', 'de', 'A2', 'adjectives', 'Слабое склонение прилагательных', 'Schwache Adjektivdeklination', 'Weak adjective declension'),\n" +
  "('strong-declension', 'de', 'A2', 'adjectives', 'Сильное склонение прилагательных', 'Starke Adjektivdeklination', 'Strong adjective declension'),\n" +
  "('mixed-declension', 'de', 'A2', 'adjectives', 'Смешанное склонение прилагательных', 'Gemischte Adjektivdeklination', 'Mixed adjective declension'),\n" +
  "('adjective-comparison', 'de', 'A2', 'adjectives', 'Степени сравнения прилагательных', 'Komparativ und Superlativ', 'Comparison of adjectives'),\n" +
  "('personal-pronouns', 'de', 'A1', 'pronouns', 'Личные местоимения', 'Personalpronomen', 'Personal pronouns'),\n" +
  "('reflexive-pronouns', 'de', 'A2', 'pronouns', 'Возвратные местоимения', 'Reflexivpronomen', 'Reflexive pronouns'),\n" +
  "('demonstrative-pronouns', 'de', 'B1', 'pronouns', 'Указательные местоимения', 'Demonstrativpronomen', 'Demonstrative pronouns'),\n" +
  "('relative-pronouns', 'de', 'B1', 'pronouns', 'Относительные местоимения', 'Relativpronomen', 'Relative pronouns'),\n" +
  "('indefinite-pronouns', 'de', 'A2', 'pronouns', 'Неопределённые местоимения man, jemand, nichts', 'Indefinitpronomen', 'Indefinite pronouns'),\n" +
  "('praesens', 'de', 'A1', 'tenses', 'Präsens: настоящее время', 'Präsens', 'Present tense'),\n" +
  "('perfekt', 'de', 'A1', 'tenses', 'Perfekt', 'Perfekt', 'Perfect tense'),\n" +
  "('perfekt-haben-sein', 'de', 'A2', 'tenses', 'Perfekt с haben и sein', 'Perfekt mit haben und sein', 'Perfect with haben and sein'),\n" +
  "('praeteritum', 'de', 'A2', 'tenses', 'Präteritum', 'Präteritum', 'Simple past'),\n" +
  "('plusquamperfekt', 'de', 'B1', 'tenses', 'Plusquamperfekt', 'Plusquamperfekt', 'Past perfect'),\n" +
  "('futur-1', 'de', 'A2', 'tenses', 'Futur I', 'Futur I', 'Future I'),\n" +
  "('futur-2', 'de', 'B1', 'tenses', 'Futur II', 'Futur II', 'Future II'),\n" +
  "('partizip-2', 'de', 'A2', 'tenses', 'Partizip II', 'Partizip II', 'Past participle'),\n" +
  "('tenses-overview', 'de', 'A2', 'tenses', 'Все времена: что и когда', 'Zeiten im Überblick', 'Tenses at a glance'),\n" +
  "('konjunktiv-1', 'de', 'B2', 'moods', 'Konjunktiv I: косвенная речь', 'Konjunktiv I', 'Subjunctive I'),\n" +
  "('konjunktiv-2', 'de', 'B1', 'moods', 'Konjunktiv II: сослагательное наклонение', 'Konjunktiv II', 'Subjunctive II'),\n" +
  "('konjunktiv-2-wuerde', 'de', 'B1', 'moods', 'Konjunktiv II с würde', 'Konjunktiv II mit würde', 'Subjunctive II with würde'),\n" +
  "('konjunktiv-2-haette-waere', 'de', 'B1', 'moods', 'Konjunktiv II: hätte и wäre', 'Konjunktiv II: hätte, wäre', 'Subjunctive II: hätte, wäre'),\n" +
  "('konjunktiv-2-modal', 'de', 'B2', 'moods', 'Konjunktiv II модальных глаголов', 'Konjunktiv II der Modalverben', 'Subjunctive II of modal verbs'),\n" +
  "('imperativ', 'de', 'A1', 'moods', 'Повелительное наклонение', 'Imperativ', 'Imperative'),\n" +
  "('indirekte-rede', 'de', 'B2', 'moods', 'Косвенная речь', 'Indirekte Rede', 'Reported speech'),\n" +
  "('passiv', 'de', 'B1', 'voice', 'Passiv: обзор', 'Passiv', 'Passive voice'),\n" +
  "('vorgangspassiv', 'de', 'B1', 'voice', 'Vorgangspassiv: действие', 'Vorgangspassiv', 'Process passive'),\n" +
  "('zustandspassiv', 'de', 'B2', 'voice', 'Zustandspassiv: состояние', 'Zustandspassiv', 'State passive'),\n" +
  "('modalverben', 'de', 'A1', 'verbs', 'Модальные глаголы', 'Modalverben', 'Modal verbs'),\n" +
  "('reflexive-verbs', 'de', 'A2', 'verbs', 'Возвратные глаголы', 'Reflexive Verben', 'Reflexive verbs'),\n" +
  "('separable-verbs', 'de', 'A2', 'verbs', 'Отделяемые приставки', 'Trennbare Verben', 'Separable verbs'),\n" +
  "('inseparable-verbs', 'de', 'A2', 'verbs', 'Неотделяемые приставки', 'Untrennbare Verben', 'Inseparable verbs'),\n" +
  "('strong-verbs', 'de', 'A2', 'verbs', 'Сильные и неправильные глаголы', 'Starke und unregelmäßige Verben', 'Strong and irregular verbs'),\n" +
  "('verbs-with-prepositions', 'de', 'B1', 'verbs', 'Глаголы с предлогами', 'Verben mit Präpositionen', 'Verbs with prepositions'),\n" +
  "('word-order-main-clause', 'de', 'A1', 'syntax', 'Порядок слов в главном предложении', 'Wortstellung im Hauptsatz', 'Word order in main clauses'),\n" +
  "('word-order-subordinate', 'de', 'A2', 'syntax', 'Порядок слов в придаточном предложении', 'Wortstellung im Nebensatz', 'Word order in subordinate clauses'),\n" +
  "('word-order-questions', 'de', 'A1', 'syntax', 'Порядок слов в вопросах', 'Wortstellung in Fragen', 'Word order in questions'),\n" +
  "('tekamolo', 'de', 'A2', 'syntax', 'TeKaMoLo: порядок обстоятельств', 'TeKaMoLo', 'TeKaMoLo'),\n" +
  "('negation-nicht-kein', 'de', 'A1', 'syntax', 'Отрицание nicht и kein', 'Verneinung mit nicht und kein', 'Negation with nicht and kein'),\n" +
  "('relative-clauses', 'de', 'B1', 'syntax', 'Относительные придаточные', 'Relativsätze', 'Relative clauses'),\n" +
  "('infinitive-with-zu', 'de', 'A2', 'syntax', 'Инфинитив с zu', 'Infinitiv mit zu', 'Infinitive with zu'),\n" +
  "('conjunctions-weil-denn-da', 'de', 'A2', 'conjunctions', 'weil, denn, da: причины', 'weil, denn, da', 'weil, denn, da (reason)'),\n" +
  "('conjunctions-obwohl-trotzdem', 'de', 'B1', 'conjunctions', 'obwohl и trotzdem: уступка', 'obwohl und trotzdem', 'obwohl and trotzdem (concession)'),\n" +
  "('conjunctions-dass', 'de', 'A2', 'conjunctions', 'Союз dass', 'dass', 'The conjunction dass'),\n" +
  "('conjunctions-ob', 'de', 'A2', 'conjunctions', 'Косвенный вопрос с ob', 'Indirekte Frage mit ob', 'Indirect question with ob'),\n" +
  "('conjunctions-wenn-als', 'de', 'A2', 'conjunctions', 'wenn и als: когда', 'wenn und als', 'wenn and als (when)'),\n" +
  "('conjunctions-damit-um-zu', 'de', 'B1', 'conjunctions', 'damit и um … zu: цель', 'damit und um … zu', 'damit and um … zu (purpose)'),\n" +
  "('conjunctions-overview', 'de', 'B1', 'conjunctions', 'Союзы: обзор и альтернативы', 'Konjunktionen im Überblick', 'Conjunctions overview'),\n" +
  "('prepositions-akkusativ', 'de', 'A1', 'prepositions', 'Предлоги с Akkusativ', 'Präpositionen mit Akkusativ', 'Prepositions with the accusative'),\n" +
  "('prepositions-dativ', 'de', 'A1', 'prepositions', 'Предлоги с Dativ', 'Präpositionen mit Dativ', 'Prepositions with the dative'),\n" +
  "('wechselpraepositionen', 'de', 'A2', 'prepositions', 'Wechselpräpositionen: Wo? и Wohin?', 'Wechselpräpositionen', 'Two-way prepositions'),\n" +
  "('prepositions-genitiv', 'de', 'B1', 'prepositions', 'Предлоги с Genitiv', 'Präpositionen mit Genitiv', 'Prepositions with the genitive'),\n" +
  "('numbers', 'de', 'A1', 'numbers', 'Числительные', 'Zahlwörter', 'Numbers'),\n" +
  "('telling-time', 'de', 'A1', 'numbers', 'Время и даты', 'Uhrzeit und Datum', 'Telling the time and dates'),\n" +
  "('polite-forms', 'de', 'A1', 'style', 'Вежливые формы: Sie и du', 'Höfliche Anrede: Sie und du', 'Polite forms: Sie and du'),\n" +
  "('academic-language', 'de', 'C1', 'style', 'Письменный и научный язык', 'Schriftsprache und Wissenschaftssprache', 'Written and academic German')";
