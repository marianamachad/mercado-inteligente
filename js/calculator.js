/* ==========================================================
   01 - CÁLCULO DE PREÇO UNITÁRIO
   ========================================================== */
// Calcula quanto custa cada unidade de medida do produto.
// Exemplo:
// Produto A: R$ 10,00 com 2kg
// Resultado: R$ 5,00 por kg 
function calculateUnitPrice(price, quantity) {

    if (!price || !quantity || quantity <= 0) {
        return 0;
    }

    const unitPrice = price / quantity;
// Mantém apenas duas casas decimais sem arredondamento
    return Math.floor(unitPrice * 100) / 100;
}

/* ==========================================================
   02 - COMPARAÇÃO ENTRE PRODUTOS
   ========================================================== */
// Compara dois produtos utilizando o preço por unidade.
// Retorna qual produto possui o melhor custo-benefício.
function compareProducts(product1, product2) {

    const unitPrice1 = calculateUnitPrice(
        product1.price,
        product1.quantity
    );

    const unitPrice2 = calculateUnitPrice(
        product2.price,
        product2.quantity
    );

    // Define o vencedor:
    // 1 = Produto 1 mais barato
    // 2 = Produto 2 mais barato
    // 0 = Empate
    let winner = 0;

    if (unitPrice1 < unitPrice2) {
        winner = 1;
    } else if (unitPrice2 < unitPrice1) {
        winner = 2;
    }
     // Diferença absoluta entre os preços unitários
    const difference = Math.abs(unitPrice1 - unitPrice2);
    
    // Calcula percentual de economia em relação ao produto mais caro
    const savingsPercentage =
        winner === 0
            ? 0
            : (difference / Math.max(unitPrice1, unitPrice2)) * 100;

    return {

        winner,

        unitPrice1,

        unitPrice2,

        difference,

        savingsPercentage

    };

}