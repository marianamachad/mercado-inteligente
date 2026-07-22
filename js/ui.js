/* ==========================================================
   01 - NAVEGAÇÃO E CONTROLE DE TELAS
   ========================================================== */

// Esconde a tela atual e exibe a nova tela selecionada
function switchScreen(showId, hideId) {
  document.getElementById(hideId).classList.add("hidden");
  document.getElementById(showId).classList.remove("hidden");
}

/* ==========================================================
   02 - FORMATADORES E AUXILIARES DE INTERFACE
   ========================================================== */

// Retorna o nome da unidade de comparação exibida ao usuário
function getUnitLabel(unit) {
  switch (unit) {
    case "l":
    case "ml":
      return "Preço por Litro";
    case "kg":
    case "g":
      return "Preço por Quilo";
    case "un":
      return "Preço por Unidade";
    default:
      return "Preço por unidade base";
  }
}

/* ==========================================================
   03 - RESULTADO DA COMPARAÇÃO DE PRODUTOS
   ========================================================== */

// Exibe resultado quando existe um produto vencedor
function showWinnerDetails(product, unitPrice) {
  // Força o corte das casas decimais na UI
  const truncatedPrice = Math.floor(unitPrice * 100) / 100;
  const unitLabel = getUnitLabel(product.unit);

  const container = document.getElementById("winner-details");
  const actionButtons = document.querySelector(".action-buttons");

  // Garante que os botões padrão (Adicionar/Descartar) fiquem visíveis
  actionButtons.classList.remove("hidden");

  container.innerHTML = `
        <h3>🏆 Melhor Compra</h3>
        <p>O produto recomendado é: <strong>${product.name}</strong></p>
        <p>${unitLabel}: <strong>${formatCurrency(truncatedPrice)}</strong></p>
        <p class="subtitle" style="margin-top: 10px;">Preço total: ${formatCurrency(product.price)}</p>
    `;
}

// Exibe resultado quando os produtos possuem o mesmo custo-benefício
function showDrawDetails(product1, product2, unitPrice) {
  const truncatedPrice = Math.floor(unitPrice * 100) / 100;
  const unitLabel = getUnitLabel(product1.unit);

  const container = document.getElementById("winner-details");
  const actionButtons = document.querySelector(".action-buttons");

  actionButtons.classList.add("hidden");

  container.innerHTML = `
        <h3>🤝 Empate de Custo-Benefício</h3>
        <p>Ambos os produtos possuem o mesmo valor por unidade: <strong>${formatCurrency(truncatedPrice)}</strong></p>
        <p class="subtitle">Medida considerada: ${unitLabel}</p>
        <p style="margin: 15px 0 5px 0; font-weight: bold; text-align: center;">Escolha qual das embalagens deseja levar:</p>
        
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
            <button onclick="addSelectedToCart(1)" class="btn-success">
                Adicionar ${product1.name} (${formatCurrency(product1.price)})
            </button>
            <button onclick="addSelectedToCart(2)" class="btn-success">
                Adicionar ${product2.name} (${formatCurrency(product2.price)})
            </button>
            <button onclick="cancelDraw()" class="btn-danger" style="margin-top: 5px;">
                Descartar Ambos
            </button>
        </div>
    `;
}

/* ==========================================================
   04 - RENDERIZAÇÃO DO CARRINHO
   ========================================================== */
// Atualiza lista de produtos,
// quantidade de itens e valor total
function updateCartUI(cart, cartTotal) {
  const cartList = document.getElementById("cart-list");

  const cartTotalEl = document.getElementById("cart-total");

  const cartItemsCount = document.getElementById("cart-items-count");

  if (!cartList || !cartTotalEl) return;

  cartList.innerHTML = "";

  cart.forEach((item, index) => {
    const li = document.createElement("li");

    const quantidadeItens = Number(item.quantidade_itens || 1);

    const mostrarLixeira = quantidadeItens === 1;

    li.innerHTML = `

<div class="cart-item-row">

    <div class="cart-item-left">

        <div class="cart-item-name">
            ${item.nome}
        </div>

        <div class="item-price">
            ${formatCurrency(Number(item.preco_total))}
        </div>

    </div>

    <div class="cart-item-right">

        ${
          mostrarLixeira
            ? `
            <button
                class="btn-delete"
                onclick="removeFromCart(${index})">
                🗑️
            </button>

            <span class="qty-value">1</span>

            <button
                class="btn-qty"
                onclick="increaseItem('${item.id}')">
                +
            </button>
            `
            : `
            <button
                class="btn-qty"
                onclick="decreaseItem('${item.id}')">
                −
            </button>

            <span class="qty-value">
                ${quantidadeItens}
            </span>

            <button
                class="btn-qty"
                onclick="increaseItem('${item.id}')">
                +
            </button>
            `
        }
    </div>
</div>
`;
    cartList.appendChild(li);
  });

  cartTotalEl.textContent = formatCurrency(cartTotal);

  if (cartItemsCount) {
    const totalItens = cart.reduce(
      (total, item) => total + Number(item.quantidade_itens || 1),
      0,
    );

    cartItemsCount.textContent = `${totalItens} ${totalItens === 1 ? "item" : "itens"}`;
  }
}

/* ==========================================================
   05 - MENSAGENS E VALIDAÇÕES VISUAIS
   ========================================================== */
// Exibe ou remove mensagens de erro no formulário
function showFormError(message) {
  const errorContainer = document.getElementById("form-error");
  if (message) {
    errorContainer.textContent = `⚠️ ${message}`;
    errorContainer.classList.remove("hidden");
  } else {
    errorContainer.classList.add("hidden");
  }
}
