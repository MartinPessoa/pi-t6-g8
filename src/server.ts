import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

type Recado = {
  id?: number;
  nome: string;
  cliente: string;
  data_adicionado?: string;
};

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "recados.sqlite");

mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS recados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cliente TEXT NOT NULL,
    data_adicionado DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const selectRecadosStmt = db.prepare("SELECT id, nome, cliente, data_adicionado FROM recados ORDER BY data_adicionado DESC");
const insertRecadoStmt = db.prepare("INSERT INTO recados (nome, cliente) VALUES (?, ?)");
const deleteRecadoStmt = db.prepare("DELETE FROM recados WHERE id = ?");

function applyCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

createServer(async (req, res) => {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/dados" && req.method === "GET") {
    const dados = selectRecadosStmt.all() as unknown as Recado[];
    sendJson(res, 200, dados);
    return;
  }

  if (req.url === "/dados" && req.method === "POST") {
    try {
      const body = (await readJsonBody(req)) as Partial<Recado>;
      const nome = typeof body.nome === "string" ? body.nome.trim() : "";
      const cliente = typeof body.cliente === "string" ? body.cliente.trim() : "";

      if (!nome || !cliente) {
        sendJson(res, 400, { erro: "Campos 'nome' e 'cliente' sao obrigatorios." });
        return;
      }

      insertRecadoStmt.run(nome, cliente);
      sendJson(res, 201, { mensagem: "Salvo" });
    } catch {
      sendJson(res, 400, { erro: "JSON invalido." });
    }

    return;
  }

  const deleteMatch = req.url?.match(/^\/dados\/(\d+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const id = parseInt(deleteMatch[1], 10);
    deleteRecadoStmt.run(id);
    sendJson(res, 200, { mensagem: "Item removido" });
    return;
  }

  sendJson(res, 404, { erro: "Rota nao encontrada" });
}).listen(PORT, () => {
  console.log(`Servidor TypeScript rodando na porta ${PORT}`);
});

