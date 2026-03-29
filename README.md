# Projeto Univesp - TypeScript + SQLite

Aplicacao simples de lista para mercearia, com foco em uso facil para publico idoso.

## Arquitetura atual

- Backend em TypeScript (`src/server.ts`)
- Persistencia em SQLite local com `node:sqlite`
- Frontend (`index.html`) consome a API `GET/POST /dados`

> Observacao: `node:sqlite` pode exibir aviso de recurso experimental em algumas versoes do Node 22.

## Modelo de Dados

A tabela `recados` armazena itens que os clientes nao encontraram na loja:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | INTEGER | Chave primaria (auto-incremento) |
| nome | TEXT | Nome do item (ex.: "Arroz integral 5kg") |
| cliente | TEXT | Nome do cliente que solicitou (ex.: "João Silva") |
| data_adicionado | DATETIME | Data/hora do registro (auto-gerado no servidor) |

## Requisitos

- Node.js 22+
- npm

## Instalar dependencias

```bash
npm install
```

## Scripts

```bash
npm run dev       # Roda servidor TS com tsx (desenvolvimento)
npm run typecheck # Valida tipos sem gerar arquivos
npm run build     # Compila TypeScript -> JavaScript em dist/
npm run start     # Inicia servidor a partir de dist/server.js
```

## Como executar

1. Inicie o backend:

```bash
npm run dev
```

2. Abra `index.html` no navegador.
3. Adicione itens. Eles ficam salvos no arquivo SQLite em `data/recados.sqlite`.

## API

### GET /dados
Retorna lista de todos os itens em ordem decrescente de data:

```json
[
  {
    "id": 1,
    "nome": "Arroz integral",
    "cliente": "Maria",
    "data_adicionado": "2026-03-29 19:33:44"
  }
]
```

### POST /dados
Cria um novo item (campos obrigatorios: `nome`, `cliente`):

```json
{
  "nome": "Feijao carioca 1kg",
  "cliente": "Joao Silva"
}
```

Resposta: `{ "mensagem": "Salvo" }`

### DELETE /dados/:id
Remove um item da lista:

Resposta: `{ "mensagem": "Item removido" }`
