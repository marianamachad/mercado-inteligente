/* ==========================================================
   01 - CONFIGURAÇÃO
   ========================================================== */

// SUPABASE
const SUPABASE_URL = "https://bcmxwaeayjgktkmtiwtc.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbXh3YWVheWpna3RrbXRpd3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTA2NTIsImV4cCI6MjA5OTIyNjY1Mn0.N44hZrdubOs2rwdpbAeP2gIK76zOubiZAsLSofO1dHw"; // Sua chave do print

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ==========================================================
   02 - ESTADO GLOBAL
   ========================================================== */

// CARRINHO
let cart = [];
let cartTotal = 0;
let currentWinnerProduct = null;
let itemIndexToDelete = null;

// USUÁRIO
let currentUserName = "Usuário Smart";
let currentUserEmail = "usuario@teste.com";
let currentUserAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

/* ==========================================================
   03 - ELEMENTOS DO DOM
   ========================================================== */

// BOTÕES
const compareButton = document.getElementById("compareButton");
const addToCartButton = document.getElementById("addToCartButton");
const discardButton = document.getElementById("discardButton");

// MODAIS
// const customModal = document.getElementById("custom-modal");
// const modalMessage = document.getElementById("modal-message");
// const modalConfirmBtn = document.getElementById("modal-confirm-btn");
// const modalCancelBtn = document.getElementById("modal-cancel-btn");

// FORMULÁRIOS
const unitSelect1 = document.getElementById("unit1");
const unitSelect2 = document.getElementById("unit2");

// CONFIGURAÇÕES
const themeToggleCheckbox = document.getElementById("theme-toggle-checkbox");

/* ==========================================================
   04 - NAVEGAÇÃO
   ========================================================== */

// GERENCIA A NAVEGAÇÃO ENTRE AS TELAS DO APP
window.navigateTo = function (targetScreenId) {
  const screens = [
    "screen-register",
    "screen-login",
    "screen-home",
    "screen-form",
    "screen-result",
    "screen-cart",
    // "screen-markets",
    "screen-history",
    "screen-history-details",
    "screen-settings",
  ];

  if (targetScreenId === "screen-form") {
    clearFormFields();
  }
  if (targetScreenId === "screen-home") {
    refreshHomeWelcome();
  }
  if (targetScreenId === "screen-settings") {
    syncSettingsFields();
  }
  if (targetScreenId === "screen-history") {
    carregarHistorico();
  }

  screens.forEach((screenId) => {
    const screenEl = document.getElementById(screenId);
    if (!screenEl) return;

    if (screenId === targetScreenId) {
      screenEl.classList.remove("hidden");
    } else {
      screenEl.classList.add("hidden");
    }
  });
};
// ATUALIZA A MENSAGEM DA TELA INICIAL
function refreshHomeWelcome() {
  const welcomeEl = document.getElementById("home-welcome-msg");
  if (welcomeEl) {
    welcomeEl.textContent = `Vamos às compras, ${currentUserName}!`;
  }
}

/* ==========================================================
   05- AUTENTICAÇÃO
   ========================================================== */

// OUVINTE DE SESSÃO: Mantém logado mesmo atualizando a página
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  console.log("EVENT:", event);

  console.time("AUTH");

  if (session) {
    const user = session.user;

    currentUserEmail = user.email || "";

    console.log("Usuário logado:", user.id);

    console.time("BUSCAR PERFIL");

    const inicio = performance.now();

    const { data: perfil, error } = await supabaseClient
      .from("perfis")
      .select("*")
      .eq("id", user.id)
      .single();

    console.timeEnd("BUSCAR PERFIL");
    console.log("Tempo consulta perfil:", performance.now() - inicio);

    console.log("Perfil encontrado:", perfil);
    console.log("Erro:", error);

    if (perfil) {
      currentUserName = perfil.display_name || "Usuário Smart";
      refreshHomeWelcome();

      currentUserAvatar =
        perfil.avatar_url ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    } else {
      // caso ainda não exista perfil, cria um
      const { error: insertError } = await supabaseClient
        .from("perfis")
        .insert({
          id: user.id,
          display_name: "Usuário Smart",
          avatar_url: currentUserAvatar,
        });
      if (insertError) {
        console.error("Erro criando perfil:", insertError);
      }
      currentUserName = "Usuário Smart";
    }

    console.log("Nome carregado:", currentUserName);

    console.time("CARRINHO");
    await carregarCarrinho();
    console.timeEnd("CARRINHO");

    console.time("MERCADOS");
    await carregarMercados();
    console.timeEnd("MERCADOS");

    console.timeEnd("AUTH");

    refreshHomeWelcome();

    const currentScreen = document.querySelector("section:not(.hidden)");

    if (
      currentScreen &&
      (currentScreen.id === "screen-register" ||
        currentScreen.id === "screen-login")
    ) {
      navigateTo("screen-home");
    }
  } else {
    navigateTo("screen-register");
  }
});

// CADASTRO E LOGIN
window.handleAuthAction = async function (type) {
  if (type === "cadastro") {
    const nameInput = document.getElementById("reg-name").value.trim();
    const emailInput = document.getElementById("reg-email").value.trim();
    const passwordInput = document.getElementById("reg-password").value;

    if (!emailInput || !passwordInput || !nameInput) {
      showToast("⚠️ Preencha todos os campos para o cadastro.", true);
      return;
    }

    showToast("⏳ Criando sua conta...");

    const { data, error } = await supabaseClient.auth.signUp({
      email: emailInput,
      password: passwordInput,
      options: {
        data: { full_name: nameInput },
      },
    });

    if (error) {
      showToast(`❌ ${error.message}`, true);
      return;
    }

    // CRIA O PERFIL NA TABELA PERFIS
    if (data.user) {
      const { error: perfilError } = await supabaseClient
        .from("perfis")
        .insert({
          id: data.user.id,
          display_name: nameInput,
          avatar_url: currentUserAvatar,
        });

      if (perfilError) {
        console.error("Erro criando perfil:", perfilError);
      }
    }
    if (error) {
      showToast(`❌ ${error.message}`, true);
      return;
    }
    showToast("✨ Conta criada com sucesso!");
  } else {
    const emailInput = document.getElementById("log-email").value.trim();
    const passwordInput = document.getElementById("log-password").value;

    if (!emailInput || !passwordInput) {
      showToast("⚠️ Preencha e-mail e senha.", true);
      return;
    }

    showToast("⏳ Validando credenciais...");

    console.time("LOGIN");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });

    console.timeEnd("LOGIN");

    if (error) {
      showToast(`❌ ${error.message}`, true);
      return;
    }
    showToast("🔒 Acesso liberado!");
  }
};

/* ==========================================================
   06 - PERFIL DO USUÁRIO
   ========================================================== */

// SALVAR ALTERAÇÕES DE PERFIL EM NUVEM
window.saveProfileChanges = async function () {
  const user = (await supabaseClient.auth.getUser()).data.user;

  if (!user) return;

  const nameInput = document.getElementById("user-display-name");

  const newName = nameInput.value.trim() || "Usuário Smart";

  showToast("⏳ Salvando alterações...");

  const { error } = await supabaseClient.from("perfis").upsert({
    id: user.id,
    display_name: newName,
    avatar_url: currentUserAvatar,
  });

  if (error) {
    console.log(error);
    showToast(error.message, true);
    return;
  }

  // Atualiza variável global
  currentUserName = newName;

  // Atualiza tela inicial
  const homeName = document.getElementById("home-welcome-msg");

  if (homeName) {
    homeName.innerText = `Vamos às compras, ${currentUserName}!`;
  }

  showToast("💾 Perfil atualizado na Nuvem!");

  navigateTo("screen-home");
};

window.handleLogout = async function () {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showToast(error.message, true);
    return;
  }

  cart = [];
  cartTotal = 0;

  showToast("👋 Sessão encerrada com segurança");
};

window.triggerAvatarUpload = function () {
  const fileInput = document.getElementById("avatar-input");
  if (fileInput) fileInput.click();
};

window.previewSelectedAvatar = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Image = e.target.result;
    currentUserAvatar = base64Image;

    const avatarImg = document.getElementById("settings-avatar-preview");
    if (avatarImg) avatarImg.src = base64Image;

    showToast("📸 Foto carregada! Clique em Salvar para subir na nuvem.");
  };
  reader.readAsDataURL(file);
};

window.updateGlobalName = function (newName) {
  currentUserName = newName.trim() || "Usuário Smart";

  // Atualiza imediatamente o nome na tela inicial
  const homeName = document.getElementById("home-welcome-msg");

  if (homeName) {
    homeName.innerText = `Vamos às compras, ${currentUserName}!`;
  }

  // Atualiza também dentro das configurações
  const profileName = document.getElementById("settings-profile-name");

  if (profileName) {
    profileName.innerText = currentUserName;
  }
};

function syncSettingsFields() {
  const nameLabel = document.getElementById("settings-profile-name");
  const displayName = document.getElementById("settings-display-name");
  const emailLabel = document.getElementById("settings-email");
  const avatarImg = document.getElementById("settings-avatar-preview");

  if (nameLabel) {
    nameLabel.textContent = currentUserName;
  }

  if (displayName) {
    displayName.textContent = currentUserName;
  }

  if (emailLabel) {
    emailLabel.textContent = currentUserEmail;
  }

  if (avatarImg) {
    avatarImg.src = currentUserAvatar;
  }
}

// ABRIR MODAL DE ALTERAÇÃO DE SENHA

window.openPasswordModal = function () {
  document.getElementById("password-modal").classList.remove("hidden");
};

// FECHAR MODAL DE ALTERAÇÃO DE SENHA
window.closePasswordModal = function () {
  document.getElementById("password-modal").classList.add("hidden");

  document.getElementById("current-password").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";
};

// ALTERAR SENHA

window.updatePassword = async function () {
  const currentPassword = document.getElementById("current-password").value;

  const newPassword = document.getElementById("new-password").value;

  const confirmPassword = document.getElementById("confirm-password").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast("Preencha todos os campos", true);
    return;
  }

  if (newPassword.length < 8) {
    showToast("A senha deve ter pelo menos 8 caracteres", true);
    return;
  }

  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword)
  ) {
    showToast(
      "A senha deve conter letras maiúsculas, minúsculas e números",
      true,
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("As senhas não conferem", true);
    return;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    showToast("Usuário não autenticado.", true);
    return;
  }

  showToast("⏳ Validando senha atual...");

  // 1. Valida a senha atual
  const { error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (loginError) {
    showToast("❌ A senha atual está incorreta.", true);
    return;
  }

  // 2. Altera a senha
  showToast("⏳ Atualizando senha...");

  const { error: updateError } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error(updateError);
    showToast(updateError.message, true);
    return;
  }

  showToast("✅ Senha alterada com sucesso!");

  closePasswordModal();
};
/* ==========================================================
   07 - TEMA
   ========================================================== */

// LÓGICA DE TEMA (CLARO / ESCURO)
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (themeToggleCheckbox) themeToggleCheckbox.checked = true;
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (themeToggleCheckbox) themeToggleCheckbox.checked = false;
  }
}

if (themeToggleCheckbox) {
  themeToggleCheckbox.addEventListener("change", function () {
    if (this.checked) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      showToast("🌙 Modo Noturno ativado");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      showToast("☀️ Modo Claro ativado");
    }
  });
}
initTheme();

/* ==========================================================
   08 - COMPARAÇÃO DE PRODUTOS
   ========================================================== */

// CAMPO ESCOLHA DE UNIDADES

const grupos = {
  kg: ["kg", "g"],
  g: ["kg", "g"],
  l: ["l", "ml"],
  ml: ["l", "ml"],
  un: ["un"],
};

function obterValorDaOpcao(option) {
  if (option.dataset.value) return option.dataset.value;

  // As opções do modal antigo guardam o valor apenas no onclick inline.
  const onclick = option.getAttribute("onclick") || "";
  const valor = onclick.match(/selectOption\('([^']+)'/);

  return valor ? valor[1] : "";
}

function obterTextoSelecionado(select) {
  return select.querySelector(".selected-text, #unit-selected-text");
}

function atualizarTextoSelecionado(select, texto) {
  const selectedText = obterTextoSelecionado(select);

  if (selectedText) selectedText.textContent = texto;
}

document.querySelectorAll(".custom-select").forEach((select) => {
  const selected = select.querySelector(".custom-select-selected");
  const options = select.querySelector(".custom-select-options");
  const hidden = select.querySelector("input");

  if (!selected || !options || !hidden) return;

  // O modal ainda possui handlers inline antigos. Eles apontam para funções
  // removidas e impedem que o componente compartilhado cuide da seleção.
  selected.removeAttribute("onclick");

  selected.addEventListener("click", () => {
    if (select.classList.contains("is-empty")) return;

    document.querySelectorAll(".custom-select").forEach((s) => {
      if (s !== select) s.classList.remove("open");
    });

    select.classList.toggle("open");
  });

  options.querySelectorAll("div").forEach((option) => {
    const value = obterValorDaOpcao(option);

    if (!value) return;

    option.removeAttribute("onclick");
    option.dataset.value = value;
  });

  // Usa delegação para que dropdowns preenchidos depois do carregamento,
  // como o seletor de mercados, recebam o mesmo comportamento visual.
  options.addEventListener("click", (event) => {
    const option = event.target.closest("div");

    if (!option || !options.contains(option)) return;

    const value = obterValorDaOpcao(option);

    if (!value) return;

    hidden.value = value;
    atualizarTextoSelecionado(select, option.textContent.trim());

    select.classList.remove("open");

    sincronizarUnidades();
  });
});

function sincronizarUnidades() {
  const unit1 = document.getElementById("unit1");
  const unit2 = document.getElementById("unit2");

  if (!unit1 || !unit2) return;

  atualizarDropdown(unit1, unit2);
  atualizarDropdown(unit2, unit1);
}

function atualizarDropdown(origem, destino) {
  if (!origem.value) {
    destino
      .closest(".custom-select")
      .querySelectorAll(".custom-select-options div")
      .forEach((op) => (op.style.display = "block"));

    return;
  }

  const permitidos = grupos[origem.value];

  const dropdownDestino = destino.closest(".custom-select");

  dropdownDestino
    .querySelectorAll(".custom-select-options div")
    .forEach((op) => {
      if (permitidos.includes(op.dataset.value)) {
        op.style.display = "block";
      } else {
        op.style.display = "none";
      }
    });

  if (!permitidos.includes(destino.value)) {
    destino.value = "";

    atualizarTextoSelecionado(dropdownDestino, "Selecione");
  }
}

// EVENTO DO BOTÃO COMPARAR

if (compareButton) {
  compareButton.addEventListener("click", function () {
    const product1 = getProductData(1);
    const product2 = getProductData(2);
    const p1Incompleto =
      !product1.price || !product1.quantity || !product1.unit;
    const p2Incompleto =
      !product2.price || !product2.quantity || !product2.unit;

    if (p1Incompleto && p2Incompleto) {
      showToast("⚠️ Preencha os dados dos dois produtos.", true);
      return;
    } else if (p1Incompleto) {
      showToast("⚠️ Preencha todos os dados do Produto 1.", true);
      return;
    } else if (p2Incompleto) {
      showToast("⚠️ Preencha todos os dados do Produto 2.", true);
      return;
    }

    const unitGroups = {
      kg: "peso",
      g: "peso",
      l: "volume",
      ml: "volume",
      un: "unidade",
    };
    if (unitGroups[product1.unit] !== unitGroups[product2.unit]) {
      showToast("⚠️ Não compare Peso com Volume.", true);
      return;
    }

    const comparison = compareProducts(product1, product2);
    if (comparison.winner === 1) {
      currentWinnerProduct = product1;
      showWinnerDetails(product1, comparison.unitPrice1);
      navigateTo("screen-result");
    } else if (comparison.winner === 2) {
      currentWinnerProduct = product2;
      showWinnerDetails(product2, comparison.unitPrice2);
      navigateTo("screen-result");
    } else {
      showDrawDetails(product1, product2, comparison.unitPrice1);
      navigateTo("screen-result");
    }
  });
}

// BOTÃO ADICIONAR VENCEDOR

if (addToCartButton) {
  addToCartButton.addEventListener("click", async function () {
    if (!currentWinnerProduct) return;

    const sucesso = await adicionarItemCarrinho(currentWinnerProduct);

    if (sucesso) {
      await carregarCarrinho();
      showToast(`🏆 ${currentWinnerProduct.name} adicionado!`);
    }

    clearFormFields();
    navigateTo("screen-form");

    currentWinnerProduct = null;
  });
}

// BOTÃO DESCARTAR COMPARAÇÃO

if (discardButton) {
  discardButton.addEventListener("click", function () {
    clearFormFields();
    navigateTo("screen-form");
    currentWinnerProduct = null;
  });
}

/* ==========================================================
   BUSCA DE PRODUTOS
   ========================================================== */

let selectedProduct = null;
let scanner = null;
let leituraEmAndamento = false;
let ultimaMensagemBuscaProduto = "";
let scannerDestination = "comparison";
let produtoEscaneadoParaCarrinho = null;

async function pararScanner(instanciaScanner) {
  if (!instanciaScanner) return;

  try {
    await instanciaScanner.stop();
  } catch (error) {
    // A câmera pode ainda não ter iniciado ou já ter sido encerrada.
  }

  try {
    await instanciaScanner.clear();
  } catch (error) {
    // Não impede o fechamento do modal caso a limpeza falhe.
  }
}

async function encerrarScannerAtivo() {
  const scannerAtivo = scanner;
  scanner = null;

  await pararScanner(scannerAtivo);
}

// ABRIR MODAL BUSCA

window.openProductSearch = function (productNumber) {
  selectedProduct = productNumber;
  scannerDestination = "comparison";

  document.getElementById("product-search-modal").classList.remove("hidden");
};

// FECHAR MODAL BUSCA

window.closeProductSearch = async function () {
  await encerrarScannerAtivo();
  document.getElementById("product-search-modal").classList.add("hidden");
};

// ABRIR BUSCA POR NOME

window.openNameSearch = async function () {
  await closeProductSearch();

  document.getElementById("name-search-modal").classList.remove("hidden");
};

// FECHAR BUSCA POR NOME

window.closeNameSearch = function () {
  document.getElementById("name-search-modal").classList.add("hidden");
};

// ABRIR SCANNER

window.openScanner = async function () {
  await closeProductSearch();

  document.getElementById("scanner-modal").classList.remove("hidden");

  await startBarcodeScanner();
};

window.openCartBarcodeScanner = async function () {
  scannerDestination = "cart";
  selectedProduct = null;

  document.getElementById("scanner-modal").classList.remove("hidden");
  await startBarcodeScanner();
};

// INICIAR CAMERA

window.startBarcodeScanner = async function () {
  if (scanner || leituraEmAndamento) return;

  const reader = document.getElementById("reader");
  if (!reader) return;

  reader.innerHTML = "";

  const novoScanner = new Html5Qrcode("reader");
  scanner = novoScanner;

  try {
    await novoScanner.start(
      {
        facingMode: "environment",
      },

      {
        fps: 10,
        qrbox: 250,
      },

      async (codigo) => {
        if (leituraEmAndamento || scanner !== novoScanner) return;

        leituraEmAndamento = true;

        try {
          console.log("Código encontrado:", codigo);

          await encerrarScannerAtivo();

          const produto = await buscarProdutoPorCodigo(codigo);

          if (scannerDestination === "cart") {
            document.getElementById("scanner-modal").classList.add("hidden");
            openScannedProductModal(produto || criarProdutoManual(codigo));
            return;
          }

          if (!produto) {
            showToast(
              ultimaMensagemBuscaProduto || "Produto não encontrado.",
              true,
            );
            return;
          }

          preencherProduto(selectedProduct, produto);
          showToast("Produto localizado!");
        } catch (error) {
          console.error("Erro ao processar código de barras:", error);
          showToast("Não foi possível buscar o produto.", true);
        } finally {
          document.getElementById("scanner-modal").classList.add("hidden");
          leituraEmAndamento = false;
        }
      },

      () => {
        // Ignora leituras parciais enquanto a câmera procura um código.
      },
    );
  } catch (error) {
    if (scanner === novoScanner) scanner = null;

    await pararScanner(novoScanner);
    document.getElementById("scanner-modal").classList.add("hidden");
    console.error("Erro ao iniciar scanner:", error);
    showToast("Não foi possível acessar a câmera.", true);
  }
};

// FECHAR SCANNER

window.closeScanner = async function () {
  await encerrarScannerAtivo();
  document.getElementById("scanner-modal").classList.add("hidden");
};

function criarProdutoManual(codigo) {
  return {
    codigo_barras: String(codigo || "").replace(/\D/g, ""),
    nome: "",
    marca: null,
    imagem_url: null,
    categoria: null,
    unidade_base: "un",
    quantidade: 1,
    naoEncontradoNaBase: true,
  };
}

function formatarMedidaProduto(produto) {
  const quantidade = Number(produto.quantidade);
  const unidade = produto.unidade_base || "un";

  if (!Number.isFinite(quantidade) || quantidade <= 0) return "";

  return `${quantidade} ${unidade}`;
}

function openScannedProductModal(produto) {
  produtoEscaneadoParaCarrinho = produto;

  const nomeDoProduto = produto.nome || "Produto não identificado";
  const imagem = document.getElementById("scanned-product-image");
  const placeholder = document.getElementById("scanned-product-placeholder");

  document.getElementById("scanned-product-title").textContent = nomeDoProduto;
  document.getElementById("scanned-product-brand").textContent = produto.marca || "";
  document.getElementById("scanned-product-info").textContent =
    formatarMedidaProduto(produto) || produto.categoria || "";
  document.getElementById("scanned-product-code").textContent = produto.codigo_barras
    ? `Código: ${produto.codigo_barras}`
    : "";

  const status = document.getElementById("scanned-product-status");
  status.textContent = produto.naoEncontradoNaBase
    ? "Este código ainda não está na base pública. Informe o nome, o preço e a quantidade para cadastrá-lo no seu carrinho."
    : "Confira as informações e informe o preço e a quantidade que deseja levar.";

  const nameInput = document.getElementById("scanned-product-name");
  nameInput.value = produto.nome || "";
  document.getElementById("scanned-product-price").value = "";
  document.getElementById("scanned-product-quantity").value = "1";

  imagem.onerror = () => {
    imagem.classList.add("hidden");
    placeholder.classList.remove("hidden");
  };

  if (produto.imagem_url) {
    imagem.src = produto.imagem_url;
    imagem.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } else {
    imagem.removeAttribute("src");
    imagem.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }

  document.getElementById("scanned-product-modal").classList.remove("hidden");
}

window.closeScannedProductModal = function () {
  document.getElementById("scanned-product-modal").classList.add("hidden");
  produtoEscaneadoParaCarrinho = null;
};

window.addScannedProductToCart = async function () {
  if (!produtoEscaneadoParaCarrinho) return;

  const name = document.getElementById("scanned-product-name").value.trim();
  const priceRaw = document.getElementById("scanned-product-price").value;
  const cartQuantity = Number(
    document.getElementById("scanned-product-quantity").value,
  );
  const price = Number(priceRaw);

  if (!name || priceRaw === "" || !Number.isFinite(price) || price < 0) {
    showToast("Informe o nome e um preço válido.", true);
    return;
  }

  if (!Number.isInteger(cartQuantity) || cartQuantity < 1) {
    showToast("Informe uma quantidade inteira maior que zero.", true);
    return;
  }

  const quantidadePorItem = Number(produtoEscaneadoParaCarrinho.quantidade) || 1;
  const product = {
    name,
    price,
    quantity: quantidadePorItem * cartQuantity,
    rawQuantity: quantidadePorItem * cartQuantity,
    cartQuantity,
    unit: produtoEscaneadoParaCarrinho.unidade_base || "un",
    codigoBarras: produtoEscaneadoParaCarrinho.codigo_barras || null,
  };

  const sucesso = await adicionarItemCarrinho(product);

  if (sucesso) {
    await carregarCarrinho();
    closeScannedProductModal();
    showToast(`🛒 ${product.name} adicionado!`);
  }
};

// BUSCA POR NOME

window.searchProductByName = async function () {
  const nameInput =
    document.getElementById("product-search-input") ||
    document.getElementById("product-name-search");

  if (!nameInput) return;

  const nome = nameInput.value.trim();

  if (!nome) {
    showToast("Digite um produto", true);

    return;
  }

  console.log("Buscando:", nome);

  const { data, error } = await supabaseClient

    .from("produtos")

    .select("*")

    .ilike("nome", `%${nome}%`)

    .limit(1);

  if (error || !data.length) {
    showToast("Produto não encontrado", true);

    return;
  }

  preencherProduto(selectedProduct, data[0]);

  closeNameSearch();

  showToast("Produto localizado!");
};

/* ==========================================================
   09 - PRODUTOS
   ========================================================== */

// MODAL DE ADIÇÃO DE PRODUTOS
const addProductModal = document.getElementById("add-product-modal");

// ABRIR MODAL
window.openAddProductModal = function () {
  if (!addProductModal) return;
  document.getElementById("modal-add-name").value = "";
  document.getElementById("modal-add-price").value = "";
  document.getElementById("modal-add-quantity").value = "1";
  document.getElementById("modal-add-unit").value = "un";
  atualizarTextoSelecionado(
    document.getElementById("modal-unit-dropdown"),
    "Unidade (un)",
  );
  document.getElementById("modal-unit-dropdown").classList.remove("open");

  addProductModal.classList.remove("hidden");
};
// FECHAR MODAL
window.closeAddProductModal = function () {
  if (addProductModal) addProductModal.classList.add("hidden");
};

// EVENTO BOTÃO NOVO PRODUTO
const openAddModalBtn = document.getElementById("open-add-modal-btn");
const openCartScannerBtn = document.getElementById("open-cart-scanner-btn");

if (openAddModalBtn)
  openAddModalBtn.addEventListener("click", window.openAddProductModal);

if (openCartScannerBtn)
  openCartScannerBtn.addEventListener("click", window.openCartBarcodeScanner);

// EVENTO BOTÃO NOVO PRODUTO
window.saveDirectProductFromModal = async function () {
  const nameInput = document.getElementById("modal-add-name").value.trim();

  const priceRaw = document.getElementById("modal-add-price").value;

  const quantityRaw = document.getElementById("modal-add-quantity").value;

  const unitInput = document.getElementById("modal-add-unit").value || "un";

  if (!priceRaw || !quantityRaw) {
    showToast("⚠️ Informe o preço e a quantidade.", true);
    return;
  }

  const finalPrice = Number(priceRaw);
  const finalQuantity = Number(quantityRaw);

  if (
    !Number.isFinite(finalPrice) ||
    finalPrice < 0 ||
    !Number.isInteger(finalQuantity) ||
    finalQuantity < 1
  ) {
    showToast("⚠️ Informe um preço válido e uma quantidade inteira maior que zero.", true);
    return;
  }

  const product = {
    name: nameInput || "Produto Avulso",

    // Preço de UMA unidade
    price: finalPrice,

    // Quantidade informada
    quantity: finalQuantity,

    // Diferencia itens avulsos de embalagens adicionadas pela comparação.
    // Cada unidade informada deve aparecer individualmente no carrinho.
    cartQuantity: finalQuantity,

    unit: unitInput,

    rawPrice: priceRaw,

    rawQuantity: quantityRaw,
  };

  const sucesso = await adicionarItemCarrinho(product);

  if (sucesso) {
    await carregarCarrinho();

    closeAddProductModal();

    showToast(`🛒 ${product.name} adicionado!`);
  }
};

window.addSelectedToCart = async function (productNum) {
  const chosenProduct =
    productNum === 1 ? getProductData(1) : getProductData(2);

  const sucesso = await adicionarItemCarrinho(chosenProduct);

  if (sucesso) {
    await carregarCarrinho();
    showToast(`🛒 ${chosenProduct.name} adicionado!`);
  }
  clearFormFields();

  navigateTo("screen-form");
};

window.cancelDraw = function () {
  clearFormFields();
  navigateTo("screen-form");
};

function clearFormFields() {
  clearSingleProductFields(1);
  clearSingleProductFields(2);
}

function clearSingleProductFields(productNum) {
  const n = document.getElementById(`name${productNum}`);
  const p = document.getElementById(`price${productNum}`);
  const q = document.getElementById(`quantity${productNum}`);
  const u = document.getElementById(`unit${productNum}`);

  if (n) n.value = "";
  if (p) p.value = "";
  if (q) q.value = "";

  if (u) {
    u.value = "";

    // volta o texto do dropdown
    const customSelect = document
      .getElementById(`unit${productNum}`)
      .closest(".custom-select");

    if (customSelect) {
      customSelect.querySelector(".selected-text").textContent = "Selecione";

      customSelect.classList.remove("open");
    }
  }
}

// PREENCHER FORMULARIO
function preencherProduto(numero, produto) {
  const nameInput = document.getElementById(`name${numero}`);
  const quantityInput = document.getElementById(`quantity${numero}`);
  const unitInput = document.getElementById(`unit${numero}`);

  if (nameInput) {
    nameInput.value = produto.nome;
  }

  if (quantityInput) {
    quantityInput.value = produto.quantidade || 1;
  }

  if (unitInput) {
    unitInput.value = produto.unidade_base;

    const customSelect = unitInput.closest(".custom-select");

    if (customSelect) {
      const selectedText = customSelect.querySelector(".selected-text");

      if (selectedText) {
        selectedText.textContent = produto.unidade_base.toUpperCase();
      }
    }
  }

  sincronizarUnidades();
}
window.scanBarcode = async function (numero) {
  const codigo = prompt("Digite o código de barras");

  if (!codigo) return;

  try {
    const produto = await buscarProdutoPorCodigo(codigo);

    if (!produto) {
      showToast(ultimaMensagemBuscaProduto || "Produto não encontrado.", true);
      return;
    }

    preencherProduto(numero, produto);
    showToast("Produto localizado!");
  } catch (error) {
    console.error("Erro ao buscar código de barras:", error);
    showToast("Não foi possível buscar o produto.", true);
  }
};

window.buscarProdutoCodigo = window.scanBarcode;

/* ==========================================================
   11 - FEEDBACK
   ========================================================== */

function showToast(message, isError = false) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  toast.textContent = message;
  if (isError) toast.classList.add("error");
  else toast.classList.remove("error");
  toast.classList.remove("hidden");
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("error");
  }, 2500);
}

/* ==========================================================
   12 - LOGIN SOCIAL
   ========================================================== */

window.loginWithGoogle = async function () {
  showToast("🌐 Redirecionando para o Google...");
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) showToast(`❌ ${error.message}`, true);
};

// ==========================================================
// 13 - BANCO DE DADOS
// ==========================================================

async function carregarCarrinho() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("itens_lista")
    .select(
      `
      id,
      nome,
      preco_total,
      preco_unitario,
      quantidade,
      quantidade_itens,
      unidade,
      economia,
      created_at
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    showToast("Erro ao carregar lista.", true);
    return;
  }

  cart = data || [];

  cartTotal = cart.reduce(
    (total, item) => total + Number(item.preco_total || 0),
    0,
  );

  updateCartUI(cart, cartTotal);
}

async function obterOuCriarProduto(produto) {
  const nomeLimpo = produto.name.toLowerCase().trim();

  const { data: existentes, error } = await supabaseClient
    .from("produtos")
    .select("id,nome")
    .ilike("nome", `%${nomeLimpo}%`)
    .limit(1);

  if (error) {
    console.error(error);
    return null;
  }

  if (existentes && existentes.length > 0) {
    return existentes[0].id;
  }

  const { data: novoProduto, error: erroCriacao } = await supabaseClient
    .from("produtos")
    .insert({
      nome: produto.name,
      unidade_base: produto.unit,
      codigo_barras: produto.codigoBarras || null,
    })
    .select("id")
    .single();

  if (erroCriacao) {
    console.error(erroCriacao);
    return null;
  }

  return novoProduto.id;
}

async function buscarItemExistente(produtoId) {
  const user = (await supabaseClient.auth.getUser()).data.user;

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

// ADICIONA UM PRODUTO À SACOLA

// ADICIONA UM PRODUTO À SACOLA
async function adicionarItemCarrinho(produto) {
  const produtoId = await obterOuCriarProduto(produto);

  if (!produtoId) {
    showToast("Erro ao localizar produto.", true);
    return false;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    showToast("Usuário não autenticado.", true);
    return false;
  }

  const itemExistente = await buscarItemExistente(produtoId);

  // IMPORTANTE:
  // Usa quantity como principal.
  // Se não existir, usa rawQuantity.
  const quantidadeAdicionada = Number(
    produto.quantity ?? produto.rawQuantity ?? 1,
  );

  const precoUnitario = Number(produto.price);

  if (!Number.isFinite(quantidadeAdicionada) || quantidadeAdicionada <= 0) {
    showToast("Quantidade inválida.", true);
    return false;
  }

  let error;

  // ==========================================================
  // ITEM JÁ EXISTE NO CARRINHO
  // ==========================================================
  if (itemExistente) {
    const novaQuantidade =
      Number(itemExistente.quantidade || 0) + quantidadeAdicionada;

    const novoPrecoTotal = precoUnitario * novaQuantidade;

    const { error: updateError } = await supabaseClient
      .from("itens_lista")
      .update({
        quantidade: novaQuantidade,
        quantidade_itens: novaQuantidade,
        preco_total: novoPrecoTotal,
        preco_unitario: precoUnitario,
      })
      .eq("id", itemExistente.id);

    error = updateError;
  }

  // ==========================================================
  // NOVO ITEM
  // ==========================================================
  else {
    const { error: insertError } = await supabaseClient
      .from("itens_lista")
      .insert({
        user_id: user.id,

        nome: produto.name,

        preco_total: precoUnitario * quantidadeAdicionada,

        preco_unitario: precoUnitario,

        quantidade: quantidadeAdicionada,

        quantidade_itens: quantidadeAdicionada,

        unidade: produto.unit,

        produto_id: produtoId,
      });

    error = insertError;
  }

  if (error) {
    console.error(error);
    showToast("Erro ao salvar produto.", true);
    return false;
  }

  await registrarHistorico(produto, produtoId);

  return true;
}

// REGISTRA HISTÓRICO DE PREÇOS

async function registrarHistorico(produto, produtoId, mercadoId = null) {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    console.error("Usuário não autenticado");
    return false;
  }

  const { error } = await supabaseClient.from("historico_precos").insert({
    user_id: user.id,
    produto_id: produtoId,
    mercado_id: mercadoId,
    preco: Number(produto.price),
    quantidade: Number(produto.rawQuantity),
    unidade: produto.unit,
    observacao: null,
  });

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

// AUMENTA QUANTIDADE DE UM ITEM DA SACOLA
window.increaseItem = async function (id) {
  const item = cart.find((item) => item.id === id);

  if (!item) return;

  const quantidadeDeItens = Number(item.quantidade_itens || 1);
  const quantidadePorItem = Number(item.quantidade || 0) / quantidadeDeItens;
  const novaQuantidadeDeItens = quantidadeDeItens + 1;

  const { error } = await supabaseClient
    .from("itens_lista")
    .update({
      quantidade: Number(item.quantidade || 0) + quantidadePorItem,
      quantidade_itens: novaQuantidadeDeItens,
      preco_total: Number(item.preco_unitario) * novaQuantidadeDeItens,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  await carregarCarrinho();
};

// DIMINUI QUANTIDADE DE UM ITEM DA SACOLA
window.decreaseItem = async function (id) {
  const item = cart.find((item) => item.id === id);

  if (!item) return;

  const quantidadeDeItens = Number(item.quantidade_itens || 1);
  const novaQuantidade = quantidadeDeItens - 1;

  if (novaQuantidade <= 0) {
    await removerItemCarrinho(id);
  } else {
    const quantidadePorItem = Number(item.quantidade || 0) / quantidadeDeItens;

    await supabaseClient
      .from("itens_lista")
      .update({
        quantidade: Number(item.quantidade || 0) - quantidadePorItem,
        quantidade_itens: novaQuantidade,
        preco_total: Number(item.preco_unitario) * novaQuantidade,
      })
      .eq("id", id);
  }

  await carregarCarrinho();
};

window.removeFromCart = function (id) {
  itemIndexToDelete = {
    id: id,
  };

  openCustomModal();
};

// ESVAZIA A SACOLA DO USUÁRIO
window.clearCart = async function () {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient
    .from("itens_lista")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    showToast("Erro ao esvaziar a sacola.", true);
    return;
  }

  cart = [];
  cartTotal = 0;

  updateCartUI(cart, cartTotal);

  showToast("Sacola esvaziada.");
};

// ABRIR MODAL ALTERAÇÃO DE NOME
window.openNameModal = function () {
  document.getElementById("new-display-name").value = currentUserName;

  document.getElementById("name-modal").classList.remove("hidden");
};

// FECHAR MODAL ALTERAÇÃO DE NOME
window.closeNameModal = function () {
  document.getElementById("name-modal").classList.add("hidden");
};

// ATUALIZAR NOME DO PERFIL
window.updateName = async function () {
  const newName = document.getElementById("new-display-name").value.trim();

  if (!newName) {
    showToast("Digite um nome", true);
    return;
  }

  const user = (await supabaseClient.auth.getUser()).data.user;

  await supabaseClient
    .from("perfis")
    .update({
      display_name: newName,
    })
    .eq("id", user.id);

  currentUserName = newName;

  // atualiza nome ao lado da foto
  const profileName = document.getElementById("settings-profile-name");

  if (profileName) {
    profileName.textContent = newName;
  }

  // atualiza nome de exibição
  const displayName = document.getElementById("settings-display-name");

  if (displayName) {
    displayName.textContent = newName;
  }

  // atualiza tela inicial
  refreshHomeWelcome();

  closeNameModal();

  showToast("Nome atualizado!");
};

// BUSCA O PRODUTO POR CÓDIGO
// Primeiro consulta o cache em produtos. A API só é usada quando o código
// ainda não existe no banco.
async function buscarProdutoPorCodigo(codigo) {
  ultimaMensagemBuscaProduto = "";

  const codigoNormalizado = String(codigo || "").replace(/\D/g, "");

  if (!/^(?:\d{8}|\d{12,14})$/.test(codigoNormalizado)) {
    ultimaMensagemBuscaProduto = "Código de barras inválido.";
    return null;
  }

  const produtoNoCache = await buscarProdutoNoCache(codigoNormalizado);

  if (produtoNoCache) {
    console.log("Produto encontrado no cache do Supabase.");
    return produtoNoCache;
  }

  try {
    console.log("Produto não está no cache. Consultando API...");

    const campos = [
      "code",
      "product_name_pt",
      "product_name",
      "brands",
      "image_front_url",
      "image_url",
      "categories",
      "quantity",
    ].join(",");

    const resposta = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${codigoNormalizado}.json?fields=${campos}`,
      { headers: { Accept: "application/json" } },
    );

    if (resposta.status === 404) {
      ultimaMensagemBuscaProduto = "Produto não encontrado.";
      return null;
    }

    if (!resposta.ok) {
      throw new Error(`API respondeu com status ${resposta.status}`);
    }

    const resultado = await resposta.json();

    if (resultado.status !== 1 || !resultado.product) {
      ultimaMensagemBuscaProduto = "Produto não encontrado.";
      return null;
    }

    const produtoDaAPI = normalizarProduto(
      codigoNormalizado,
      resultado.product,
    );

    // O retorno da API continua sendo utilizável mesmo se o cache falhar.
    return await salvarProdutoNoCache(produtoDaAPI);
  } catch (error) {
    console.error("Erro consultando API de produtos:", error);
    ultimaMensagemBuscaProduto = "Não foi possível consultar o produto agora.";
    return null;
  }
}

async function buscarProdutoNoCache(codigo) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .eq("codigo_barras", codigo)
    .maybeSingle();

  if (error) {
    console.error("Erro consultando cache de produtos:", error);
    return null;
  }

  return data ? normalizarProduto(codigo, data) : null;
}

async function salvarProdutoNoCache(produto) {
  // Uma segunda consulta evita criar uma cópia caso outra leitura tenha
  // terminado entre a primeira busca e o retorno da API.
  const produtoExistente = await buscarProdutoNoCache(produto.codigo_barras);

  if (produtoExistente) return produtoExistente;

  const { data, error } = await supabaseClient
    .from("produtos")
    .insert({
      codigo_barras: produto.codigo_barras,
      nome: produto.nome,
      unidade_base: produto.unidade_base,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Erro salvando produto no cache:", error);

    // Em caso de disputa de gravação, tenta aproveitar o registro salvo pela
    // outra requisição. Se o cache realmente falhou, ainda usa a resposta da API.
    return (await buscarProdutoNoCache(produto.codigo_barras)) || produto;
  }

  // A tabela de cache armazena os campos essenciais. Mantém a resposta
  // completa da API nesta leitura para exibir foto, marca e medida no modal.
  return produto;
}

function normalizarProduto(codigo, produto) {
  const quantidadeInformada = Number(
    produto.quantidade ?? produto.product_quantity,
  );
  const quantidade =
    Number.isFinite(quantidadeInformada) && quantidadeInformada > 0
      ? quantidadeInformada
      : obterQuantidadeProduto(produto);

  return {
    codigo_barras: codigo,
    nome:
      produto.nome ||
      produto.product_name_pt ||
      produto.product_name ||
      "Produto sem nome",
    marca: produto.marca || produto.brands || null,
    imagem_url:
      produto.imagem_url ||
      produto.image_url ||
      produto.image_front_url ||
      null,
    categoria: produto.categoria || produto.categories || null,
    unidade_base: produto.unidade_base || obterUnidadeProduto(produto),
    quantidade,
  };
}

function obterUnidadeProduto(produto) {
  const quantidade = String(
    produto.quantidade ?? produto.product_quantity ?? produto.quantity ?? "",
  ).toLowerCase();

  if (quantidade.includes("kg")) {
    return "g";
  }

  if (quantidade.includes("ml")) {
    return "ml";
  }

  if (quantidade.includes("l")) {
    return "ml";
  }

  if (quantidade.includes("g")) {
    return "g";
  }

  return "un";
}

function obterQuantidadeProduto(produto) {
  const quantidade = String(
    produto.quantidade ?? produto.product_quantity ?? produto.quantity ?? "",
  );

  const match = quantidade.match(/[\d.,]+/);

  if (!match) {
    return 1;
  }

  let valor = match[0];

  if (valor.includes(",") && valor.includes(".")) {
    valor = valor.replace(/\./g, "").replace(",", ".");
  } else if (valor.includes(",")) {
    valor = valor.replace(",", ".");
  }

  return Number(valor);
}
// ==========================================================
// 14 - MODAIS / INTERAÇÕES DA INTERFACE
// ==========================================================

console.log("app.js carregado");
console.log(typeof openPasswordModal);

// MODAL LIMPAR SACOLA
function openClearCartModal() {
  document.getElementById("modal-message").textContent =
    "Todos os produtos serão removidos da sua lista.";

  document.querySelector(".modal-icon").textContent = "🧹";

  document.querySelector("#custom-modal h3").textContent = "Esvaziar sacola";

  document.getElementById("modal-confirm-btn").onclick = async () => {
    closeCustomModal();

    await clearCart();
  };

  document.getElementById("custom-modal").classList.remove("hidden");
}
