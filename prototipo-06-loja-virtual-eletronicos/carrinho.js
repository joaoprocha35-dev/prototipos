const Store = window.MobileProStore;
const whatsappNumber = "5514998813787";
const formStorageKey = "mobilepro_checkout_form_v1";

let products = [];

document.addEventListener("DOMContentLoaded", () => {
  products = Store.loadProducts();
  renderCartPage();
  restoreForm();
  initMasks();
  initFormPersistence();
  initCheckout();
});

window.addEventListener("storage", (event) => {
  if ([Store.keys.products, Store.keys.cart].includes(event.key)) {
    products = Store.loadProducts();
    renderCartPage();
  }
});

function renderCartPage() {
  const summary = Store.getCartSummary(products);
  const emptyState = document.getElementById("cartEmptyState");
  const checkoutLayout = document.getElementById("checkoutLayout");
  const headerCounter = document.getElementById("headerCartCount");
  const itemsLabel = document.getElementById("cartItemsLabel");
  const itemsContainer = document.getElementById("cartPageItems");

  headerCounter.textContent = String(summary.totalItems);
  itemsLabel.textContent = `${summary.totalItems} ${summary.totalItems === 1 ? "item" : "itens"}`;

  if (!summary.items.length) {
    emptyState.hidden = false;
    checkoutLayout.hidden = true;
    updateSummary(summary);
    return;
  }

  emptyState.hidden = true;
  checkoutLayout.hidden = false;
  itemsContainer.innerHTML = "";

  summary.items.forEach(({ product, quantity, subtotal }, index) => {
    const card = document.createElement("article");
    card.className = "cart-product-card";
    card.style.animationDelay = `${Math.min(index * 70, 360)}ms`;
    card.innerHTML = `
      <div class="cart-product-media">
        <img src="${product.image}" alt="${product.name}" width="${product.width}" height="${product.height}">
      </div>
      <div class="cart-product-info">
        <span class="cart-product-category">${product.category}</span>
        <h3>${product.name}</h3>
        <p>Valor unitário: <strong>${Store.displayPrice(product)}</strong></p>
        <p>Subtotal: <strong>${Store.formatCurrency(subtotal)}</strong></p>
      </div>
      <div class="cart-product-actions">
        <div class="qty-control" aria-label="Quantidade de ${product.name}">
          <button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="Diminuir quantidade de ${product.name}" ${quantity <= 1 ? "disabled" : ""}>
            <i class="bi bi-dash" aria-hidden="true"></i>
          </button>
          <span>${quantity}</span>
          <button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="Aumentar quantidade de ${product.name}">
            <i class="bi bi-plus" aria-hidden="true"></i>
          </button>
        </div>
        <button class="remove-item-btn" type="button" data-remove-cart="${product.id}">Remover</button>
      </div>
    `;
    itemsContainer.appendChild(card);
  });

  updateSummary(summary);
}

document.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-cart-action]");
  if (quantityButton) {
    Store.changeCartQuantity(quantityButton.dataset.productId, quantityButton.dataset.cartAction);
    renderCartPage();
    return;
  }

  const removeButton = event.target.closest("[data-remove-cart]");
  if (removeButton) {
    Store.removeFromCart(removeButton.dataset.removeCart);
    renderCartPage();
    showToast("Produto removido do carrinho.");
  }
});

function updateSummary(summary) {
  document.getElementById("summaryProductsLabel").textContent = `Produtos (${summary.totalItems} ${summary.totalItems === 1 ? "item" : "itens"})`;
  document.getElementById("summarySubtotal").textContent = Store.formatCurrency(summary.subtotal);
  document.getElementById("summaryTotal").textContent = Store.formatCurrency(summary.subtotal);
}

function initMasks() {
  const phone = document.getElementById("customerPhone");
  const cep = document.getElementById("customerCep");

  phone.addEventListener("input", () => {
    const value = phone.value.replace(/\D/g, "").slice(0, 11);
    const first = value.slice(0, 2);
    const middle = value.length > 10 ? value.slice(2, 7) : value.slice(2, 6);
    const last = value.length > 10 ? value.slice(7, 11) : value.slice(6, 10);
    phone.value = value.length > 6 ? `(${first}) ${middle}-${last}` : value.length > 2 ? `(${first}) ${middle}` : value;
  });

  cep.addEventListener("input", () => {
    const value = cep.value.replace(/\D/g, "").slice(0, 8);
    cep.value = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
  });
}

function initFormPersistence() {
  document.getElementById("checkoutForm").addEventListener("input", () => {
    sessionStorage.setItem(formStorageKey, JSON.stringify(getFormData()));
  });
}

function restoreForm() {
  const saved = JSON.parse(sessionStorage.getItem(formStorageKey) || "{}");
  Object.entries(saved).forEach(([name, value]) => {
    const field = document.querySelector(`[name="${name}"]`);
    if (!field) {
      return;
    }

    if (field.type === "radio") {
      document.querySelector(`[name="${name}"][value="${value}"]`)?.click();
      return;
    }

    field.value = value;
  });
}

function initCheckout() {
  document.getElementById("checkoutForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const summary = Store.getCartSummary(products);
    if (!summary.items.length) {
      showToast("Seu carrinho está vazio.");
      return;
    }

    const validation = validateForm();
    if (!validation.valid) {
      showToast("Revise os campos obrigatórios antes de finalizar.");
      validation.firstInvalid?.focus();
      return;
    }

    const message = buildWhatsappMessage(summary, getFormData());
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  });
}

function getFormData() {
  const form = document.getElementById("checkoutForm");
  const data = Object.fromEntries(new FormData(form).entries());
  data.paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || "";
  return data;
}

function validateForm() {
  clearErrors();
  const data = getFormData();
  const errors = {};

  if (!data.customerName?.trim()) errors.customerName = "Informe seu nome completo.";
  if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.customerPhone || "")) errors.customerPhone = "Informe um telefone válido.";
  if (!/^\d{5}-?\d{3}$/.test(data.customerCep || "")) errors.customerCep = "Informe um CEP válido.";
  if (!data.customerStreet?.trim()) errors.customerStreet = "Informe a rua ou avenida.";
  if (!data.customerNumber?.trim()) errors.customerNumber = "Informe o número.";
  if (!data.customerDistrict?.trim()) errors.customerDistrict = "Informe o bairro.";
  if (!data.customerCity?.trim()) errors.customerCity = "Informe a cidade.";
  if (!data.customerState?.trim()) errors.customerState = "Selecione o estado.";
  if (!data.paymentMethod) errors.paymentMethod = "Selecione uma forma de pagamento.";

  let firstInvalid = null;
  Object.entries(errors).forEach(([field, message]) => {
    const errorElement = document.querySelector(`[data-error-for="${field}"]`);
    const input = document.querySelector(`[name="${field}"]`);
    if (errorElement) {
      errorElement.textContent = message;
    }
    firstInvalid ||= input;
  });

  return {
    valid: Object.keys(errors).length === 0,
    firstInvalid,
  };
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function buildWhatsappMessage(summary, data) {
  const lines = [];
  lines.push("NOVO PEDIDO — MOBILEPRO", "");
  lines.push("Olá! Gostaria de realizar um pedido na loja MobilePro.", "");
  lines.push("PRODUTOS SELECIONADOS", "");

  summary.items.forEach(({ product, quantity, subtotal }, index) => {
    lines.push(`${index + 1}. ${product.name}`);
    lines.push(`   Quantidade: ${quantity}`);
    lines.push(`   Valor unitário: ${Store.displayPrice(product)}`);
    lines.push(`   Subtotal: ${Store.formatCurrency(subtotal)}`);
    const imageUrl = Store.publicImageUrl(product);
    if (imageUrl) {
      lines.push(`   Imagem do produto: ${imageUrl}`);
    }
    lines.push("");
  });

  lines.push("RESUMO DO PEDIDO", "");
  lines.push(`Total de produtos: ${summary.totalItems}`);
  lines.push(`Total dos produtos: ${Store.formatCurrency(summary.subtotal)}`);
  lines.push("Frete: A combinar", "");
  lines.push("DADOS DO CLIENTE", "");
  lines.push(`Nome: ${data.customerName}`);
  lines.push(`Telefone: ${data.customerPhone}`, "");
  lines.push("ENDEREÇO DE ENTREGA", "");
  lines.push(`CEP: ${data.customerCep}`);
  lines.push(`Rua: ${data.customerStreet}`);
  lines.push(`Número: ${data.customerNumber}`);
  lines.push(`Bairro: ${data.customerDistrict}`);
  lines.push(`Cidade: ${data.customerCity}`);
  lines.push(`Estado: ${data.customerState}`);
  lines.push(`Complemento: ${data.customerComplement?.trim() || "Não informado"}`, "");
  lines.push("FORMA DE PAGAMENTO", "");
  lines.push(data.paymentMethod, "");
  lines.push("OBSERVAÇÕES", "");
  lines.push(data.orderNotes?.trim() || "Nenhuma observação.");
  lines.push("", "Gostaria de confirmar a disponibilidade dos produtos, o valor do frete e as condições de pagamento.", "", "Obrigado!");

  return lines.join("\n");
}

function showToast(message) {
  const toastElement = document.getElementById("cartToast");
  const toastMessage = document.getElementById("cartToastMessage");
  toastMessage.textContent = message;

  if (window.bootstrap) {
    bootstrap.Toast.getOrCreateInstance(toastElement).show();
    return;
  }

  toastElement.classList.add("show");
  window.clearTimeout(showToast.hideTimer);
  showToast.hideTimer = window.setTimeout(() => toastElement.classList.remove("show"), 2800);
}
