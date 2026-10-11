(function () {
  const productStorageKey = "mobilepro_products_v1";
  const categoryStorageKey = "mobilepro_categories_v1";
  const cartStorageKey = "mobilepro-cart";

  const defaultCategories = [
    {
      id: "iphones",
      name: "iPhones",
      image: "./categorias/categoria-iphone.png",
      alt: "iPhones em diferentes cores",
    },
    {
      id: "airpods",
      name: "AirPods",
      image: "./categorias/categoria-airpods.png",
      alt: "AirPods brancos com estojo",
    },
    {
      id: "carregadores",
      name: "Carregadores",
      image: "./categorias/categoria-carregador.png",
      alt: "Carregador com cabo USB-C",
    },
    {
      id: "peliculas",
      name: "Películas",
      image: "./categorias/categoria-pelicula.png",
      alt: "Película protetora para celular",
    },
    {
      id: "smartwatches",
      name: "Smartwatches",
      image: "./categorias/categoria-smartwatch.png",
      alt: "Smartwatch com pulseira escura",
    },
    {
      id: "acessorios-relogios",
      name: "Acessórios para Relógios",
      image: "./categorias/smartwatch.png",
      alt: "Pulseira e acessório para relógio inteligente",
    },
  ];

  const defaultProducts = [
    {
      id: "iphone-18",
      name: "iPhone 18",
      image: "./produtos/iphone-18.png",
      width: 420,
      height: 420,
      price: 5999,
      category: "iPhones",
      description: "iPhone premium para uma rotina mais conectada.",
      available: true,
      featured: true,
      promotional: false,
    },
    {
      id: "linha-iphone-17",
      name: "Linha iPhone 17",
      image: "./produtos/iphones-17.png",
      width: 399,
      height: 501,
      price: 4499,
      pricePrefix: "A partir de",
      category: "iPhones",
      description: "Linha iPhone 17 com design moderno e desempenho avançado.",
      available: true,
      featured: true,
      promotional: false,
    },
    {
      id: "airpods-bluetooth",
      name: "AirPods Bluetooth",
      image: "./produtos/airpods.png",
      width: 1254,
      height: 1254,
      price: 349.9,
      category: "AirPods",
      description: "AirPods Bluetooth para ouvir música e chamadas com praticidade.",
      available: true,
      featured: true,
      promotional: false,
    },
    {
      id: "carregador-usb-c-20w",
      name: "Carregador USB-C 20W",
      image: "./produtos/carregador.png",
      width: 1254,
      height: 1254,
      price: 129.9,
      category: "Carregadores",
      description: "Carregador USB-C 20W para manter seus dispositivos sempre prontos.",
      available: true,
      featured: true,
      promotional: false,
    },
  ];

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function makeId(value) {
    const base = String(value || "item")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (window.crypto?.randomUUID) {
      return `${base || "item"}-${crypto.randomUUID().slice(0, 8)}`;
    }

    return `${base || "item"}-${Date.now().toString(36)}`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  }

  function displayPrice(product) {
    const price = formatCurrency(product.price);
    return product.pricePrefix ? `${product.pricePrefix} ${price}` : price;
  }

  function toNumber(value) {
    if (typeof value === "number") {
      return value;
    }

    return Number(
      String(value || "0")
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0;
  }

  function normalizeProduct(product) {
    const price = product.price ?? product.numericPrice ?? 0;

    return {
      id: product.id || makeId(product.name),
      name: product.name || "Produto sem nome",
      image: product.image || "./produtos/iphone-18.png",
      width: Number(product.width) || 800,
      height: Number(product.height) || 800,
      price: toNumber(price),
      pricePrefix: product.pricePrefix || "",
      category: product.category || "iPhones",
      description: product.description || "",
      available: product.available !== false,
      featured: product.featured !== false,
      promotional: product.promotional === true,
    };
  }

  function normalizeCategory(category) {
    return {
      id: category.id || makeId(category.name),
      name: category.name || "Categoria",
      image: category.image || "./categorias/categoria-iphone.png",
      alt: category.alt || category.name || "Categoria MobilePro",
    };
  }

  function loadProducts() {
    const stored = safeParse(localStorage.getItem(productStorageKey), null);
    if (!Array.isArray(stored) || !stored.length) {
      return defaultProducts.map(normalizeProduct);
    }

    return stored.map(normalizeProduct);
  }

  function saveProducts(products) {
    localStorage.setItem(productStorageKey, JSON.stringify(products.map(normalizeProduct)));
  }

  function loadCategories() {
    const stored = safeParse(localStorage.getItem(categoryStorageKey), null);
    if (!Array.isArray(stored) || !stored.length) {
      return defaultCategories.map(normalizeCategory);
    }

    return stored.map(normalizeCategory);
  }

  function saveCategories(categories) {
    localStorage.setItem(categoryStorageKey, JSON.stringify(categories.map(normalizeCategory)));
  }

  function loadCart() {
    const cart = safeParse(localStorage.getItem(cartStorageKey), []);
    if (!Array.isArray(cart)) {
      return [];
    }

    return cart
      .map((item) => ({
        id: item.id,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))
      .filter((item) => item.id);
  }

  function saveCart(cart) {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }

  function addToCart(productId, quantity = 1) {
    const cart = loadCart();
    const item = cart.find((currentItem) => currentItem.id === productId);
    if (item) {
      item.quantity += quantity;
    } else {
      cart.push({ id: productId, quantity });
    }
    saveCart(cart);
    return cart;
  }

  function changeCartQuantity(productId, action) {
    const cart = loadCart();
    const item = cart.find((currentItem) => currentItem.id === productId);
    if (!item) {
      return cart;
    }

    if (action === "increase") {
      item.quantity += 1;
    }

    if (action === "decrease") {
      item.quantity = Math.max(1, item.quantity - 1);
    }

    saveCart(cart);
    return cart;
  }

  function removeFromCart(productId) {
    const cart = loadCart().filter((item) => item.id !== productId);
    saveCart(cart);
    return cart;
  }

  function getCartItems(products = loadProducts(), cart = loadCart()) {
    return cart
      .map((item) => {
        const product = products.find((currentProduct) => currentProduct.id === item.id);
        if (!product) {
          return null;
        }

        return {
          ...item,
          product,
          subtotal: product.price * item.quantity,
        };
      })
      .filter(Boolean);
  }

  function getCartSummary(products = loadProducts(), cart = loadCart()) {
    const items = getCartItems(products, cart);
    return {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
  }

  function isPublicOrigin() {
    const host = window.location.hostname;
    return window.location.protocol.startsWith("http") && host && !["localhost", "127.0.0.1", "::1"].includes(host);
  }

  function publicImageUrl(product) {
    if (!product?.image || !isPublicOrigin()) {
      return "";
    }

    try {
      return new URL(product.image, window.location.href).href;
    } catch {
      return "";
    }
  }

  window.MobileProStore = {
    keys: {
      products: productStorageKey,
      categories: categoryStorageKey,
      cart: cartStorageKey,
    },
    defaultProducts,
    defaultCategories,
    makeId,
    formatCurrency,
    displayPrice,
    toNumber,
    normalizeProduct,
    normalizeCategory,
    loadProducts,
    saveProducts,
    loadCategories,
    saveCategories,
    loadCart,
    saveCart,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    getCartItems,
    getCartSummary,
    publicImageUrl,
    isPublicOrigin,
  };
})();
