-- Esquema do banco SQLite (criado automaticamente pelo db.js no navegador)
CREATE TABLE IF NOT EXISTS itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  data_adicionado TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
