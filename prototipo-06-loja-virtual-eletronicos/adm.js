const Store = window.MobileProStore;

let products = [];
let categories = [];
let editingProductId = "";
let pendingDeleteId = "";
let selectedProductImage = "";
const sidebarMedia = window.matchMedia("(max-width: 980px)");

document.addEventListener("DOMContentLoaded", () => {
  products = Store.loadProducts();
  categories = Store.loadCategories();
  bindEvents();
  updateSidebarToggle();
  populateCategoryControls();
  renderDashboard();
});

window.addEventListener("storage", (event) => {
  if ([Store.keys.products, Store.keys.categories].includes(event.key)) {
    products = Store.loadProducts();
    categories = Store.loadCategories();
    populateCategoryControls();
    renderDashboard();
  }
});

function bindEvents() {
  document.querySelectorAll("[data-open-product-modal]").forEach((button) => {
    button.addEventListener("click", () => openProductModal());
  });
  document.querySelectorAll("[data-close-product-modal]").forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });
  document.querySelectorAll("[data-close-delete-modal]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("confirmDelete").addEventListener("click", deleteProduct);
  document.getElementById("adminSearch").addEventListener("input", renderProducts);
  document.getElementById("categoryFilter").addEventListener("change", renderProducts);
  document.getElementById("availabilityFilter").addEventListener("change", renderProducts);
  document.getElementById("categoryForm").addEventListener("submit", saveCategory);
  document.querySelector("[data-toggle-sidebar]").addEventListener("click", toggleSidebar);
  document.querySelectorAll("[data-close-sidebar]").forEach((button) => {
    button.addEventListener("click", closeSidebar);
  });
  document.querySelectorAll(".admin-sidebar .sidebar-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (sidebarMedia.matches) {
        closeSidebar();
      }
    });
  });
  sidebarMedia.addEventListener("change", resetSidebarState);

  document.getElementById("productImageFile").addEventListener("change", previewSelectedImage);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProductModal();
      closeDeleteModal();
      closeSidebar();
    }
  });
}

function getSidebarElements() {
  return {
    shell: document.getElementById("adminShell"),
    toggle: document.querySelector("[data-toggle-sidebar]"),
  };
}

function toggleSidebar() {
  const { shell } = getSidebarElements();

  if (sidebarMedia.matches) {
    shell.classList.toggle("sidebar-open");
  } else {
    shell.classList.toggle("sidebar-collapsed");
  }

  updateSidebarToggle();
}

function closeSidebar() {
  const { shell } = getSidebarElements();

  if (sidebarMedia.matches) {
    shell.classList.remove("sidebar-open");
  } else {
    shell.classList.add("sidebar-collapsed");
  }

  updateSidebarToggle();
}

function resetSidebarState() {
  const { shell } = getSidebarElements();
  shell.classList.remove("sidebar-open");
  shell.classList.remove("sidebar-collapsed");
  updateSidebarToggle();
}

function updateSidebarToggle() {
  const { shell, toggle } = getSidebarElements();
  const isExpanded = sidebarMedia.matches
    ? shell.classList.contains("sidebar-open")
    : !shell.classList.contains("sidebar-collapsed");

  toggle.setAttribute("aria-expanded", String(isExpanded));
  toggle.setAttribute("aria-label", isExpanded ? "Fechar menu administrativo" : "Abrir menu administrativo");
}

function populateCategoryControls() {
  const categoryFilter = document.getElementById("categoryFilter");
  const productCategory = document.getElementById("productCategory");
  categoryFilter.innerHTML = `<option value="all">Todas as categorias</option>`;
  productCategory.innerHTML = "";

  categories.forEach((category) => {
    categoryFilter.insertAdjacentHTML("beforeend", `<option value="${category.name}">${category.name}</option>`);
    productCategory.insertAdjacentHTML("beforeend", `<option value="${category.name}">${category.name}</option>`);
  });
}

function renderDashboard() {
  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statAvailable").textContent = products.filter((product) => product.available).length;
  document.getElementById("statCategories").textContent = categories.length;
  renderProducts();
  renderCategories();
}

function renderProducts() {
  const grid = document.getElementById("adminProductGrid");
  const empty = document.getElementById("adminEmptyState");
  const query = document.getElementById("adminSearch").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const availability = document.getElementById("availabilityFilter").value;

  const filtered = products.filter((product) => {
    const matchQuery = !query || `${product.name} ${product.category}`.toLowerCase().includes(query);
    const matchCategory = category === "all" || product.category === category;
    const matchAvailability =
      availability === "all" ||
      (availability === "available" && product.available) ||
      (availability === "unavailable" && !product.available);
    return matchQuery && matchCategory && matchAvailability;
  });

  grid.innerHTML = "";
  empty.hidden = filtered.length > 0;

  filtered.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "admin-product-card";
    card.style.animationDelay = `${Math.min(index * 55, 380)}ms`;
    card.innerHTML = `
      <div class="admin-product-media">
        <img src="${product.image}" alt="${product.name}" width="${product.width}" height="${product.height}">
      </div>
      <span class="status-pill ${product.available ? "available" : "unavailable"}">${product.available ? "Disponível" : "Indisponível"}</span>
      <h3>${product.name}</h3>
      <div class="admin-product-meta">
        <span>${product.category}</span>
        <strong>${Store.displayPrice(product)}</strong>
      </div>
      <div class="card-actions">
        <button type="button" data-edit-product="${product.id}">Editar</button>
        <button type="button" data-delete-product="${product.id}">Excluir</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", () => openProductModal(button.dataset.editProduct));
  });
  grid.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => openDeleteModal(button.dataset.deleteProduct));
  });
}

function renderCategories() {
  const grid = document.getElementById("adminCategoryGrid");
  grid.innerHTML = "";

  categories.forEach((category) => {
    const count = products.filter((product) => product.category === category.name).length;
    const card = document.createElement("article");
    card.className = "admin-category-card";
    card.innerHTML = `
      <img src="${category.image}" alt="${category.alt}" width="120" height="120">
      <div>
        <strong>${category.name}</strong>
        <p>${count} ${count === 1 ? "produto" : "produtos"}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openProductModal(productId = "") {
  editingProductId = productId;
  const modal = document.getElementById("productModal");
  const title = document.getElementById("productModalTitle");
  const message = document.getElementById("productFormMessage");
  const product = products.find((item) => item.id === productId);
  selectedProductImage = "";

  document.getElementById("productForm").reset();
  document.getElementById("productId").value = productId;
  document.getElementById("productAvailable").checked = true;
  document.getElementById("productFeatured").checked = true;
  document.getElementById("productPreview").hidden = true;
  document.getElementById("previewHint").hidden = false;
  message.textContent = "";

  if (product) {
    title.textContent = "Editar produto";
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = Store.formatCurrency(product.price);
    document.getElementById("productImage").value = product.image;
    selectedProductImage = product.image;
    document.getElementById("productDescription").value = product.description || "";
    document.getElementById("productAvailable").checked = product.available;
    document.getElementById("productFeatured").checked = product.featured;
    document.getElementById("productPromotional").checked = product.promotional;
    document.getElementById("productPreview").src = product.image;
    document.getElementById("productPreview").hidden = false;
    document.getElementById("previewHint").hidden = true;
  } else {
    title.textContent = "Adicionar produto";
  }

  modal.hidden = false;
  document.getElementById("productName").focus();
}

function closeProductModal() {
  document.getElementById("productModal").hidden = true;
}

function saveProduct(event) {
  event.preventDefault();
  const message = document.getElementById("productFormMessage");
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = Store.toNumber(document.getElementById("productPrice").value);
  const image = selectedProductImage || document.getElementById("productImage").value.trim();

  if (!name || !category || price < 0 || !image) {
    message.textContent = "Preencha nome, categoria, preço válido e selecione uma imagem do produto.";
    return;
  }

  const current = products.find((product) => product.id === editingProductId);
  const nextProduct = Store.normalizeProduct({
    id: current?.id || Store.makeId(name),
    name,
    category,
    price,
    image,
    description: document.getElementById("productDescription").value.trim(),
    available: document.getElementById("productAvailable").checked,
    featured: document.getElementById("productFeatured").checked,
    promotional: document.getElementById("productPromotional").checked,
    width: current?.width || 800,
    height: current?.height || 800,
  });

  if (current) {
    products = products.map((product) => (product.id === current.id ? nextProduct : product));
    showToast("Produto atualizado com sucesso.");
  } else {
    products = [nextProduct, ...products];
    showToast("Produto cadastrado com sucesso.");
  }

  Store.saveProducts(products);
  closeProductModal();
  renderDashboard();
}

function openDeleteModal(productId) {
  pendingDeleteId = productId;
  document.getElementById("deleteModal").hidden = false;
}

function closeDeleteModal() {
  pendingDeleteId = "";
  document.getElementById("deleteModal").hidden = true;
}

function deleteProduct() {
  if (!pendingDeleteId) {
    return;
  }

  products = products.filter((product) => product.id !== pendingDeleteId);
  const cart = Store.loadCart().filter((item) => item.id !== pendingDeleteId);
  Store.saveProducts(products);
  Store.saveCart(cart);
  closeDeleteModal();
  renderDashboard();
  showToast("Produto excluído do catálogo demonstrativo.");
}

function saveCategory(event) {
  event.preventDefault();
  const name = document.getElementById("categoryName").value.trim();
  const image = document.getElementById("categoryImage").value.trim() || "./categorias/categoria-iphone.png";

  if (!name) {
    showToast("Informe o nome da categoria.");
    return;
  }

  if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    showToast("Essa categoria já existe.");
    return;
  }

  categories = [
    ...categories,
    Store.normalizeCategory({
      id: Store.makeId(name),
      name,
      image,
      alt: `Categoria ${name}`,
    }),
  ];

  Store.saveCategories(categories);
  document.getElementById("categoryForm").reset();
  populateCategoryControls();
  renderDashboard();
  showToast("Categoria adicionada com sucesso.");
}

function previewSelectedImage(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("Selecione um arquivo de imagem válido.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedProductImage = reader.result;
    document.getElementById("productImage").value = file.name;

    const preview = document.getElementById("productPreview");
    preview.src = selectedProductImage;
    preview.hidden = false;
    document.getElementById("previewHint").hidden = true;
    showToast("Imagem carregada. Ao salvar, ela aparecerá na tela principal.");
  });
  reader.readAsDataURL(file);
}

function showToast(message) {
  const toastElement = document.getElementById("adminToast");
  const toastMessage = document.getElementById("adminToastMessage");
  toastMessage.textContent = message;

  if (window.bootstrap) {
    bootstrap.Toast.getOrCreateInstance(toastElement).show();
    return;
  }

  toastElement.classList.add("show");
  window.clearTimeout(showToast.hideTimer);
  showToast.hideTimer = window.setTimeout(() => toastElement.classList.remove("show"), 2600);
}
