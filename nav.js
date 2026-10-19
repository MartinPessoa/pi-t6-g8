// Barra de navegacao compartilhada entre as paginas.
// Para adicionar uma pagina: inclua uma entrada em PAGINAS (sem "href" = ainda nao existe).

const PAGINAS = [
    { titulo: "📋 Pedidos", href: "index.html" },
    { titulo: "📊 Lista completa", href: "list.html" },
    { titulo: "🛒 Vendas", href: "vendas.html" },
    { titulo: "📦 Estoque", href: "estoque.html" }
];

(function montarNav() {
    const style = document.createElement("style");
    style.textContent = `
        .barra-nav {
            max-width: 1100px;
            margin: 0 auto 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px;
            background: #005fcc;
            border-radius: 12px;
        }

        .barra-nav a,
        .barra-nav span {
            padding: 12px 16px;
            border-radius: 8px;
            color: #fff;
            font-size: 1.1rem;
            font-weight: bold;
            text-decoration: none;
        }

        .barra-nav a:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .barra-nav a.ativo {
            background: #fff;
            color: #005fcc;
        }

        .barra-nav span {
            opacity: 0.6;
            cursor: default;
        }

        @media (max-width: 600px) {
            .barra-nav a,
            .barra-nav span {
                flex: 1 1 40%;
                text-align: center;
                padding: 10px 8px;
                font-size: 1rem;
            }
        }
    `;
    document.head.appendChild(style);

    const atual = location.pathname.split("/").pop() || "index.html";
    const nav = document.createElement("nav");
    nav.className = "barra-nav";

    PAGINAS.forEach((pagina) => {
        let el;
        if (pagina.href) {
            el = document.createElement("a");
            el.href = pagina.href;
            if (pagina.href === atual) {
                el.className = "ativo";
                el.setAttribute("aria-current", "page");
            }
        } else {
            el = document.createElement("span");
            el.title = "Em breve";
        }
        el.textContent = pagina.titulo;
        nav.appendChild(el);
    });

    // Mesma largura do conteudo da pagina.
    const main = document.querySelector("main");
    if (main) {
        nav.style.maxWidth = getComputedStyle(main).maxWidth;
    }

    document.body.prepend(nav);
})();
