## Projeto Univesp – Node.js + PostgreSQL

Aplicação simples em Node.js que expõe um servidor HTTP na porta **3000** e se conecta a um banco PostgreSQL chamado **`teste`** para salvar e listar recados.

### 1. Pré‑requisitos

- **Sistema operacional**: Linux (testado no Ubuntu 24.04)
- **Node.js**: versão 18 ou superior (você está usando 24.x)
- **npm**: vem junto com o Node
- **PostgreSQL**: versão 12+ (testado na 16.x)
- Acesso a um terminal com permissões de `sudo`

#### 1.1 Instalar Node.js e npm (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y nodejs npm

# opcional: conferir versões
node -v
npm -v
```

#### 1.2 Instalar PostgreSQL (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# conferir se o serviço está rodando
sudo systemctl status postgresql
```

### 2. Clonar / baixar o projeto

Coloque este projeto em algum diretório, por exemplo:

```bash
git clone <URL_DO_REPO> Univesp   # se estiver usando git
cd Univesp
```

### 3. Instalar dependências do Node

Na pasta raiz do projeto (onde está o `package.json`):

```bash
npm install
```

Isso instalará, entre outros, o pacote `pg` (cliente PostgreSQL para Node.js).

### 4. Configurar o PostgreSQL

#### 4.1 Definir/alterar a senha do usuário `postgres`

Entre no `psql` como usuário de sistema `postgres`:

```bash
sudo -u postgres psql
```

No prompt `postgres=#`, defina uma senha para o usuário `postgres` (escolha uma senha forte):

```sql
ALTER USER postgres WITH PASSWORD 'SUA_SENHA_AQUI';
```

Anote essa senha; você usará no código.

Saia do `psql`:

```sql
\q
```

#### 4.2 Criar o banco de dados `teste`

Entre novamente no `psql`:

```bash
sudo -u postgres psql
```

No prompt:

```sql
CREATE DATABASE teste;
\q
```

### 5. Configurar a senha no código

Abra o arquivo `server.js` e localize a criação do cliente do Postgres:

```js
const db = new Client({
    database: 'teste',
    user: 'postgres',
    password: '123' // ajuste sua senha, se necessário
});
```

Substitua o valor de `password` pela senha que você definiu para o usuário `postgres` (por exemplo, `SUA_SENHA_AQUI`).

### 6. (Opcional) Criar a tabela manualmente

O código já tenta garantir que a tabela exista com:

```sql
CREATE TABLE IF NOT EXISTS recados (nome TEXT);
```

Se preferir criar manualmente:

```bash
sudo -u postgres psql
```

No `psql`:

```sql
\c teste;
CREATE TABLE recados (nome TEXT);
\dt
\q
```

### 7. Rodar o servidor

Na pasta do projeto:

```bash
npm run start
```

Você deve ver no terminal algo como:

```text
Conectado ao banco e tabela recados pronta.
Rodando na porta 3000
```

O servidor estará ouvindo em `http://localhost:3000`.

### 8. Testar a API

#### 8.1 Inserir um recado (POST `/dados`)

Via `curl`:

```bash
curl -X POST http://localhost:3000/dados \
  -H "Content-Type: application/json" \
  -d '{"nome":"oi"}'
```

Resposta esperada:

```text
Salvo
```

#### 8.2 Listar recados (GET `/dados`)

```bash
curl http://localhost:3000/dados
```

Resposta esperada (JSON):

```json
[{"nome":"oi"}]
```

### 9. Usar com o `index.html`

Abra o arquivo `index.html` no navegador (por exemplo, com a extensão Live Server ou com um servidorzinho simples) e certifique‑se de que o backend já está rodando (`npm run start`).  
O HTML fará requisições para `http://localhost:3000/dados` para buscar/enviar dados.

### 10. Problemas comuns

- **`password authentication failed for user "postgres"`**  
  - Verifique se a senha definida no `ALTER USER` é a mesma que está em `server.js` na propriedade `password`.

- **`database "teste" does not exist`**  
  - Certifique‑se de ter rodado `CREATE DATABASE teste;` no `psql`.

- **`relation "recados" does not exist`**  
  - Verifique se a tabela foi criada (`CREATE TABLE recados (nome TEXT);`) no banco `teste`.

- **`curl: (52) Empty reply from server` ou `ERR_CONNECTION_REFUSED`**  
  - Veja o terminal onde o `npm run start` está rodando; provavelmente o servidor caiu com alguma exceção. Corrija o erro (senha, banco, tabela) e rode `npm run start` novamente.

