# Projeto Integrador - Univesp
## Turma 6 - Grupo 8
- HTML + JavaScript + SQLite (no navegador)

Aplicacao simples de lista para mercearia, com foco em uso facil para publico idoso.

## Arquitetura

- Site estatico, sem servidor: `index.html` (pedidos e compras), `list.html` (lista com ordenacao) e `vendas.html` (vendas)
- Banco SQLite rodando no proprio navegador via [sql.js](https://sql.js.org) (SQLite compilado para WebAssembly)
- `db.js` concentra o acesso ao banco (pedidos, produtos, compras, vendas, backup)
- `produtos.js`: seletor de produto com busca, usado em compras e vendas
- `nav.js`: barra de navegacao compartilhada
- O arquivo do banco e salvo no IndexedDB do navegador apos cada alteracao

### Limitacao importante

Os dados ficam **somente no navegador e dispositivo** onde foram cadastrados.
Outro computador, outro navegador ou uma janela anonima mostram uma lista vazia, e limpar os dados do
navegador apaga a lista. Por isso a pagina inicial tem os botoes **Exportar backup** (baixa o arquivo `.db`)
e **Importar backup** (restaura um `.db`, inclusive em outro dispositivo).

O uso previsto e um unico dispositivo na mercearia (ex.: um computador ou tablet no balcao).

## Modelo de Dados

A tabela `itens` (ver `banco.sql`) armazena itens que os clientes nao encontraram na loja:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | INTEGER | Chave primaria (autoincremento) |
| nome | TEXT | Nome do item (ex.: "Arroz integral 5kg") |
| cliente | TEXT | Nome do cliente que solicitou (ex.: "Joao Silva") |
| data_adicionado | TEXT | Data/hora do registro em UTC (ISO 8601, gerada pelo banco) |

Controle de estoque (estoque de um produto = soma das compras - soma das vendas):

| Tabela | Campos | Descricao |
|--------|--------|-----------|
| produtos | id, nome, marca | Produtos da loja. Nome e marca separados; par (nome, marca) unico, sem diferenciar maiusculas |
| compras | id, produto_id, quantidade, data | Registrada ao clicar em **Comprei** em um pedido (o pedido sai da lista) |
| vendas | id, produto_id, quantidade, data | Registrada pela pagina **Vendas** |

Nao existe tela de cadastro de produtos: ao registrar uma compra ou venda, o dono informa a quantidade, digita o produto e a pagina mostra
os produtos parecidos ja cadastrados (busca com [Fuse.js](https://www.fusejs.io), tolerante a erros de digitacao,
maiusculas e acentos). Cada produto mostrado e um botao que ja salva;
o botao **Novo produto** cadastra o que foi digitado (so aparece se ainda nao existir um produto com o mesmo nome e marca).

O arquivo exportado e um banco SQLite comum e pode ser aberto em qualquer ferramenta (ex.: DB Browser for SQLite).

## Executar localmente

O WebAssembly nao carrega abrindo o arquivo direto (`file://`), entao use qualquer servidor estatico:

```bash
npx serve .
```

Abra no navegador o endereco mostrado (ex.: `http://localhost:3000`).

## Publicacao (gratuita)

Por ser um site estatico, pode ser publicado no **GitHub Pages**:

1. No GitHub: Settings > Pages
2. Source: "Deploy from a branch", branch `main`, pasta `/ (root)`
3. O site fica em `https://<usuario>.github.io/<repositorio>/`

Alternativas gratuitas: Azure Static Web Apps (plano Free) ou Firebase Hosting.
