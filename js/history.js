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

   console.log("ABRINDO COMPRA:", compraId);

async function openPurchaseDetails(compraId, numeroCompra) {


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

   itens.forEach(item => {

    lista.innerHTML += `

        <li class="cart-item">

            <div>

                <strong>
                    ${item.nome}
                </strong>

                <p>
                    ${item.quantidade} ${item.unidade}
                </p>

            </div>

            <strong>
                R$ ${Number(item.preco_total)
                    .toFixed(2)
                    .replace(".", ",")}
            </strong>

        </li>

    `;

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