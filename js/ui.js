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
function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

function formatQuantity(value) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(value);
}

function getCartMeasureLabel(item, cartQuantity) {
  const totalMeasure = Number(item.quantidade);
  const measurePerItem =
    Number.isFinite(totalMeasure) && totalMeasure > 0
      ? totalMeasure / cartQuantity
      : 1;
  const unit = String(item.unidade || "un").toLowerCase();

  if (unit === "un") {
    const unitLabel = measurePerItem === 1 ? "unidade" : "unidades";
    return `${formatQuantity(measurePerItem)} ${unitLabel}`;
  }

  const unitLabel = unit === "l" ? "L" : unit;
  return `${formatQuantity(measurePerItem)} ${unitLabel}`;
}

// Atualiza lista de produtos, quantidades e valor total. Cada linha representa
// uma embalagem/produto: medida por item, preço unitário e subtotal.
function updateCartUI(cart, cartTotal) {
  const cartList = document.getElementById("cart-list");
  const cartTotalEl = document.getElementById("cart-total");
  const cartItemsCount = document.getElementById("cart-items-count");

  if (!cartList || !cartTotalEl) return;

  cartList.innerHTML = "";

  if (!cart.length) {
    cartList.innerHTML = `
      <li class="cart-empty-state">
        <i class="fa-solid fa-basket-shopping" aria-hidden="true"></i>
        <strong>Sua sacola está vazia</strong>
        <span>Adicione produtos para acompanhar o total da compra.</span>
      </li>`;
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    const quantity = Math.max(1, Number(item.quantidade_itens || 1));
    const unitPrice = Number(item.preco_unitario);
    const subtotal = Number(item.preco_total || 0);
    const pricePerItem = Number.isFinite(unitPrice)
      ? unitPrice
      : subtotal / quantity;
    const itemId = String(item.id);
    const safeItemId = itemId.replace(/'/g, "\\'");

    li.className = "cart-product-card";
    li.innerHTML = `
      <div class="cart-item-top">
        <div class="cart-item-description">
          <span class="cart-item-measure">${getCartMeasureLabel(item, quantity)} por item</span>
          <strong class="cart-item-name">${escapeHtml(item.nome)}</strong>
        </div>
        <button
          class="btn-delete"
          type="button"
          aria-label="Remover ${escapeHtml(item.nome)} da sacola"
          onclick="removeFromCart('${safeItemId}')">
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
        </button>
      </div>

      <div class="cart-item-pricing">
        <span>${quantity} ${quantity === 1 ? "unidade" : "unidades"} × ${formatCurrency(pricePerItem)}</span>
        <strong>${formatCurrency(subtotal)}</strong>
      </div>

      <div class="cart-item-actions">
        <div class="quantity-stepper" aria-label="Quantidade de ${escapeHtml(item.nome)}">
          <button
            class="btn-qty"
            type="button"
            aria-label="Diminuir quantidade"
            onclick="decreaseItem('${safeItemId}')">−</button>
          <span class="qty-value" aria-live="polite">${quantity}</span>
          <button
            class="btn-qty"
            type="button"
            aria-label="Aumentar quantidade"
            onclick="increaseItem('${safeItemId}')">+</button>
        </div>
        <span class="cart-item-quantity-label">Quantidade</span>
      </div>`;
    cartList.appendChild(li);
  });

  cartTotalEl.textContent = formatCurrency(cartTotal);

  if (cartItemsCount) {
    const totalItens = cart.reduce(
      (total, item) => total + Number(item.quantidade_itens || 1),
      0,
    );

    cartItemsCount.textContent = `${totalItens} ${totalItens === 1 ? "item na sacola" : "itens na sacola"}`;
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
