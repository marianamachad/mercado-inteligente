/* ==========================================================
   01 - LEITURA DOS PRODUTOS
   ========================================================== */

// Captura os dados preenchidos pelo usuário
// e transforma em um objeto produto padronizado
function getProductData(productNumber) {
    const nameInput = 
        document.getElementById(`name${productNumber}`).value.trim();

    const priceRaw = 
        document.getElementById(`price${productNumber}`).value;

    const quantityRaw = 
        document.getElementById(`quantity${productNumber}`).value;

    const unitInput = 
        document.getElementById(`unit${productNumber}`).value.toLowerCase();

    let finalPrice = Number(priceRaw);

    const finalQuantity = Number(quantityRaw);

    /*
       Produtos vendidos por unidade:

       Ex:
       5 garrafas por R$3 cada

       Usuário informa:
       preço = 3
       quantidade = 5
       unidade = un

       Sistema transforma:
       preço total = 15
    */

    if (unitInput === "un") {
        finalPrice = finalPrice * finalQuantity;
    }

    return {
        // Nome informado pelo usuário
        name: nameInput || `Produto ${productNumber}`,

        // Valor total do produto usado nos cálculos
        price: finalPrice, 

        // Converte kg/g e L/ml para uma unidade padrão de comparação
        quantity: convertToBaseUnit(finalQuantity, unitInput),

        // Unidade original escolhida
        unit: unitInput,

        // Valores originais mantidos para histórico/banco
        rawPrice: priceRaw,       
        rawQuantity: quantityRaw  
    };
}

// Reseta todos os inputs de ambos os produtos
// function clearForm() {
//     for (let i = 1; i <= 2; i++) {
//         document.getElementById(`name${i}`).value = "";
//         document.getElementById(`price${i}`).value = "";
//         document.getElementById(`quantity${i}`).value = "";
//         document.getElementById(`unit${i}`).selectedIndex = 0;
//     }
// }