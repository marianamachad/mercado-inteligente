# 🛒 Mercado Inteligente

O **Mercado Inteligente** é uma aplicação web desenvolvida para auxiliar consumidores a comparar preços de produtos e identificar o melhor custo-benefício durante suas compras.

A aplicação permite comparar produtos com diferentes preços e quantidades, montar uma lista de compras, consultar o histórico de compras e gerenciar preferências da conta.

---

## 🚀 Funcionalidades

### 🔐 Autenticação
- Cadastro de usuários
- Login com e-mail e senha
- Login com Google (em andamento) 
- Alteração de senha
- Alteração do nome de exibição
- Encerramento de sessão

### ⚖️ Comparação de preços
- Comparação entre dois produtos
- Cálculo automático do preço por quantidade
- Identificação do produto com melhor custo-benefício
- Adição do produto escolhido ao carrinho
- Pesquisa de produtos por nome
- Leitura de código de barras

### 🛒 Lista de compras
- Adição de produtos
- Alteração da quantidade
- Remoção de produtos
- Limpeza da lista
- Cálculo automático do total da compra
- Contagem de itens

### 🏪 Mercados
- Cadastro de mercados
- Associação da compra ao mercado realizado

### 🧾 Histórico de compras
- Visualização das compras realizadas
- Consulta dos produtos de cada compra
- Visualização do mercado
- Visualização do total da compra

### ⚙️ Configurações
- Alteração do nome de exibição
- Alteração de senha
- Visualização do e-mail da conta
- Modo claro e modo escuro

---

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Supabase
- PostgreSQL
- Font Awesome
- HTML5 QR Code
- PWA (Progressive Web App)

---

## 📁 Estrutura do projeto

```text
mercado-inteligente/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── calculator.js
│   ├── database.js
│   ├── history.js
│   ├── markets.js
│   ├── product.js
│   ├── ui.js
│   └── utils.js
│
├── manifest.json
│
└── README.md
