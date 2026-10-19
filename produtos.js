// Seletor de produto compartilhado (compras e vendas). Precisa do Fuse.js e do db.js.
// Enquanto o usuario digita nome/marca, mostra os produtos parecidos ja cadastrados.
// Cada produto e um botao que ja salva; o botao "Novo produto" cadastra o que foi digitado.

// Busca tolerante a erros de digitacao (ignora maiusculas e acentos).
// Nome e marca sao buscados separadamente para a marca nao "confundir" o nome.
const OPCOES_BUSCA = { threshold: 0.35, ignoreLocation: true, ignoreDiacritics: true };
const MAX_SUGESTOES = 8;

function textoProduto(produto) {
    return produto.marca ? `${produto.nome} – ${produto.marca}` : produto.nome;
}

// Igual ignorando maiusculas e acentos ("Pao" = "pão").
function mesmoTexto(a, b) {
    return a.localeCompare(b, "pt-BR", { sensitivity: "base" }) === 0;
}

// aoEscolher(produto) recebe um produto existente ({ id, nome, marca, estoque })
// ou um novo ({ id: null, nome, marca }).
function criarSeletorProduto({ nomeEl, marcaEl, dicaEl, listaEl, aoEscolher }) {
    let produtos = [];
    let buscaNome = new Fuse([], OPCOES_BUSCA);
    let buscaMarca = new Fuse([], OPCOES_BUSCA);

    listaEl.classList.add("lista-produtos");

    function buscarParecidos(nome, marca) {
        let encontrados = buscaNome.search(nome).map((r) => r.item);
        if (marca) {
            const comMarca = new Set(buscaMarca.search(marca).map((r) => r.item));
            encontrados = encontrados.filter((p) => comMarca.has(p));
        }
        return encontrados.slice(0, MAX_SUGESTOES);
    }

    function adicionarBotao(conteudo, classe, produto) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = classe;
        botao.innerHTML = conteudo;
        botao.addEventListener("click", async () => {
            // Evita salvar duas vezes com clique duplo.
            listaEl.querySelectorAll("button").forEach((b) => { b.disabled = true; });
            try {
                await aoEscolher(produto);
            } finally {
                listaEl.querySelectorAll("button").forEach((b) => { b.disabled = false; });
            }
        });
        const li = document.createElement("li");
        li.appendChild(botao);
        listaEl.appendChild(li);
    }

    function renderizar() {
        const nome = nomeEl.value.trim();
        const marca = marcaEl.value.trim();
        listaEl.innerHTML = "";

        if (!nome) {
            dicaEl.textContent = "Digite o nome do produto.";
            return;
        }

        const parecidos = buscarParecidos(nome, marca);
        dicaEl.textContent = parecidos.length
            ? "Toque no produto para salvar:"
            : "Nenhum produto parecido cadastrado.";

        parecidos.forEach((produto) => {
            const preco = produto.preco_centavos == null ? "" : ` · ${formatarReais(produto.preco_centavos)}`;
            adicionarBotao(
                `${escaparHtml(textoProduto(produto))} <small>(estoque: ${produto.estoque}${preco})</small>`,
                "",
                produto
            );
        });

        const jaExiste = produtos.some((p) => mesmoTexto(p.nome, nome) && mesmoTexto(p.marca, marca));
        if (!jaExiste) {
            adicionarBotao(
                `➕ Novo produto: <strong>${escaparHtml(textoProduto({ nome, marca }))}</strong>`,
                "novo",
                { id: null, nome, marca }
            );
        }
    }

    nomeEl.addEventListener("input", renderizar);
    marcaEl.addEventListener("input", renderizar);

    return {
        // Recarrega os produtos do banco (ex.: depois de salvar) e atualiza a lista.
        async recarregar() {
            produtos = await listarProdutos();
            buscaNome = new Fuse(produtos, { ...OPCOES_BUSCA, keys: ["nome"] });
            buscaMarca = new Fuse(produtos, { ...OPCOES_BUSCA, keys: ["marca"] });
            renderizar();
        },
        renderizar
    };
}

(function estilosSeletor() {
    const style = document.createElement("style");
    style.textContent = `
        .lista-produtos {
            list-style: none;
            margin: 0 0 12px;
            padding: 0;
        }

        .lista-produtos li {
            margin-bottom: 6px;
        }

        .lista-produtos button {
            width: 100%;
            text-align: left;
            background: #f0f0f0;
            color: #111;
            border: 2px solid #ccc;
            font-weight: normal;
        }

        .lista-produtos button:hover {
            background: #e7f1ff;
            border-color: #005fcc;
        }

        .lista-produtos button.novo {
            border-style: dashed;
            border-color: #198754;
        }

        .lista-produtos button.novo:hover {
            background: #e8f5ee;
        }

        .lista-produtos button:disabled {
            opacity: 0.5;
            cursor: wait;
        }

        .lista-produtos small {
            color: #555;
        }
    `;
    document.head.appendChild(style);
})();
