// Banco SQLite rodando no navegador (sql.js / WebAssembly).
// O arquivo do banco fica salvo no IndexedDB deste navegador, neste dispositivo.

const SQL_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/";
const IDB_NOME = "pi-t6-g8";
const IDB_STORE = "arquivos";
const IDB_CHAVE = "pi-t6-g8.db";

// itens = pedidos dos clientes (o que nao encontraram na loja).
// produtos/compras/itens_venda = controle de estoque (estoque = compras - itens vendidos).
// vendas = cada venda (total e valor recebido); itens_venda = produtos de cada venda.
// Valores em dinheiro ficam em centavos (inteiros) para evitar erros de arredondamento.
const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cliente TEXT NOT NULL,
    data_adicionado TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL COLLATE NOCASE,
    marca TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
    preco_centavos INTEGER,
    UNIQUE (nome, marca)
  );

  CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    data TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_centavos INTEGER,
    recebido_centavos INTEGER,
    data TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS itens_venda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venda_id INTEGER NOT NULL REFERENCES vendas(id),
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_centavos INTEGER
  );
`;

const SELECT_ALL = "SELECT id, nome, cliente, data_adicionado FROM itens ORDER BY data_adicionado DESC, id DESC";
const INSERT = "INSERT INTO itens (nome, cliente) VALUES (?, ?)";
const DELETE = "DELETE FROM itens WHERE id = ?";
const SELECT_PRODUTOS = `
  SELECT p.id, p.nome, p.marca, p.preco_centavos,
    COALESCE((SELECT SUM(quantidade) FROM compras WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM itens_venda WHERE produto_id = p.id), 0) AS estoque
  FROM produtos p
  ORDER BY p.nome, p.marca
`;
const INSERT_PRODUTO = "INSERT OR IGNORE INTO produtos (nome, marca) VALUES (?, ?)";
const SELECT_PRODUTO_ID = "SELECT id FROM produtos WHERE nome = ? AND marca = ?";
const UPDATE_PRECO = "UPDATE produtos SET preco_centavos = ? WHERE id = ?";
const INSERT_COMPRA = "INSERT INTO compras (produto_id, quantidade) VALUES (?, ?)";
const INSERT_VENDA = "INSERT INTO vendas (total_centavos, recebido_centavos) VALUES (?, ?)";
const INSERT_ITEM_VENDA = "INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_centavos) VALUES (?, ?, ?, ?)";
const ULTIMAS_VENDAS = "SELECT id FROM vendas ORDER BY data DESC, id DESC LIMIT 50";
const SELECT_VENDAS = `
  SELECT id, data, total_centavos, recebido_centavos
  FROM vendas
  WHERE id IN (${ULTIMAS_VENDAS})
  ORDER BY data DESC, id DESC
`;
const SELECT_ITENS_VENDAS = `
  SELECT i.venda_id, i.quantidade, i.preco_centavos, p.nome, p.marca
  FROM itens_venda i JOIN produtos p ON p.id = i.produto_id
  WHERE i.venda_id IN (${ULTIMAS_VENDAS})
  ORDER BY i.id
`;
const DELETE_ITENS_VENDA = "DELETE FROM itens_venda WHERE venda_id = ?";
const DELETE_VENDA = "DELETE FROM vendas WHERE id = ?";

let SQL;
let db;

function abrirIndexedDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NOME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function lerArquivo() {
    const idb = await abrirIndexedDB();
    return new Promise((resolve, reject) => {
        const req = idb.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(IDB_CHAVE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function gravarArquivo(bytes) {
    const idb = await abrirIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(bytes, IDB_CHAVE);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function salvarBanco() {
    await gravarArquivo(db.export());
}

function colunas(tabela) {
    return consultar(`PRAGMA table_info(${tabela})`).map((coluna) => coluna.name);
}

// Cria as tabelas e atualiza bancos de versoes anteriores. Retorna true se algo foi migrado.
function prepararBanco() {
    // Versao anterior: uma linha em "vendas" por produto vendido, sem preco.
    const vendasAntigas = colunas("vendas").includes("produto_id");
    const semPreco = colunas("produtos").length > 0 && !colunas("produtos").includes("preco_centavos");

    db.run("BEGIN");
    try {
        if (vendasAntigas) {
            db.run("ALTER TABLE vendas RENAME TO vendas_antigas");
        }
        db.run(CREATE_TABLES);
        if (semPreco) {
            db.run("ALTER TABLE produtos ADD COLUMN preco_centavos INTEGER");
        }
        if (vendasAntigas) {
            db.run("INSERT INTO vendas (id, data) SELECT id, data FROM vendas_antigas");
            db.run(`INSERT INTO itens_venda (venda_id, produto_id, quantidade)
                    SELECT id, produto_id, quantidade FROM vendas_antigas`);
            db.run("DROP TABLE vendas_antigas");
        }
        db.run("COMMIT");
    } catch (erro) {
        db.run("ROLLBACK");
        throw erro;
    }
    return vendasAntigas || semPreco;
}

async function iniciarBanco() {
    SQL = await initSqlJs({ locateFile: (arquivo) => SQL_JS_CDN + arquivo });
    const bytes = await lerArquivo();
    db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    if (prepararBanco()) {
        await salvarBanco();
    }

    // Pede ao navegador para nao apagar os dados quando faltar espaco.
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }
}

const bancoPronto = iniciarBanco();

function consultar(sql, params = []) {
    const linhas = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
        linhas.push(stmt.getAsObject());
    }
    stmt.free();
    return linhas;
}

async function listarItens() {
    await bancoPronto;
    return consultar(SELECT_ALL);
}

async function listarProdutos() {
    await bancoPronto;
    return consultar(SELECT_PRODUTOS);
}

async function adicionarItem(nome, cliente) {
    await bancoPronto;
    db.run(INSERT, [nome, cliente]);
    await salvarBanco();
}

async function removerItemDoBanco(id) {
    await bancoPronto;
    db.run(DELETE, [id]);
    await salvarBanco();
}

// Executa as alteracoes de uma vez so (tudo ou nada) e salva o banco.
async function emTransacao(alteracoes) {
    await bancoPronto;
    db.run("BEGIN");
    try {
        alteracoes();
        db.run("COMMIT");
    } catch (erro) {
        db.run("ROLLBACK");
        throw erro;
    }
    await salvarBanco();
}

// produto.id = produto ja cadastrado; sem id, cadastra (ou reaproveita) o produto nome/marca.
function idDoProduto(produto) {
    if (produto.id) {
        return produto.id;
    }
    db.run(INSERT_PRODUTO, [produto.nome, produto.marca]);
    return consultar(SELECT_PRODUTO_ID, [produto.nome, produto.marca])[0].id;
}

// Registra a compra de um pedido e remove o pedido da lista.
async function registrarCompra(itemId, produto, quantidade) {
    await emTransacao(() => {
        db.run(INSERT_COMPRA, [idDoProduto(produto), quantidade]);
        db.run(DELETE, [itemId]);
    });
}

// itens = [{ produto, quantidade, precoCentavos }]. recebidoCentavos pode ser null (ex.: Pix ou cartao).
// O preco usado passa a ser o preco atual do produto.
async function finalizarVenda(itens, recebidoCentavos) {
    const total = itens.reduce((soma, item) => soma + item.quantidade * item.precoCentavos, 0);
    await emTransacao(() => {
        db.run(INSERT_VENDA, [total, recebidoCentavos]);
        const vendaId = consultar("SELECT last_insert_rowid() AS id")[0].id;
        itens.forEach((item) => {
            const produtoId = idDoProduto(item.produto);
            db.run(UPDATE_PRECO, [item.precoCentavos, produtoId]);
            db.run(INSERT_ITEM_VENDA, [vendaId, produtoId, item.quantidade, item.precoCentavos]);
        });
    });
}

// Ultimas 50 vendas, cada uma com a lista dos seus itens.
async function listarVendas() {
    await bancoPronto;
    const vendas = consultar(SELECT_VENDAS).map((venda) => ({ ...venda, itens: [] }));
    const porId = new Map(vendas.map((venda) => [venda.id, venda]));
    consultar(SELECT_ITENS_VENDAS).forEach((item) => porId.get(item.venda_id).itens.push(item));
    return vendas;
}

async function removerVenda(id) {
    await emTransacao(() => {
        db.run(DELETE_ITENS_VENDA, [id]);
        db.run(DELETE_VENDA, [id]);
    });
}

// Baixa o arquivo .db (backup ou para levar a lista para outro dispositivo).
async function exportarBanco() {
    await bancoPronto;
    const blob = new Blob([db.export()], { type: "application/vnd.sqlite3" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lista-mercearia-${new Date().toISOString().slice(0, 10)}.db`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Substitui o banco atual pelo arquivo .db escolhido.
async function importarBanco(arquivo) {
    await bancoPronto;
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const novoDb = new SQL.Database(bytes);
    try {
        novoDb.exec("SELECT id, nome, cliente, data_adicionado FROM itens LIMIT 1"); // valida o arquivo
    } catch (erro) {
        novoDb.close();
        throw erro;
    }
    db.close();
    db = novoDb;
    prepararBanco(); // backups antigos podem nao ter as tabelas novas
    await salvarBanco();
}

const FORMATO_REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarReais(centavos) {
    return centavos == null ? "-" : FORMATO_REAIS.format(centavos / 100);
}

// Le um valor digitado ("5,50", "5.50", "R$ 1.234,56") e devolve em centavos; null se invalido ou vazio.
function lerReais(texto) {
    let limpo = String(texto).replace(/R\$|\s/g, "");
    if (limpo.includes(",")) {
        limpo = limpo.replace(/\./g, "").replace(",", ".");
    }
    if (limpo === "") return null;
    const valor = Number(limpo);
    return Number.isFinite(valor) && valor >= 0 ? Math.round(valor * 100) : null;
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
