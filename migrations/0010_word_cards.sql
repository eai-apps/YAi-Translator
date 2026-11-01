-- Таблица вечного склада готовых карточек слов (этап 15Б)
CREATE TABLE IF NOT EXISTS word_cards (
  lemma TEXT NOT NULL,
  lang TEXT NOT NULL,
  explain_lang TEXT NOT NULL,
  card_json TEXT NOT NULL,
  provider TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (lemma, lang, explain_lang)
);

CREATE INDEX IF NOT EXISTS idx_word_cards_lookup ON word_cards (lang, explain_lang, lemma);
CREATE INDEX IF NOT EXISTS idx_word_cards_updated ON word_cards (updated_at);
