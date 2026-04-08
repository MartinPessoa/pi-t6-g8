import "dotenv/config";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client, Pool } from "pg";

type Item = {
  id?: number;
  nome: string;
  cliente: string;
  data_adicionado?: string;
};

const PORT = Number(process.env.PORT) || 3000;
const INDEX_PATH = path.join(process.cwd(), "index.html");
const DATABASE_URL = process.env.DATABASE_URL;
const SHOULD_USE_SSL = process.env.PGSSL === "true" || process.env.NODE_ENV === "production";
const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT ? Number(process.env.PGPORT) : 5432;
const PGUSER = process.env.PGUSER;
const PGPASSWORD = process.env.PGPASSWORD;
const PGDATABASE = process.env.PGDATABASE;
const AUTO_CREATE_DB = process.env.AUTO_CREATE_DB !== "false";

let pool: Pool;

function isSafeDatabaseName(databaseName: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName);
}

async function ensureDatabaseExists(): Promise<void> {
  if (DATABASE_URL || !AUTO_CREATE_DB || process.env.NODE_ENV === "production") {
    return;
  }

  const databaseName = PGDATABASE;
  if (!databaseName) {
    return;
  }

  if (!isSafeDatabaseName(databaseName)) {
    throw new Error(`Nome de banco invalido para criacao automatica: ${databaseName}`);
  }

  const adminClient = new Client({
    host: PGHOST || "localhost",
    port: PGPORT,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: SHOULD_USE_SSL ? { rejectUnauthorized: false } : undefined
  });

  await adminClient.connect();
  try {
    const existsResult = await adminClient.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [databaseName]
    );

    if (!existsResult.rows[0]?.exists) {
      await adminClient.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`Banco '${databaseName}' criado automaticamente.`);
    }
  } finally {
    await adminClient.end();
  }
}

function buildPool(): Pool {
  if (DATABASE_URL) {
    return new Pool({
      connectionString: DATABASE_URL,
      ssl: SHOULD_USE_SSL ? { rejectUnauthorized: false } : undefined
    });
  }

  if (PGUSER || PGPASSWORD || PGDATABASE || PGHOST || process.env.PGPORT) {
    return new Pool({
      host: PGHOST || "localhost",
      port: PGPORT,
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE || "postgres",
      ssl: SHOULD_USE_SSL ? { rejectUnauthorized: false } : undefined
    });
  }

  throw new Error(
    "Configuracao de banco ausente. Defina DATABASE_URL ou PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE no .env"
  );
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS itens (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cliente TEXT NOT NULL,
    data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const SELECT_ALL = "SELECT id, nome, cliente, data_adicionado FROM itens ORDER BY data_adicionado DESC, id DESC";
const INSERT = "INSERT INTO itens (nome, cliente) VALUES ($1, $2)";
const DELETE = "DELETE FROM itens WHERE id = $1";

async function initializeDatabase(): Promise<void> {
  await pool.query(CREATE_TABLE);
}

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

const server = createServer(async (req, res) => {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/" && req.method === "GET") {
    try {
      const html = readFileSync(INDEX_PATH, "utf-8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
    } catch {
      sendJson(res, 500, { erro: "Nao foi possivel carregar index.html" });
    }
    return;
  }

  if (req.url === "/dados" && req.method === "GET") {
    try {
      const result = await pool.query<Item>(SELECT_ALL);
      const dados = result.rows;
      sendJson(res, 200, dados);
      return;
    } catch (error) {
      console.error("Excecao - GET /dados:", error);
      sendJson(res, 500, { erro: "Erro ao buscar dados" });
      return;
    }
  }

  if (req.url === "/dados" && req.method === "POST") {
    try {
      const body = (await readJsonBody(req)) as Partial<Item>;
      const nome = typeof body.nome === "string" ? body.nome.trim() : "";
      const cliente = typeof body.cliente === "string" ? body.cliente.trim() : "";

      if (!nome || !cliente) {
        sendJson(res, 400, { erro: "Campos 'nome' e 'cliente' sao obrigatorios." });
        return;
      }

      await pool.query(INSERT, [nome, cliente]);
      sendJson(res, 201, { mensagem: "Salvo" });
    } catch {
      sendJson(res, 400, { erro: "JSON invalido." });
    }

    return;
  }

  const deleteMatch = req.url?.match(/^\/dados\/(\d+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const id = parseInt(deleteMatch[1], 10);
    await pool.query(DELETE, [id]);
    sendJson(res, 200, { mensagem: "Item removido" });
    return;
  }

  sendJson(res, 404, { erro: "Rota nao encontrada" });
});

async function start(): Promise<void> {
  try {
    await ensureDatabaseExists();
    pool = buildPool();
    await initializeDatabase();
    server.listen(PORT, () => {
      console.log(`Servidor TypeScript rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao inicializar banco PostgreSQL:", error);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

