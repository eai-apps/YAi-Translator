-- Этап 9: состояние проверок моделей платных подключений нейросетей сайта
CREATE TABLE IF NOT EXISTS paid_model_state (
  connection_id TEXT NOT NULL,
  model TEXT NOT NULL,
  ok INTEGER NOT NULL,
  latency_ms INTEGER,
  reply TEXT,
  error TEXT,
  checked_at INTEGER NOT NULL,
  PRIMARY KEY (connection_id, model)
);

CREATE INDEX IF NOT EXISTS idx_paid_model_state_conn ON paid_model_state (connection_id);
