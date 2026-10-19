# Tecnologias utilizadas

Texto de referência para a seção de tecnologias do relatório.

---

A aplicação foi desenvolvida como um site estático, executado inteiramente no navegador, sem necessidade de servidor
próprio ou de instalação no computador do estabelecimento. As tecnologias empregadas foram:

- **HTML5 e CSS3**: estrutura e aparência das telas, com fontes grandes, botões amplos e alto contraste, seguindo os
  princípios de usabilidade para usuários idosos discutidos na fundamentação teórica.
- **JavaScript**: lógica da aplicação (registro de pedidos, compras e vendas, cálculo do total da compra e do troco,
  e consulta de estoque).
- **SQLite**: sistema de banco de dados relacional, executado no próprio navegador por meio da biblioteca **sql.js**
  (SQLite compilado para WebAssembly). O banco é composto pelas tabelas `itens` (pedidos de clientes), `produtos`,
  `compras`, `vendas` e `itens_venda`, sendo o estoque de cada produto calculado pela diferença entre as quantidades
  compradas e vendidas. Os valores em dinheiro são armazenados em centavos (números inteiros), evitando erros de
  arredondamento no cálculo do total e do troco. As alterações são gravadas no armazenamento interno do navegador
  (IndexedDB), e o sistema permite exportar e importar o arquivo do banco como cópia de segurança.
- **Fuse.js**: biblioteca de busca aproximada, usada para sugerir produtos já cadastrados mesmo quando o nome é
  digitado com erros, sem acentos ou com letras maiúsculas e minúsculas misturadas, evitando o cadastro duplicado de um
  mesmo produto.
- **Git e GitHub**: controle de versão do código-fonte, conforme o tema norteador do Projeto Integrador.
- **GitHub Pages**: hospedagem gratuita da aplicação, acessível por qualquer navegador, atendendo ao objetivo de
  oferecer uma solução de baixo custo e adequada à realidade do estabelecimento.

Inicialmente, foi considerada uma arquitetura com servidor em Node.js e banco de dados PostgreSQL. Porém, os serviços
de hospedagem gratuitos que suportam essa arquitetura não preservavam os dados de forma permanente ou cobravam pela
utilização contínua. A opção pelo SQLite executado no navegador eliminou esse custo. Como limitação, os dados ficam
armazenados no dispositivo em que o sistema é utilizado, o que é compatível com o uso previsto: um único computador ou
tablet no balcão do estabelecimento.

---

## Pontos a revisar no relatório

- **Delimitação do problema**: o relatório do semestre anterior diz que o projeto "não abrange controle financeiro
  detalhado, gestão completa de estoque". Os novos objetivos incluem controle de estoque e cálculo do valor da compra e
  do troco, então esse trecho precisa ser atualizado.
