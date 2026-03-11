const http = require('http');
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
        await db.query('CREATE TABLE IF NOT EXISTS recados (nome TEXT)');
        console.log('Conectado ao banco e tabela recados pronta.');
    } catch (err) {
        console.error('Erro ao conectar ao banco:', err);
    }
})();

http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite que o HTML acesse o servidor
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.url === '/dados' && req.method === 'GET') {
        try {
            const result = await db.query('SELECT * FROM recados');
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
                const { nome } = JSON.parse(corpo || '{}');
                await db.query('INSERT INTO recados (nome) VALUES ($1)', [nome]);
                res.end('Salvo');
            } catch (err) {
                console.error('Erro ao salvar recado:', err);
                res.statusCode = 500;
                res.end('Erro ao salvar recado');
            }
        });
    } else {
        res.statusCode = 404;
        res.end('Rota não encontrada');
    }
}).listen(3000, () => console.log("Rodando na porta 3000"));