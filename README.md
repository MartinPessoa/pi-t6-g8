# Projeto Integrador - Univesp
## Turma 6 - Grupo 8
- TypeScript + PostgreSQL

Aplicacao simples de lista para mercearia, com foco em uso facil para publico idoso.

## Arquitetura atual

- Backend em TypeScript (`src/server.ts`)
- Persistencia em PostgreSQL com `pg`
- Frontend (`index.html`) consumindo a API `GET/POST/DELETE /dados`

## Modelo de Dados

A tabela `itens` armazena itens que os clientes nao encontraram na loja:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | SERIAL | Chave primaria |
| nome | TEXT | Nome do item (ex.: "Arroz integral 5kg") |
| cliente | TEXT | Nome do cliente que solicitou (ex.: "Joao Silva") |
| data_adicionado | TIMESTAMP | Data/hora do registro (auto-gerado pelo banco) |

## Requisitos

- Node.js 18+
- npm
- PostgreSQL local (para desenvolvimento)

## Instalar dependencias

```bash
npm install
```

## Configurar ambiente local

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Ajuste `DATABASE_URL` no `.env` para o seu PostgreSQL local.

Exemplo:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pi_t6_g8
PORT=3000
NODE_ENV=development
PGSSL=false
AUTO_CREATE_DB=true
```

Se voce usar variaveis `PG*` (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`), o servidor tenta criar automaticamente o banco informado em `PGDATABASE` no startup (somente ambiente local).

## Scripts

```bash
npm run dev       # Roda servidor TS com tsx
npm run typecheck # Valida tipos sem gerar arquivos
npm run build     # Compila TypeScript -> JavaScript em dist/
npm run start     # Inicia servidor compilado
```

## Executar localmente

```bash
npm run dev
```

Abra no navegador:

```text
http://localhost:3000
```

Na primeira execucao, o backend cria automaticamente a tabela `itens` se ela nao existir.

## Deploy no Render

No servico Web do Render, configure as variaveis:

- `DATABASE_URL`: URL do PostgreSQL gerenciado no Render
- `NODE_ENV=production`
- `PORT` (normalmente fornecida pelo Render)
- `PGSSL=true` (se a conexao exigir SSL)

Com isso, o mesmo codigo funciona localmente e em producao sem trocar query ou credencial no codigo.

## API

### GET /dados

Retorna todos os itens em ordem decrescente de data.

### POST /dados

Cria um novo item. Campos obrigatorios: `nome`, `cliente`.

Exemplo:

```json
{
  "nome": "Feijao carioca 1kg",
  "cliente": "Joao Silva"
}
```

### DELETE /dados/:id

Remove um item por ID.
