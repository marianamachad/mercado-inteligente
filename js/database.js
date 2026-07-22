
const customModal = document.getElementById("custom-modal");
const modalMessage = document.getElementById("modal-message");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

/* ==========================================================
   01 - CARRINHO: CARREGAMENTO DOS ITENS
   ========================================================== */

// Busca os produtos salvos no Supabase
// Atualiza o estado global do carrinho
// Calcula o valor total
// Atualiza a interface

async function carregarCarrinho() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    const { data, error } = await supabaseClient
        .from("itens_lista")
        .select(`
            id,
            nome,
            preco_total,
            preco_unitario,
            quantidade,
            quantidade_itens,
            unidade,
            economia,
            created_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });


    if (error) {

        console.error(error);

        showToast("Erro ao carregar lista.", true);

        return;
    }


    cart = data || [];


    cartTotal = cart.reduce(
        (total, item) =>
            total + Number(item.preco_total || 0),
        0
    );


    updateCartUI(cart, cartTotal);
}

/* ==========================================================
   02 - PRODUTOS NO BANCO
   ========================================================== */

// Localiza um produto já cadastrado no banco.
// Caso não exista, cria um novo registro e retorna seu ID.
async function obterOuCriarProduto(produto) {

    const codigoBarras = String(
        produto.codigoBarras || produto.codigo_barras || ""
    ).replace(/\D/g, "");

    // O código de barras é a identificação mais precisa. Quando ele estiver
    // disponível, prioriza o item já salvo pelo scanner antes da busca por nome.
    if (codigoBarras) {
        const { data: produtoPorCodigo, error: erroCodigo } = await supabaseClient
            .from("produtos")
            .select("id")
            .eq("codigo_barras", codigoBarras)
            .maybeSingle();

        if (erroCodigo) {
            console.error(erroCodigo);
        } else if (produtoPorCodigo) {
            return produtoPorCodigo.id;
        }
    }

    // Padroniza o nome para facilitar a busca
    const nomeLimpo = produto.name
        .toLowerCase()
        .trim();

    // Procura um produto semelhante já cadastrado
    const { data: existentes, error } = await supabaseClient
        .from("produtos")
        .select("id,nome")
        .ilike("nome", `%${nomeLimpo}%`)
        .limit(1);

    if (error) {
        console.error(error);
        return null;
    }

    // Produto encontrado
    if (existentes && existentes.length > 0) {
        if (codigoBarras) {
            const { error: erroAtualizacaoCodigo } = await supabaseClient
                .from("produtos")
                .update({ codigo_barras: codigoBarras })
                .eq("id", existentes[0].id);

            if (erroAtualizacaoCodigo) {
                console.error(erroAtualizacaoCodigo);
            }
        }

        return existentes[0].id;
    }

    // Produto não encontrado:
    // cria um novo registro na tabela produtos
    const {
        data: novoProduto,
        error: erroCriacao
    } = await supabaseClient
        .from("produtos")
        .insert({
            nome: produto.name,
            unidade_base: produto.unit,
            codigo_barras: codigoBarras || null
        })
        .select("id")
        .single();

    if (erroCriacao) {
        console.error(erroCriacao);
        return null;
    }

    // Retorna o ID do novo produto criado
    return novoProduto.id;
}

/* ==========================================================
   03 - VALIDAÇÃO DE ITEM EXISTENTE
   ========================================================== */

// Verifica se o usuário já possui o produto na lista.
// Retorna o item encontrado ou null caso não exista.
async function buscarItemExistente(produtoId) {

    // Obtém o usuário autenticado
    const user = (await supabaseClient.auth.getUser()).data.user;

    // Procura o produto na lista do usuário
    const { data, error } = await supabaseClient
        .from("itens_lista")
        .select("*")
        .eq("user_id", user.id)
        .eq("produto_id", produtoId)
        .maybeSingle();

    if (error) {
        console.error(error);
        return null;
    }

    return data;
}

/* ==========================================================
   04 - ADIÇÃO DE PRODUTOS AO CARRINHO
   ========================================================== */

// Adiciona um produto à lista de compras.
// Caso o produto já exista, atualiza sua quantidade.
// Caso contrário, cria um novo item no carrinho.
async function adicionarItemCarrinho(produto) {

    const quantidadeDoCarrinho = Number(produto.cartQuantity ?? 1);
    const quantidadeDoProduto = Number(produto.rawQuantity ?? produto.quantity ?? 1);
    const precoPorItem = Number(produto.price);

    if (
        !Number.isInteger(quantidadeDoCarrinho) ||
        quantidadeDoCarrinho < 1 ||
        !Number.isFinite(quantidadeDoProduto) ||
        quantidadeDoProduto <= 0 ||
        !Number.isFinite(precoPorItem) ||
        precoPorItem < 0
    ) {
        showToast("Quantidade ou preço inválido.", true);
        return false;
    }

    // Obtém (ou cria) o produto na tabela de produtos
    const produtoId = await obterOuCriarProduto(produto);

    if (!produtoId) {
        showToast("Erro ao localizar produto.", true);
        return false;
    }

    // Verifica se o produto já está no carrinho
    const itemExistente = await buscarItemExistente(produtoId);

    // Obtém o usuário autenticado
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        showToast("Usuário não autenticado.", true);
        return false;
    }

    let error;

    // Produto já existe:
    // atualiza quantidade e valor acumulado
    if (itemExistente) {

        const { error: updateError } = await supabaseClient
            .from("itens_lista")
            .update({

                quantidade:
                    Number(itemExistente.quantidade) +
                    quantidadeDoProduto,

                quantidade_itens:
                    Number(itemExistente.quantidade_itens || 1) + quantidadeDoCarrinho,

                preco_total:
                    Number(itemExistente.preco_total) +
                    (precoPorItem * quantidadeDoCarrinho)

            })
            .eq("id", itemExistente.id);

        error = updateError;

    } else {

        // Produto ainda não existe:
        // cria um novo registro na lista
        const { error: insertError } = await supabaseClient
            .from("itens_lista")
            .insert({

                user_id: user.id,
                nome: produto.name,
                preco_total: precoPorItem * quantidadeDoCarrinho,
                preco_unitario: precoPorItem,
                quantidade: quantidadeDoProduto,
                quantidade_itens: quantidadeDoCarrinho,
                unidade: produto.unit,
                produto_id: produtoId

            });

        error = insertError;

    }

    if (error) {
        console.error(error);
        showToast("Erro ao salvar produto.", true);
        return false;
    }

    // Registra o preço no histórico após salvar o item
    await registrarHistorico(produto, produtoId);

    return true;
}

/* ==========================================================
   05 - HISTÓRICO DE PREÇOS
   ========================================================== */

// Registra no histórico o preço do produto informado.
// Cada registro representa uma pesquisa ou compra realizada.
async function registrarHistorico(produto, produtoId, mercadoId = null) {

    // Obtém o usuário autenticado
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        console.error("Usuário não autenticado");
        return false;
    }

    // Salva o registro na tabela de histórico
    const { error } = await supabaseClient
        .from("historico_precos")
        .insert({
            user_id: user.id,
            produto_id: produtoId,
            mercado_id: mercadoId,
            preco: Number(produto.price),
            quantidade: Number(produto.rawQuantity),
            unidade: produto.unit,
            observacao: null
        });

    if (error) {
        console.error(error);
        return false;
    }

    return true;
}

/* ==========================================================
   06 - LIMPEZA DO CARRINHO
   ========================================================== */

// Remove todos os itens da lista de compras do usuário.
// Após a exclusão, recarrega o carrinho para atualizar a interface.
async function limparCarrinho() {

    // Obtém o usuário autenticado
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    // Remove todos os itens do carrinho do usuário
    const { error } = await supabaseClient
        .from("itens_lista")
        .delete()
        .eq("user_id", user.id);

    if (error) {

        console.error(error);

        showToast("Erro ao limpar a sacola.", true);

        return;

    }

    showToast("Sacola esvaziada!");

    // Atualiza a interface após a limpeza
    carregarCarrinho();

}

/* ==========================================================
   07 - FINALIZAÇÃO DE COMPRA
   ========================================================== */

// async function openCheckoutModal() {

//     if (!cart || cart.length === 0) {
//         showToast("Seu carrinho está vazio.", true);
//         return;
//     }

//     await carregarMercadosSelect();

//     document
//         .getElementById("checkout-modal")
//         .classList.remove("hidden");
// }
async function finishPurchase() {

    if (!cart || cart.length === 0) {

        showToast("Seu carrinho está vazio.", true);
        closeCheckoutModal();
        return;

    } 

    const mercadoId =
        document.getElementById("checkout-market-select").value;

    if (!mercadoId) {

        showToast("Selecione um mercado.", true);

        return;

    }

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        showToast("Usuário não autenticado.", true);

        return;

    }

    console.log("CARRINHO FINALIZANDO:", cart);
    console.log("PRIMEIRO ITEM:", cart[0]);

    const valorTotal = cart.reduce(

        (total, item) =>
            total + Number(item.preco_total),

        0

    );

    const totalItens = cart.reduce(

        (total, item) =>
            total + Number(item.quantidade_itens || 1),

        0

    );

    const { data: compra, error } = await supabaseClient
    .from("compras")
    .insert({
        user_id: user.id,
        mercado_id: mercadoId,
        valor_total: valorTotal,
        total_itens: totalItens
    })
    .select()
    .single();
    
    if (error) {

    console.error(error);

    showToast("Erro ao finalizar compra.", true);

    return;

}

// Salva todos os itens da compra

console.log(cart);
const itensCompra = cart.map(item => ({
    compra_id: compra.id,
    produto_id: item.produto_id || null,
    nome: item.nome,
    quantidade: item.quantidade,
    unidade: item.unidade,
    preco_total: item.preco_total,
    preco_unitario: item.preco_unitario
}));

const { error: itensError } = await supabaseClient
    .from("compra_itens")
    .insert(itensCompra);

if (itensError) {

    console.error(itensError);

    showToast("Erro ao salvar os itens da compra.", true);

    return;

}


// Fecha o modal
closeCheckoutModal();

// Limpa o carrinho do banco
await limparCarrinho();

// Reseta o mercado selecionado no dropdown personalizado
document.getElementById("checkout-market-select").value = "";
preencherSelectMercados();

showToast("Compra finalizada com sucesso!");


}

/* ==========================================================
   08 - GERENCIAMENTO DO CARRINHO
   ========================================================== */

// Remove um item do banco
async function removerItemCarrinho(id) {

    const { error } = await supabaseClient
        .from("itens_lista")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(error);

        return false;

    }

    return true;

}

let itemToDelete = null;

// Abre o modal de confirmação
function removeFromCart(index) {

    // A confirmação de esvaziar a sacola é atribuída pelo app.js via
    // onclick. Ao excluir um único item, remove essa ação anterior para
    // que somente o listener abaixo seja executado.
    modalConfirmBtn.onclick = null;

    itemToDelete = cart[index];

    const itemName =
        cart[index].nome || cart[index].name;

    modalMessage.innerHTML =
        `Certeza que deseja excluir <strong>"${itemName}"</strong>?`;

    customModal.classList.remove("hidden");

}

// Fecha o modal
function closeCustomModal() {

    customModal.classList.add("hidden");

    itemToDelete = null;

}

// Confirma a exclusão
modalConfirmBtn.addEventListener("click", async function () {

    if (!itemToDelete) return;

    const sucesso =
        await removerItemCarrinho(itemToDelete.id);

    if (sucesso) {

        await carregarCarrinho();

        showToast("🗑️ Item removido");

    }

    closeCustomModal();

});

modalCancelBtn.addEventListener(
    "click",
    closeCustomModal
);

   
/* ==========================================================
   09 - EXPORTAÇÃO GLOBAL
   ========================================================== */

// Disponibiliza funções para uso em outros arquivos
// e chamadas realizadas diretamente pelo HTML.

window.carregarCarrinho = carregarCarrinho;
window.adicionarItemCarrinho = adicionarItemCarrinho;
window.removerItemCarrinho = removerItemCarrinho;
window.removeFromCart = removeFromCart;
window.registrarHistorico = registrarHistorico;
window.obterOuCriarProduto = obterOuCriarProduto;
window.buscarItemExistente = buscarItemExistente;
window.clearCart = limparCarrinho;
window.finishPurchase = finishPurchase;
window.closeCustomModal = closeCustomModal;
