// Banco SQLite rodando no navegador (sql.js / WebAssembly).
// O arquivo do banco fica salvo no IndexedDB deste navegador, neste dispositivo.

const SQL_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/";
const IDB_NOME = "pi-t6-g8";
const IDB_STORE = "arquivos";
const IDB_CHAVE = "pi-t6-g8.db";

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cliente TEXT NOT NULL,
    data_adicionado TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  )
`;

const SELECT_ALL = "SELECT id, nome, cliente, data_adicionado FROM itens ORDER BY data_adicionado DESC, id DESC";
const INSERT = "INSERT INTO itens (nome, cliente) VALUES (?, ?)";
const DELETE = "DELETE FROM itens WHERE id = ?";

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

async function iniciarBanco() {
    SQL = await initSqlJs({ locateFile: (arquivo) => SQL_JS_CDN + arquivo });
    const bytes = await lerArquivo();
    db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    db.run(CREATE_TABLE);

    // Pede ao navegador para nao apagar os dados quando faltar espaco.
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }
}

const bancoPronto = iniciarBanco();

async function listarItens() {
    await bancoPronto;
    const itens = [];
    const stmt = db.prepare(SELECT_ALL);
    while (stmt.step()) {
        itens.push(stmt.getAsObject());
    }
    stmt.free();
    return itens;
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
    await salvarBanco();
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
