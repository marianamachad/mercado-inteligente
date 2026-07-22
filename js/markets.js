/* ==========================================================
   01 - ESTADO DOS MERCADOS
   ========================================================== */

let mercados = [];
let mercadoSelecionado = null;
let retornarParaFinalizacao = false;

/* ==========================================================
   02 - CONSULTA DOS MERCADOS
   ========================================================== */ 

async function carregarMercados() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data, error } = await supabaseClient
        .from("supermercados")
        .select("*")
        .eq("user_id", user.id)
        .order("favorito", { ascending: false })
        .order("nome");

    if (error) {

    console.log("========== ERRO MERCADOS ==========");
    console.log(error);

    console.log("Mensagem:", error.message);
    console.log("Código:", error.code);
    console.log("Detalhes:", error.details);
    console.log("Hint:", error.hint);

    return;
}

    mercados = data || [];

    atualizarListaMercados();
}

/* ==========================================================
   03 - RENDERIZAÇÃO DOS MERCADOS
   ========================================================== */ 
function atualizarListaMercados() {

    const lista = document.getElementById("market-list");

    if (!lista) return;

    lista.innerHTML = "";

    const contador =
    document.getElementById("markets-count");

if (contador) {

    contador.textContent =
        `${mercados.length} mercado${mercados.length != 1 ? "s" : ""} cadastrado${mercados.length != 1 ? "s" : ""}`;

}

    mercados.forEach(mercado => {

        const li = document.createElement("li");

        li.className = "market-item";

        li.innerHTML = `
            <div>
                <strong>${mercado.nome}</strong>
                <br>
                <small>${mercado.cidade || ""}</small>
            </div>

            ${
                mercado.favorito
                    ? "<span>⭐</span>"
                    : ""
            }
        `;

        li.onclick = () => selecionarMercado(mercado.id);

        lista.appendChild(li);

    });

}

/* ==========================================================
   04 - SELEÇÃO DE MERCADO
   ========================================================== */
function selecionarMercado(id){

    mercadoSelecionado = id;

    showToast("Mercado selecionado.");

}

/* ==========================================================
   05 - CONTROLE DO MODAL
   ========================================================== */
function openMarketModal() {

    const checkoutModal = document.getElementById("checkout-modal");
    retornarParaFinalizacao =
        checkoutModal && !checkoutModal.classList.contains("hidden");

    if (retornarParaFinalizacao) {
        closeCheckoutModal();
    }

    document.getElementById("market-name").value = "";
    document.getElementById("market-neighborhood").value = "";

    document
        .getElementById("market-modal")
        .classList
        .remove("hidden");

}

function closeMarketModal(retornarAoCheckout = true) {

    document
        .getElementById("market-modal")
        .classList
        .add("hidden");

    const deveRetornar = retornarAoCheckout && retornarParaFinalizacao;
    retornarParaFinalizacao = false;

    if (deveRetornar) {
        openCheckoutModal(true);
    }

}

/* ==========================================================
   06 - CADASTRO DE MERCADO
   ========================================================== */

// Salva um novo mercado vinculado ao usuário logado
async function saveMarket() {

    const nome = document
        .getElementById("market-name")
        .value
        .trim();

    const cidade = document
        .getElementById("market-neighborhood")
        .value
        .trim();

    if (!nome) {

        showToast("Informe o nome do mercado.", true);

        return;

    }

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { error } = await supabaseClient
        .from("supermercados")
        .insert({

            user_id: user.id,

            nome: nome,

            cidade: cidade,

            favorito: false

        });

    if (error) {

        console.error(error);

        showToast("Erro ao salvar.", true);

        return;

    }

    closeMarketModal(false);

    await carregarMercados();

    openCheckoutModal(true); 

    showToast("Mercado cadastrado!");

}

/* ==========================================================
    07 - MODAL DE FINALIZAÇÃO DA COMPRA
   ========================================================== */

// Abre o modal para finalizar a compra
function openCheckoutModal(ignoreValidation = false) {

    if (!ignoreValidation && (!cart || cart.length === 0)) {

        showToast("Seu carrinho está vazio.", true);

        return;

    }

    preencherSelectMercados();

    document
        .getElementById("checkout-modal")
        .classList
        .remove("hidden");

}

// Fecha o modal
function closeCheckoutModal() {

    document
        .getElementById("checkout-modal")
        .classList
        .add("hidden");

}

// Preenche o dropdown com os mercados cadastrados
function preencherSelectMercados() {

    const input =
        document.getElementById("checkout-market-select");

    const dropdown =
        document.getElementById("checkout-market-dropdown");

    const options =
        document.getElementById("checkout-market-options");

    const selectedText = dropdown?.querySelector(".selected-text");

    if (!input || !dropdown || !options || !selectedText) return;

    const mercadoAtual = mercados.find(
        mercado => String(mercado.id) === String(input.value),
    );

    options.innerHTML = "";

    if (mercados.length === 0) {

        input.value = "";
        selectedText.textContent = "Nenhum mercado cadastrado";
        dropdown.classList.add("is-empty");

        return;

    }

    dropdown.classList.remove("is-empty");

    mercados.forEach(mercado => {

        const option =
            document.createElement("div");

        option.dataset.value = mercado.id;

        option.textContent = mercado.nome;

        options.appendChild(option);

    });

    input.value = mercadoAtual ? mercadoAtual.id : "";
    selectedText.textContent =
        mercadoAtual ? mercadoAtual.nome : "Selecione um mercado";

}

/* ==========================================================
   08 - EXPORTAÇÃO GLOBAL
   ========================================================== */

window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.preencherSelectMercados = preencherSelectMercados;
