console.log("history.js carregado");


/* ==========================================================
   01 - CARREGAR HISTÓRICO DE COMPRAS
   ========================================================== */

async function carregarHistorico() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data, error } = await supabaseClient

    .from("compras")

    .select(`
        *,
        supermercados (
            nome
        )
    `)

    .eq("user_id", user.id)

    .order("created_at", {
        ascending: false
    });


    if (error) {

        console.error(error);

        showToast(
            "Erro ao carregar histórico.",
            true
        );

        return;
    }


    const lista = document.getElementById("history-list");

    lista.innerHTML = "";


    if (!data || data.length === 0) {

        lista.innerHTML = `

            <li class="empty-message">

                Nenhuma compra realizada.

            </li>

        `;

        return;
    }


    data.forEach((compra, index) => {

    const numeroCompra = data.length - index;

        lista.innerHTML += `

        <li 
            class="history-item"
            onclick="openPurchaseDetails('${compra.id}', ${numeroCompra})">

            <div class="history-top">

                <strong>
                    🛒 Compra #${numeroCompra}
                </strong>

                <span>
                    ${new Date(compra.created_at)
                    .toLocaleDateString("pt-BR")}
                </span>

            </div>

            <div class="history-market">

                🏪 ${compra.supermercados?.nome || "Mercado não informado"}

            </div>


            <div class="history-bottom">

                <span>

                    🧺 ${compra.total_itens} itens

                </span>

                <strong>

                    R$ ${Number(compra.valor_total)
                    .toFixed(2)
                    .replace(".", ",")}

                </strong>

            </div>


        </li>

        `;

    });

}

window.carregarHistorico = carregarHistorico;

/* ==========================================================
   02 - ABRIR DETALHES DA COMPRA
   ========================================================== */

function escapeHistoryHtml(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

function formatHistoryQuantity(value) {
    return new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 3
    }).format(value);
}

function getHistoryCartQuantity(item) {
    const savedQuantity = Number(item.quantidade_itens);

    if (Number.isInteger(savedQuantity) && savedQuantity > 0) {
        return savedQuantity;
    }

    // Compras anteriores não armazenavam a quantidade de embalagens em
    // compra_itens. Como o subtotal é preço unitário × itens, ela pode ser
    // reconstruída sem alterar o histórico já salvo.
    const unitPrice = Number(item.preco_unitario);
    const subtotal = Number(item.preco_total);

    if (Number.isFinite(unitPrice) && unitPrice > 0 && Number.isFinite(subtotal)) {
        return Math.max(1, Math.round(subtotal / unitPrice));
    }

    return 1;
}

function getHistoryMeasureLabel(item, cartQuantity) {
    const totalMeasure = Number(item.quantidade);
    const measurePerItem =
        Number.isFinite(totalMeasure) && totalMeasure > 0
            ? totalMeasure / cartQuantity
            : 1;
    const unit = String(item.unidade || "un").toLowerCase();

    if (unit === "un") {
        return `${formatHistoryQuantity(measurePerItem)} ${
            measurePerItem === 1 ? "unidade" : "unidades"
        }`;
    }

    return `${formatHistoryQuantity(measurePerItem)} ${unit === "l" ? "L" : unit}`;
}

async function openPurchaseDetails(compraId, numeroCompra) {

    console.log("ABRINDO COMPRA:", compraId);


    const titulo =
        document.getElementById("detail-title");


    const dataCompra =
        document.getElementById("detail-date");


    const mercado =
        document.getElementById("detail-market");


    const lista =
        document.getElementById("detail-items");


    const total =
        document.getElementById("detail-total");


    lista.innerHTML = "";

    const { data: compra, error } = await supabaseClient

    .from("compras")
    .select(`
        *,
        supermercados (
            nome,
            cidade
        )
    `)
    .eq("id", compraId)
    .single();

    console.log("COMPRA RETORNADA:", compra);
console.log("ERRO COMPRA:", error);
        

    if (error) {

        console.error(error);

        showToast(
            "Erro ao carregar compra.",
            true
        );

        return;
    }

console.log("COMPRA DETALHE:", compra);

    const {
        data: itens,
        error: erroItens

    } = await supabaseClient

        .from("compra_itens")

        .select("*")

        .eq("compra_id", compraId);

        console.log("ITENS RETORNADOS:", itens);
console.log("ERRO ITENS:", erroItens);

    if (erroItens) {
        console.error(erroItens);
        return;
    }

    console.log("ITENS DETALHE:", itens);

    titulo.innerHTML =
        `🛒 Compra #${numeroCompra}`;

    dataCompra.innerHTML =

        `📅 ${
            new Date(compra.created_at)
            .toLocaleDateString("pt-BR")
        }`;

    mercado.innerHTML =
    `🏪 ${compra.supermercados?.nome || "Mercado não informado"}`;

   (itens || []).forEach(item => {

    const cartQuantity = getHistoryCartQuantity(item);
    const subtotal = Number(item.preco_total || 0);
    const savedUnitPrice = Number(item.preco_unitario);
    const hasSavedUnitPrice =
        item.preco_unitario !== null &&
        item.preco_unitario !== undefined &&
        Number.isFinite(savedUnitPrice) &&
        savedUnitPrice >= 0;
    const unitPrice = hasSavedUnitPrice
        ? savedUnitPrice
        : subtotal / cartQuantity;

    lista.innerHTML += `
        <li class="history-product-card">
            <div class="history-item-top">
                <div class="history-item-description">
                    <span class="history-item-measure">${getHistoryMeasureLabel(item, cartQuantity)} por item</span>
                    <strong>${escapeHistoryHtml(item.nome)}</strong>
                </div>
            </div>

            <div class="history-item-pricing">
                <span>${cartQuantity} ${cartQuantity === 1 ? "unidade" : "unidades"} × ${formatCurrency(unitPrice)}</span>
                <strong>${formatCurrency(subtotal)}</strong>
            </div>
        </li>`;

});

    total.innerHTML =

        `R$ ${
            Number(compra.valor_total)
            .toFixed(2)
            .replace(".", ",")
        }`;
        
        console.log("FINALIZOU DETALHES");
    navigateTo("screen-history-details");

}

window.openPurchaseDetails = openPurchaseDetails;
