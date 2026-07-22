/* ==========================================================
   01 - CONVERSÃO DE UNIDADES
   ========================================================== */

// Converte todas as unidades para uma unidade base padrão.
// Usado para comparar produtos com medidas diferentes.
//
// Exemplos:
// 1000g  → 1kg
// 500ml  → 0.5L
// 5un   → 5 unidades

function convertToBaseUnit(quantity, unit) {
    switch (unit) {
        case "g":
            return quantity / 1000;
        case "kg":
            return quantity;
        case "ml":
            return quantity / 1000;
        case "L":
            return quantity;
        case "un":
            return quantity;
        default:
            return quantity;
    }
}

/* ==========================================================
   02 - FORMATAÇÃO DE VALORES
   ========================================================== */

// Converte números para o padrão monetário brasileiro.
//
// Exemplo:
// 5.99 → R$ 5,99

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}