const heroImages = {
  desktop: "url('./hero-desketop.png')",
  mobile: "url('./hero-celular.png')",
};

const promoImages = {
  desktop: "url('./card-desconto-desketop.png')",
  mobile: "url('./card-desconto-celular.png')",
};

const Store = window.MobileProStore;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileImageQuery = window.matchMedia("(max-width: 767px)");

let products = [];
let categories = [];
let revealObserver = null;
let promoAnimationStarted = false;

document.addEventListener("DOMContentLoaded", () => {
  products = Store.loadProducts();
  categories = Store.loadCategories();

  initResponsiveBackgrounds();
  initIconFallbacks();
  initRevealAnimations();
  initSearch();
  initComponentFallbacks();
  initNavigation();
  initCart();
  initPromoAnimations();
  renderCategories(categories);
  renderProducts(getVisibleProducts());
});

window.addEventListener("storage", (event) => {
  if ([Store.keys.products, Store.keys.categories, Store.keys.cart].includes(event.key)) {
    products = Store.loadProducts();
    categories = Store.loadCategories();
    renderCategories(categories);
    renderProducts(getVisibleProducts());
    updateCartUI();
  }
});

function initResponsiveBackgrounds() {
  const updateImages = () => {
    const isMobile = mobileImageQuery.matches;
    document.documentElement.style.setProperty("--hero-image", isMobile ? heroImages.mobile : heroImages.desktop);
    document.documentElement.style.setProperty("--promo-image", isMobile ? promoImages.mobile : promoImages.desktop);
  };

  updateImages();
  mobileImageQuery.addEventListener("change", updateImages);
  document.querySelector(".hero-section")?.classList.add("hero-bg-ready");
}

function initIconFallbacks() {
  const iconProbe = document.querySelector(".bi-search");
  if (!iconProbe) {
    return;
  }

  const iconContent = getComputedStyle(iconProbe, "::before").content;
  if (!iconContent || iconContent === "none" || iconContent === "normal" || iconContent === '""') {
    document.body.classList.add("icons-fallback");
  }
}

function initRevealAnimations() {
  if (prefersReducedMotion.matches) {
    document.querySelectorAll(".reveal-item").forEach((item) => item.classList.add("is-visible"));
    return;
  }

  document.body.classList.add("motion-ready");

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          const delay = Number.parseInt(getComputedStyle(entry.target).getPropertyValue("--reveal-delay"), 10) || 0;
          window.setTimeout(() => {
            entry.target.style.setProperty("--reveal-delay", "0ms");
          }, delay + 700);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -45px 0px" },
  );

  observeRevealItems();
}

function observeRevealItems(root = document) {
  if (!revealObserver) {
    return;
  }

  root.querySelectorAll(".reveal-item:not(.is-observed)").forEach((item, index) => {
    item.classList.add("is-observed");
    item.style.setProperty("--reveal-delay", `${Math.min(index * 80, 420)}ms`);
    revealObserver.observe(item);
  });
}

function initSearch() {
  const searchToggle = document.querySelector(".search-toggle");
  const desktopSearch = document.querySelector(".nav-search-form");
  const desktopInput = desktopSearch?.querySelector("input");

  searchToggle?.addEventListener("click", () => {
    const isOpen = desktopSearch.classList.toggle("is-open");
    searchToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      desktopInput.focus();
    }
  });

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const query = String(formData.get("busca") || "").trim().toLowerCase();
      filterProductsBySearch(query);
      scrollToProducts();
      closeMobileMenu();
    });
  });
}

function initNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  document.querySelectorAll("[data-show-all]").forEach((button) => {
    button.addEventListener("click", () => {
      renderProducts(getVisibleProducts());
      setProductStatus("");
    });
  });

  document.querySelector(".user-action")?.addEventListener("click", () => {
    showToast("Área do cliente em breve.");
  });
}

function initComponentFallbacks() {
  if (window.bootstrap) {
    return;
  }

  const nav = document.getElementById("mainNav");
  const toggler = document.querySelector(".navbar-toggler");

  toggler?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("show");
    toggler.setAttribute("aria-expanded", String(isOpen));
  });

  const cartPanel = document.getElementById("cartOffcanvas");
  document.querySelectorAll('[data-bs-toggle="offcanvas"][data-bs-target="#cartOffcanvas"]').forEach((button) => {
    button.addEventListener("click", () => {
      cartPanel?.classList.add("show");
    });
  });

  cartPanel?.querySelectorAll('[data-bs-dismiss="offcanvas"], .btn-close').forEach((button) => {
    button.addEventListener("click", () => {
      cartPanel.classList.remove("show");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      nav?.classList.remove("show");
      toggler?.setAttribute("aria-expanded", "false");
      cartPanel?.classList.remove("show");
    }
  });
}

function renderCategories(categoryList) {
  const categoryGrid = document.getElementById("categoryGrid");
  if (!categoryGrid) {
    return;
  }

  categoryGrid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  categoryList.forEach((category) => {
    const column = document.createElement("div");
    column.className = "col-6 col-md-4 col-lg-2";
    column.innerHTML = `
      <button class="category-card reveal-item h-100" type="button" data-category="${category.name}">
        <span class="category-image">
          <img src="${category.image}" alt="${category.alt}" width="600" height="600" loading="lazy">
        </span>
        <span class="category-title">${category.name}</span>
        <span class="category-link">Explorar <span aria-hidden="true">→</span></span>
      </button>
    `;
    fragment.appendChild(column);
  });

  categoryGrid.appendChild(fragment);
  categoryGrid.querySelectorAll("[data-category]").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      const filteredProducts = getVisibleProducts().filter((product) => product.category === category);
      renderProducts(filteredProducts, category);
      scrollToProducts();
    });
  });
  observeRevealItems(categoryGrid);
}

function getVisibleProducts() {
  return products.filter((product) => product.available);
}

function renderProducts(productList, selectedCategory = "") {
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) {
    return;
  }

  productGrid.innerHTML = "";

  if (!productList.length) {
    productGrid.innerHTML = `
      <div class="col-12">
        <div class="product-empty-message">
          <strong>Em breve, novidades nesta categoria.</strong>
        </div>
      </div>
    `;
    setProductStatus(selectedCategory ? `Categoria selecionada: ${selectedCategory}` : "");
    return;
  }

  const fragment = document.createDocumentFragment();

  productList.forEach((product) => {
    const column = document.createElement("div");
    column.className = "col-6 col-md-6 col-lg-3";
    column.innerHTML = `
      <article class="product-card reveal-item h-100">
        <div class="product-media">
          <img
            src="${product.image}"
            alt="${product.name}"
            width="${product.width}"
            height="${product.height}"
            loading="lazy"
          >
        </div>
        <div class="product-body">
          <span class="product-category">${product.category}</span>
          <h3>${product.name}</h3>
          <div class="product-bottom">
            <span class="product-price">${Store.displayPrice(product)}</span>
            <button class="add-cart-btn" type="button" data-add-cart="${product.id}" aria-label="Adicionar ${product.name} ao carrinho">
              <i class="bi bi-cart-plus" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    `;
    fragment.appendChild(column);
  });

  productGrid.appendChild(fragment);
  setProductStatus(selectedCategory ? `Categoria selecionada: ${selectedCategory}` : "");
  observeRevealItems(productGrid);
}

function filterProductsBySearch(query) {
  if (!query) {
    renderProducts(getVisibleProducts());
    setProductStatus("");
    return;
  }

  const filtered = getVisibleProducts().filter((product) => {
    const haystack = `${product.name} ${product.category}`.toLowerCase();
    return haystack.includes(query);
  });

  renderProducts(filtered);

  if (filtered.length) {
    setProductStatus(`Resultado da busca por "${query}".`);
    return;
  }

  const productGrid = document.getElementById("productGrid");
  productGrid.innerHTML = `
    <div class="col-12">
      <div class="product-empty-message">
        <strong>Nenhum produto encontrado para essa busca.</strong>
      </div>
    </div>
  `;
  setProductStatus(`Resultado da busca por "${query}".`);
}

function setProductStatus(message) {
  const status = document.getElementById("productStatus");
  if (status) {
    status.textContent = message;
  }
}

function scrollToProducts() {
  document.getElementById("produtos")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
}

function closeMobileMenu() {
  const nav = document.getElementById("mainNav");
  if (nav?.classList.contains("show") && window.bootstrap) {
    bootstrap.Collapse.getOrCreateInstance(nav).hide();
    return;
  }

  if (nav?.classList.contains("show")) {
    nav.classList.remove("show");
    document.querySelector(".navbar-toggler")?.setAttribute("aria-expanded", "false");
  }
}

function initCart() {
  updateCartUI();

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) {
      addToCart(addButton.dataset.addCart);
      return;
    }

    const quantityButton = event.target.closest("[data-cart-action]");
    if (quantityButton) {
      updateCartQuantity(quantityButton.dataset.productId, quantityButton.dataset.cartAction);
      return;
    }

    const removeButton = event.target.closest("[data-remove-cart]");
    if (removeButton) {
      removeFromCart(removeButton.dataset.removeCart);
    }
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId && item.available);
  if (!product) {
    showToast("Produto indisponível no momento.");
    return;
  }

  Store.addToCart(productId);
  updateCartUI();
  showToast(`${product.name} foi adicionado ao carrinho.`);
}

function updateCartQuantity(productId, action) {
  Store.changeCartQuantity(productId, action);
  updateCartUI();
}

function removeFromCart(productId) {
  const product = products.find((item) => item.id === productId);
  Store.removeFromCart(productId);
  updateCartUI();

  if (product) {
    showToast(`${product.name} foi removido do carrinho.`);
  }
}

function updateCartUI() {
  const summary = Store.getCartSummary(products);
  updateCartCounter(summary.totalItems);
  renderCartItems(summary);
}

function updateCartCounter(totalItems) {
  document.querySelectorAll(".cart-count").forEach((counter) => {
    counter.textContent = String(totalItems);
  });
}

function renderCartItems(summary) {
  const cartItems = document.getElementById("cartItems");
  const cartEmpty = document.getElementById("cartEmpty");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems || !cartEmpty || !cartTotal) {
    return;
  }

  cartItems.innerHTML = "";

  if (!summary.items.length) {
    cartEmpty.hidden = false;
    cartTotal.textContent = Store.formatCurrency(0);
    return;
  }

  cartEmpty.hidden = true;

  summary.items.forEach(({ product, quantity, subtotal }) => {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <img src="${product.image}" alt="${product.name}" width="${product.width}" height="${product.height}">
      <div>
        <h3>${product.name}</h3>
        <div class="cart-item-price">${Store.displayPrice(product)}</div>
        <div class="cart-item-actions">
          <div class="qty-control" aria-label="Quantidade de ${product.name}">
            <button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="Diminuir quantidade de ${product.name}" ${quantity <= 1 ? "disabled" : ""}>
              <i class="bi bi-dash" aria-hidden="true"></i>
            </button>
            <span>${quantity}</span>
            <button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="Aumentar quantidade de ${product.name}">
              <i class="bi bi-plus" aria-hidden="true"></i>
            </button>
          </div>
          <button class="remove-cart-btn" type="button" data-remove-cart="${product.id}">Remover</button>
        </div>
        <div class="cart-item-subtotal">Subtotal: ${Store.formatCurrency(subtotal)}</div>
      </div>
    `;

    cartItems.appendChild(cartItem);
  });

  cartTotal.textContent = Store.formatCurrency(summary.subtotal);
}

function initPromoAnimations() {
  const promoBanner = document.querySelector(".promo-banner");
  const counter = document.querySelector("[data-discount-counter]");

  if (!promoBanner || !counter) {
    return;
  }

  if (prefersReducedMotion.matches) {
    promoBanner.classList.add("promo-bg-ready");
    counter.textContent = "40";
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !promoAnimationStarted) {
          promoAnimationStarted = true;
          promoBanner.classList.add("promo-bg-ready");
          animateDiscountCounter(counter, 40, 1700);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(promoBanner);
}

function animateDiscountCounter(element, target, duration) {
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.min(target, Math.round(target * eased));
    element.textContent = String(value);

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    element.textContent = String(target);
  }

  requestAnimationFrame(frame);
}

function showToast(message) {
  const toastElement = document.getElementById("appToast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toastElement || !toastMessage) {
    return;
  }

  toastMessage.textContent = message;

  if (window.bootstrap) {
    bootstrap.Toast.getOrCreateInstance(toastElement).show();
    return;
  }

  toastElement.classList.add("show");
  window.clearTimeout(showToast.hideTimer);
  showToast.hideTimer = window.setTimeout(() => {
    toastElement.classList.remove("show");
  }, 2600);
}
