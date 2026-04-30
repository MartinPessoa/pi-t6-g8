const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PASSWORD = '123';

const db = new Client({
    database: 'teste',
    user: 'postgres',
    password: PASSWORD // ajuste sua senha, se necessário
});

// Conecta ao banco e garante que a tabela exista
(async () => {
    try {
        await db.connect();
        await db.query(`
            CREATE TABLE IF NOT EXISTS recados (
                id SERIAL PRIMARY KEY,
                nome TEXT,
                cliente TEXT,
                data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Conectado ao banco e tabela recados pronta.');
    } catch (err) {
        console.error('Erro ao conectar ao banco:', err);
    }
})();

http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Serve HTML files
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Erro ao carregar página');
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
            }
        });
    } else if (req.url === '/list' || req.url === '/list.html') {
        fs.readFile(path.join(__dirname, 'list.html'), (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Erro ao carregar página');
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
            }
        });
    } else if (req.url === '/dados' && req.method === 'GET') {
        try {
            const result = await db.query('SELECT * FROM recados ORDER BY id DESC');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.rows));
        } catch (err) {
            console.error('Erro ao buscar recados:', err);
            res.statusCode = 500;
            res.end('Erro ao buscar recados');
        }
    } else if (req.url === '/dados' && req.method === 'POST') {
        let corpo = '';
        req.on('data', c => corpo += c);
        req.on('end', async () => {
            try {
                const { nome, cliente } = JSON.parse(corpo || '{}');
                await db.query(
                    'INSERT INTO recados (nome, cliente) VALUES ($1, $2)',
                    [nome, cliente]
                );
                res.end('Salvo');
            } catch (err) {
                console.error('Erro ao salvar recado:', err);
                res.statusCode = 500;
                res.end('Erro ao salvar recado');
            }
        });
    } else if (req.url.startsWith('/dados/') && req.method === 'DELETE') {
        const id = req.url.split('/')[2];
        try {
            await db.query('DELETE FROM recados WHERE id = $1', [id]);
            res.end('Removido');
        } catch (err) {
            console.error('Erro ao remover recado:', err);
            res.statusCode = 500;
            res.end('Erro ao remover recado');
        }
    } else {
        res.statusCode = 404;
        res.end('Rota não encontrada');
    }
}).listen(3000, () => console.log("Rodando na porta 3000"));