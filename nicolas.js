import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getFirestore, doc, onSnapshot, setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE (SEGUNDA APP Y COLECCIÓN Nicolas)
const firebaseConfig = {
  apiKey: "AIzaSyA-Q-JeopKI_t_u7jnBxcMCmePfvLeSg7k",
  authDomain: "tienda-relojes-gc.firebaseapp.com",
  projectId: "tienda-relojes-gc",
  storageBucket: "tienda-relojes-gc.firebasestorage.app",
  messagingSenderId: "294631718200",
  appId: "1:294631718200:web:5fc9cae23abba7d90255cd",
  measurementId: "G-1DH307N8D7"
};

const app = initializeApp(firebaseConfig, "NicoMotorepuestoApp");
const db = getFirestore(app);
const auth = getAuth(app);

const COLLECTION_NAME = "Nicolas";

// ESTADO GLOBAL DE LA APLICACIÓN
let appData = {
  config: {
    brandName: "Nico Motorepuesto",
    logoUrl: "",
    heroText: "",
    whatsapp: "543811234567",
    footerInfo: "Nico Motorepuesto - Todos los derechos reservados",
    styles: {
      colorType: "solid",
      headerBg: "#121212",
      bodyBg: "#0a0a0a",
      accentColor: "#00f3ff",
      cardBg: "#1e1e1e",
      textColor: "#ffffff",
      footerBg: "#121212",
      bgImageUrl: ""
    }
  },
  headerNav: [],
  promotions: [],
  categories: [],
  products: []
};

let cart = [];
let currentCategoryFilter = "todos";
let isInitialLoaded = false;
let carouselIndexes = {};

// 2. ESCUCHADOR DE FIRESTORE EN TIEMPO REAL
const docRef = doc(db, COLLECTION_NAME, "storeData");

onSnapshot(docRef, (docSnap) => {
  if (docSnap.exists()) {
    appData = docSnap.data();
    if (!appData.promotions) appData.promotions = [];
    if (!appData.categories) appData.categories = [];
    if (!appData.headerNav) appData.headerNav = [];
    if (!appData.products) appData.products = [];
  } else {
    setDoc(docRef, appData);
  }
  
  applyStyles(appData.config.styles);
  renderHeader();
  renderPromotions();
  renderCategories();
  renderProducts();
  renderFooter();

  if (!isInitialLoaded) {
    document.getElementById("initial-loader").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    isInitialLoaded = true;
  }
});

// APLICACIÓN DINÁMICA DE ESTILOS
function applyStyles(s) {
  if (!s) return;
  const root = document.documentElement;
  root.style.setProperty("--header-bg", s.headerBg);
  root.style.setProperty("--bg-color", s.bodyBg);
  root.style.setProperty("--accent-color", s.accentColor);
  root.style.setProperty("--card-bg", s.cardBg);
  root.style.setProperty("--text-color", s.textColor);
  root.style.setProperty("--footer-bg", s.footerBg);

  if (s.bgImageUrl) {
    document.body.style.backgroundImage = `url('${s.bgImageUrl}')`;
  } else {
    document.body.style.backgroundImage = "none";
  }

  if (s.colorType === "neon") {
    root.style.setProperty("--shadow-style", `0 0 15px ${s.accentColor}88`);
    root.style.setProperty("--border-glow", `1px solid ${s.accentColor}`);
  } else {
    root.style.setProperty("--shadow-style", "0 4px 15px rgba(0,0,0,0.5)");
    root.style.setProperty("--border-glow", "none");
  }
}

// RENDERIZADO DE INTERFAZ DE TIENDA
function renderHeader() {
  document.getElementById("header-title").textContent = appData.config.brandName || "Nico Motorepuesto";
  const logoImg = document.getElementById("header-logo-img");
  if (appData.config.logoUrl) {
    logoImg.src = appData.config.logoUrl;
    logoImg.classList.remove("hidden");
  } else {
    logoImg.classList.add("hidden");
  }

  const navContainer = document.getElementById("header-nav");
  navContainer.innerHTML = "";
  (appData.headerNav || []).forEach(item => {
    const a = document.createElement("a");
    a.className = "nav-link-btn";
    a.href = item.url;
    a.target = "_blank";
    a.innerHTML = `${item.emoji ? item.emoji + " " : ""}${item.title}`;
    navContainer.appendChild(a);
  });

  const heroBox = document.getElementById("hero-message");
  if (appData.config.heroText) {
    document.getElementById("hero-text").textContent = appData.config.heroText;
    heroBox.classList.remove("hidden");
  } else {
    heroBox.classList.add("hidden");
  }
}

function renderPromotions() {
  const container = document.getElementById("promotions-section");
  const grid = document.getElementById("promotions-grid");
  grid.innerHTML = "";

  const promos = appData.promotions || [];
  if (promos.length === 0) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  promos.forEach(p => {
    const card = document.createElement("div");
    card.className = "promo-card";

    let mediaHTML = "";

    if (p.mediaType === "video" && p.videoUrl) {
      mediaHTML = `
        <div class="promo-media-container">
          <video class="promo-media-video" src="${p.videoUrl}" autoplay loop muted playsinline></video>
        </div>`;
    } else if (p.mediaType === "carousel" && p.images && p.images.length > 0) {
      const pId = p.id;
      if (carouselIndexes[pId] === undefined) carouselIndexes[pId] = 0;
      const curIdx = carouselIndexes[pId];

      const dotsHTML = p.images.map((_, i) => `<span class="dot ${i === curIdx ? 'active' : ''}"></span>`).join('');

      mediaHTML = `
        <div class="promo-media-container">
          <div class="promo-carousel-wrapper">
            <img class="promo-carousel-img" src="${p.images[curIdx]}" alt="${p.title}" onclick="openZoomImage('${p.images[curIdx]}')">
            ${p.images.length > 1 ? `
              <button class="carousel-btn prev" onclick="moveCarousel('${pId}', -1)">&lt;</button>
              <button class="carousel-btn next" onclick="moveCarousel('${pId}', 1)">&gt;</button>
              <div class="carousel-dots">${dotsHTML}</div>
            ` : ''}
          </div>
        </div>`;
    } else if (p.imgUrl) {
      mediaHTML = `
        <div class="promo-media-container">
          <img class="promo-media-single-img" src="${p.imgUrl}" alt="${p.title}" onclick="openZoomImage('${p.imgUrl}')">
        </div>`;
    }

    card.innerHTML = `
      ${mediaHTML}
      <div class="promo-details">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        ${p.price ? `<div class="promo-price">$${p.price}</div>` : ""}
        ${p.validUntil ? `<small>Válido hasta: ${p.validUntil}</small>` : ""}
      </div>
    `;
    grid.appendChild(card);
  });
}

window.moveCarousel = function(promoId, direction) {
  const promo = appData.promotions.find(p => p.id === promoId);
  if (!promo || !promo.images || promo.images.length === 0) return;

  let current = carouselIndexes[promoId] || 0;
  current += direction;

  if (current < 0) current = promo.images.length - 1;
  if (current >= promo.images.length) current = 0;

  carouselIndexes[promoId] = current;
  renderPromotions();
};

function renderCategories() {
  const scrollContainer = document.getElementById("categories-scroll");
  scrollContainer.innerHTML = `<button class="cat-btn ${currentCategoryFilter === 'todos' ? 'active' : ''}" data-category="todos">Todos</button>`;

  (appData.categories || []).forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `cat-btn ${currentCategoryFilter === cat.id ? 'active' : ''}`;
    btn.dataset.category = cat.id;
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      currentCategoryFilter = cat.id;
      renderCategories();
      renderProducts();
    });
    scrollContainer.appendChild(btn);
  });
  
  scrollContainer.querySelector('[data-category="todos"]').addEventListener("click", () => {
    currentCategoryFilter = "todos";
    renderCategories();
    renderProducts();
  });
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  const prods = (appData.products || []).filter(p => {
    return currentCategoryFilter === "todos" || p.categoryId === currentCategoryFilter;
  });

  if (prods.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.6; padding:30px;">No hay productos disponibles en esta sección.</p>`;
    return;
  }

  prods.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div>
        <div class="prod-img-wrapper" onclick="openZoomImage('${p.imgUrl || 'https://via.placeholder.com/150'}')">
          <img src="${p.imgUrl || 'https://via.placeholder.com/150'}" alt="${p.title}">
        </div>
        <div class="prod-code">Cód: ${p.code}</div>
        <h3 class="prod-title">${p.title}</h3>
        <p class="prod-desc">${p.desc || ''}</p>
      </div>
      <div>
        <div class="price-box">
          ${p.oldPrice ? `<span class="old-price">$${p.oldPrice}</span>` : ""}
          <span class="current-price">$${p.price}</span>
        </div>
        <button class="add-cart-btn" onclick="addToCart('${p.id}')">
          <i class="fa-solid fa-cart-plus"></i> Agregar
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderFooter() {
  document.getElementById("footer-content").textContent = appData.config.footerInfo || "";
}

// 3. CARRITO DE COMPRAS Y PEDIDO POR WHATSAPP
window.addToCart = function(prodId) {
  const product = appData.products.find(p => p.id === prodId);
  if (!product) return;
  cart.push(product);
  updateCartUI();
};

function updateCartUI() {
  document.getElementById("cart-badge").textContent = cart.length;
  const list = document.getElementById("cart-items-list");
  list.innerHTML = "";

  let total = 0;
  cart.forEach((item, index) => {
    total += parseFloat(item.price);
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-info">
        <img src="${item.imgUrl || 'https://via.placeholder.com/40'}" alt="${item.title}">
        <div>
          <strong>${item.title}</strong>
          <div><small>Cód: ${item.code} - $${item.price}</small></div>
        </div>
      </div>
      <button class="delete-btn" onclick="removeFromCart(${index})">&times;</button>
    `;
    list.appendChild(div);
  });

  document.getElementById("cart-total-price").textContent = `$${total.toFixed(2)}`;
}

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCartUI();
};

document.getElementById("btn-send-whatsapp").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  let total = 0;
  let msg = `*Deseo realizar esta compra en ${appData.config.brandName || 'Nico Motorepuesto'}*\n\n`;
  msg += `*Detalle del pedido:*\n`;

  cart.forEach((item, i) => {
    total += parseFloat(item.price);
    msg += `${i + 1}. [${item.code}] ${item.title} - $${item.price}\n`;
  });

  msg += `\n*TOTAL:* $${total.toFixed(2)}`;

  const number = appData.config.whatsapp || "543811234567";
  const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
});

// ZOOM DE IMÁGENES
window.openZoomImage = function(url) {
  document.getElementById("zoomed-image").src = url;
  document.getElementById("image-zoom-modal").classList.remove("hidden");
};

// 4. AUTENTICACIÓN Y PANEL DE ADMINISTRACIÓN
const loginModal = document.getElementById("login-modal");
const adminModal = document.getElementById("admin-panel-modal");

document.getElementById("open-admin-trigger").addEventListener("click", () => {
  if (auth.currentUser) {
    openAdminPanel();
  } else {
    loginModal.classList.remove("hidden");
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  const errText = document.getElementById("login-error");

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    loginModal.classList.add("hidden");
    openAdminPanel();
  } catch (err) {
    errText.textContent = "Credenciales inválidas";
    errText.classList.remove("hidden");
  }
});

document.getElementById("admin-logout-btn").addEventListener("click", () => {
  signOut(auth);
  adminModal.classList.add("hidden");
});

onAuthStateChanged(auth, (user) => {
  if (!user && !adminModal.classList.contains("hidden")) {
    adminModal.classList.add("hidden");
  }
});

function openAdminPanel() {
  loadAdminFormData();
  adminModal.classList.remove("hidden");
}

// GESTIÓN DE PESTAÑAS ADMIN
document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

// SUB PESTAÑAS PRODUCTOS
document.getElementById("sub-btn-single-prod").addEventListener("click", (e) => switchSubTab(e.target, "sub-view-single-prod"));
document.getElementById("sub-btn-batch-prod").addEventListener("click", (e) => switchSubTab(e.target, "sub-view-batch-prod"));
document.getElementById("sub-btn-view-prods").addEventListener("click", (e) => switchSubTab(e.target, "sub-view-list-prod"));

function switchSubTab(btn, targetId) {
  document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".sub-tab-view").forEach(v => v.classList.add("hidden"));
  btn.classList.add("active");
  document.getElementById(targetId).classList.remove("hidden");
}

// LÓGICA DINÁMICA DE CAMPOS MULTIMEDIA DE PROMOCIONES
const mediaTypeSelect = document.getElementById("select-promo-media-type");
const singleGroup = document.getElementById("media-input-single");
const carouselGroup = document.getElementById("media-input-carousel");
const videoGroup = document.getElementById("media-input-video");
const carouselCountSelect = document.getElementById("select-promo-carousel-count");
const carouselUrlsContainer = document.getElementById("carousel-urls-container");

function updateMediaInputVisibility() {
  const type = mediaTypeSelect.value;
  singleGroup.classList.add("hidden");
  carouselGroup.classList.add("hidden");
  videoGroup.classList.add("hidden");

  if (type === "single_image") {
    singleGroup.classList.remove("hidden");
  } else if (type === "carousel") {
    carouselGroup.classList.remove("hidden");
    renderCarouselUrlInputs();
  } else if (type === "video") {
    videoGroup.classList.remove("hidden");
  }
}

function renderCarouselUrlInputs(existingUrls = []) {
  const count = parseInt(carouselCountSelect.value);
  carouselUrlsContainer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const val = existingUrls[i] || "";
    const div = document.createElement("div");
    div.className = "form-group";
    div.innerHTML = `
      <label>URL Imagen ${i + 1}</label>
      <input type="url" class="input-carousel-url" placeholder="https://ejemplo.com/foto${i + 1}.jpg" value="${val}">
    `;
    carouselUrlsContainer.appendChild(div);
  }
}

mediaTypeSelect.addEventListener("change", updateMediaInputVisibility);
carouselCountSelect.addEventListener("change", () => renderCarouselUrlInputs());

// 5. GUARDADO EN FIRESTORE Y ACCIONES ADMIN
async function saveStoreData() {
  await setDoc(docRef, appData);
}

function loadAdminFormData() {
  document.getElementById("input-brand-name").value = appData.config.brandName || "";
  document.getElementById("input-logo-url").value = appData.config.logoUrl || "";
  document.getElementById("input-hero-text").value = appData.config.heroText || "";

  const s = appData.config.styles || {};
  document.getElementById("input-color-header").value = s.headerBg || "#121212";
  document.getElementById("input-color-bg").value = s.bodyBg || "#0a0a0a";
  document.getElementById("input-color-accent").value = s.accentColor || "#00f3ff";
  document.getElementById("input-color-card").value = s.cardBg || "#1e1e1e";
  document.getElementById("input-color-text").value = s.textColor || "#ffffff";
  document.getElementById("input-color-footer").value = s.footerBg || "#121212";
  document.getElementById("input-bg-image-url").value = s.bgImageUrl || "";
  document.getElementById("input-whatsapp-number").value = appData.config.whatsapp || "";
  document.getElementById("input-footer-info").value = appData.config.footerInfo || "";

  populateCategorySelects();
  renderAdminLists();
  updateMediaInputVisibility();
}

function populateCategorySelects() {
  const selSingle = document.getElementById("select-prod-category");
  const selBatch = document.getElementById("select-batch-category");
  const selFilter = document.getElementById("select-filter-admin-category");

  const optionsHTML = (appData.categories || []).map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  
  selSingle.innerHTML = optionsHTML;
  selBatch.innerHTML = optionsHTML;
  selFilter.innerHTML = `<option value="todos">-- Ver Todos los Productos --</option>` + optionsHTML;
}

// LOGO & IDENTIDAD
document.getElementById("form-logo-config").addEventListener("submit", async (e) => {
  e.preventDefault();
  appData.config.brandName = document.getElementById("input-brand-name").value;
  appData.config.logoUrl = document.getElementById("input-logo-url").value;
  appData.config.heroText = document.getElementById("input-hero-text").value;
  await saveStoreData();
  alert("Identidad actualizada correctamente");
});

// ENLACES ENCABEZADO
document.getElementById("form-header-link").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-link-id").value || Date.now().toString();
  const linkObj = {
    id,
    emoji: document.getElementById("input-link-emoji").value,
    title: document.getElementById("input-link-title").value,
    url: document.getElementById("input-link-url").value
  };

  appData.headerNav = appData.headerNav || [];
  const idx = appData.headerNav.findIndex(l => l.id === id);
  if (idx >= 0) appData.headerNav[idx] = linkObj;
  else appData.headerNav.push(linkObj);

  await saveStoreData();
  e.target.reset();
  renderAdminLists();
});

// PROMOCIONES Y AVISOS (CON CARRUSEL Y VIDEO)
document.getElementById("form-promo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-promo-id").value || Date.now().toString();
  const mediaType = mediaTypeSelect.value;

  let singleImg = "";
  let carouselImages = [];
  let videoUrl = "";

  if (mediaType === "single_image") {
    singleImg = document.getElementById("input-promo-single-img").value;
  } else if (mediaType === "carousel") {
    const inputs = document.querySelectorAll(".input-carousel-url");
    inputs.forEach(inp => {
      if (inp.value.trim() !== "") carouselImages.push(inp.value.trim());
    });
  } else if (mediaType === "video") {
    videoUrl = document.getElementById("input-promo-video-url").value;
  }

  const promoObj = {
    id,
    title: document.getElementById("input-promo-title").value,
    desc: document.getElementById("input-promo-desc").value,
    mediaType: mediaType,
    imgUrl: singleImg,
    images: carouselImages,
    videoUrl: videoUrl,
    price: document.getElementById("input-promo-price").value,
    validUntil: document.getElementById("input-promo-date").value
  };

  appData.promotions = appData.promotions || [];
  const idx = appData.promotions.findIndex(p => p.id === id);
  if (idx >= 0) appData.promotions[idx] = promoObj;
  else appData.promotions.push(promoObj);

  await saveStoreData();
  e.target.reset();
  document.getElementById("input-promo-id").value = "";
  document.getElementById("cancel-promo-edit").classList.add("hidden");
  updateMediaInputVisibility();
  alert("¡Aviso / Promoción guardado con éxito!");
  renderAdminLists();
});

document.getElementById("cancel-promo-edit").addEventListener("click", () => {
  document.getElementById("form-promo").reset();
  document.getElementById("input-promo-id").value = "";
  document.getElementById("cancel-promo-edit").classList.add("hidden");
  updateMediaInputVisibility();
});

// CATEGORÍAS
document.getElementById("form-category").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-cat-id").value || Date.now().toString();
  const catObj = { id, name: document.getElementById("input-cat-name").value };

  appData.categories = appData.categories || [];
  const idx = appData.categories.findIndex(c => c.id === id);
  if (idx >= 0) appData.categories[idx] = catObj;
  else appData.categories.push(catObj);

  await saveStoreData();
  e.target.reset();
  document.getElementById("input-cat-id").value = "";
  document.getElementById("cancel-cat-edit").classList.add("hidden");
  populateCategorySelects();
  renderAdminLists();
  alert("Sección guardada correctamente");
});

document.getElementById("cancel-cat-edit").addEventListener("click", () => {
  document.getElementById("form-category").reset();
  document.getElementById("input-cat-id").value = "";
  document.getElementById("cancel-cat-edit").classList.add("hidden");
});

// PRODUCTO INDIVIDUAL
document.getElementById("form-product").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-prod-id").value || Date.now().toString();
  const prodObj = {
    id,
    code: document.getElementById("input-prod-code").value,
    categoryId: document.getElementById("select-prod-category").value,
    title: document.getElementById("input-prod-title").value,
    desc: document.getElementById("input-prod-desc").value,
    imgUrl: document.getElementById("input-prod-img").value,
    oldPrice: document.getElementById("input-prod-old-price").value,
    price: document.getElementById("input-prod-price").value
  };

  appData.products = appData.products || [];
  const idx = appData.products.findIndex(p => p.id === id);
  if (idx >= 0) appData.products[idx] = prodObj;
  else appData.products.push(prodObj);

  await saveStoreData();
  e.target.reset();
  alert("Producto guardado correctamente");
  renderAdminLists();
});

// CREACIÓN POR TANDA
document.getElementById("form-batch-product").addEventListener("submit", async (e) => {
  e.preventDefault();
  const count = parseInt(document.getElementById("input-batch-count").value);
  const prefix = document.getElementById("input-batch-prefix").value;
  let startNum = parseInt(document.getElementById("input-batch-start-num").value);
  const baseName = document.getElementById("input-batch-name").value;
  const categoryId = document.getElementById("select-batch-category").value;
  const price = document.getElementById("input-batch-price").value;

  appData.products = appData.products || [];

  for (let i = 0; i < count; i++) {
    const code = `${prefix}-${startNum + i}`;
    appData.products.push({
      id: `${Date.now()}_${i}`,
      code: code,
      categoryId: categoryId,
      title: `${baseName} ${code}`,
      desc: "",
      imgUrl: "",
      oldPrice: "",
      price: price
    });
  }

  await saveStoreData();
  alert(`Se crearon ${count} productos correctamente.`);
  renderAdminLists();
});

// PERSONALIZACIÓN VISUAL
document.getElementById("form-customize").addEventListener("submit", async (e) => {
  e.preventDefault();
  const colorType = document.querySelector('input[name="colorType"]:checked').value;
  
  appData.config.styles = {
    colorType,
    headerBg: document.getElementById("input-color-header").value,
    bodyBg: document.getElementById("input-color-bg").value,
    accentColor: document.getElementById("input-color-accent").value,
    cardBg: document.getElementById("input-color-card").value,
    textColor: document.getElementById("input-color-text").value,
    footerBg: document.getElementById("input-color-footer").value,
    bgImageUrl: document.getElementById("input-bg-image-url").value
  };

  appData.config.whatsapp = document.getElementById("input-whatsapp-number").value;
  appData.config.footerInfo = document.getElementById("input-footer-info").value;

  await saveStoreData();
  alert("Apariencia guardada correctamente");
});

// RENDERIZADO DE TABLAS ADMIN
function renderAdminLists() {
  // Enlaces
  const linksDiv = document.getElementById("admin-links-list");
  linksDiv.innerHTML = "";
  (appData.headerNav || []).forEach(l => {
    linksDiv.innerHTML += `
      <div class="admin-item-row">
        <span>${l.emoji || ''} ${l.title}</span>
        <div class="item-actions">
          <button class="delete-btn" onclick="deleteHeaderLink('${l.id}')">Eliminar</button>
        </div>
      </div>`;
  });

  // Promociones / Avisos en Admin
  const promosDiv = document.getElementById("admin-promos-list");
  promosDiv.innerHTML = "";
  (appData.promotions || []).forEach(p => {
    promosDiv.innerHTML += `
      <div class="admin-item-row">
        <span><strong>${p.title}</strong> (${p.mediaType || 'imagen'})</span>
        <div class="item-actions">
          <button class="edit-btn" onclick="editPromo('${p.id}')">Editar</button>
          <button class="delete-btn" onclick="deletePromo('${p.id}')">Eliminar</button>
        </div>
      </div>`;
  });

  // Categorías
  const catDiv = document.getElementById("admin-categories-list");
  catDiv.innerHTML = "";
  (appData.categories || []).forEach(c => {
    catDiv.innerHTML += `
      <div class="admin-item-row">
        <span>${c.name}</span>
        <div class="item-actions">
          <button class="edit-btn" onclick="editCategory('${c.id}')">Editar</button>
          <button class="delete-btn" onclick="deleteCategory('${c.id}')">Eliminar</button>
        </div>
      </div>`;
  });

  // Productos
  renderAdminProductsList();
}

function renderAdminProductsList() {
  const filterCat = document.getElementById("select-filter-admin-category").value;
  const prodDiv = document.getElementById("admin-products-list");
  prodDiv.innerHTML = "";

  const list = (appData.products || []).filter(p => filterCat === "todos" || p.categoryId === filterCat);
  list.forEach(p => {
    prodDiv.innerHTML += `
      <div class="admin-item-row">
        <span><strong>[${p.code}]</strong> ${p.title} - $${p.price}</span>
        <div class="item-actions">
          <button class="edit-btn" onclick="editProduct('${p.id}')">Editar</button>
          <button class="delete-btn" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </div>
      </div>`;
  });
}

document.getElementById("select-filter-admin-category").addEventListener("change", renderAdminProductsList);

// ELIMINACIONES Y EDICIÓN
window.deleteHeaderLink = async function(id) {
  appData.headerNav = appData.headerNav.filter(l => l.id !== id);
  await saveStoreData();
  renderAdminLists();
};

window.editCategory = function(id) {
  const c = appData.categories.find(cat => cat.id === id);
  if (!c) return;
  document.getElementById("input-cat-id").value = c.id;
  document.getElementById("input-cat-name").value = c.name;
  document.getElementById("cancel-cat-edit").classList.remove("hidden");
};

window.deleteCategory = async function(id) {
  if (!confirm("¿Deseas eliminar esta categoría?")) return;
  appData.categories = appData.categories.filter(c => c.id !== id);
  await saveStoreData();
  populateCategorySelects();
  renderAdminLists();
};

window.editPromo = function(id) {
  const p = appData.promotions.find(item => item.id === id);
  if (!p) return;

  document.getElementById("input-promo-id").value = p.id;
  document.getElementById("input-promo-title").value = p.title;
  document.getElementById("input-promo-desc").value = p.desc;
  document.getElementById("input-promo-price").value = p.price || "";
  document.getElementById("input-promo-date").value = p.validUntil || "";

  mediaTypeSelect.value = p.mediaType || "single_image";
  updateMediaInputVisibility();

  if (p.mediaType === "single_image") {
    document.getElementById("input-promo-single-img").value = p.imgUrl || "";
  } else if (p.mediaType === "carousel" && p.images) {
    carouselCountSelect.value = p.images.length || 2;
    renderCarouselUrlInputs(p.images);
  } else if (p.mediaType === "video") {
    document.getElementById("input-promo-video-url").value = p.videoUrl || "";
  }

  document.getElementById("cancel-promo-edit").classList.remove("hidden");
};

window.deletePromo = async function(id) {
  if (!confirm("¿Deseas eliminar esta promoción?")) return;
  appData.promotions = appData.promotions.filter(p => p.id !== id);
  await saveStoreData();
  renderAdminLists();
};

window.deleteProduct = async function(id) {
  if (!confirm("¿Deseas eliminar este producto?")) return;
  appData.products = appData.products.filter(p => p.id !== id);
  await saveStoreData();
  renderAdminLists();
};

window.editProduct = function(id) {
  const p = appData.products.find(item => item.id === id);
  if (!p) return;

  switchSubTab(document.getElementById("sub-btn-single-prod"), "sub-view-single-prod");

  document.getElementById("input-prod-id").value = p.id;
  document.getElementById("input-prod-code").value = p.code;
  document.getElementById("select-prod-category").value = p.categoryId;
  document.getElementById("input-prod-title").value = p.title;
  document.getElementById("input-prod-desc").value = p.desc || "";
  document.getElementById("input-prod-img").value = p.imgUrl || "";
  document.getElementById("input-prod-old-price").value = p.oldPrice || "";
  document.getElementById("input-prod-price").value = p.price;
  document.getElementById("cancel-prod-edit").classList.remove("hidden");
};

document.getElementById("cancel-prod-edit").addEventListener("click", () => {
  document.getElementById("form-product").reset();
  document.getElementById("input-prod-id").value = "";
  document.getElementById("cancel-prod-edit").classList.add("hidden");
});

// CIERRE DE MODALES GENERAL
document.querySelectorAll(".close-modal-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.close).classList.add("hidden");
  });
});

document.getElementById("cart-floating-btn").addEventListener("click", () => {
  document.getElementById("cart-modal").classList.remove("hidden");
});