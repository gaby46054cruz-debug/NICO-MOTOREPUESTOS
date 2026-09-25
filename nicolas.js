import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getFirestore, doc, collection, onSnapshot, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
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

// REFERENCIAS A COLECCIONES INDEPENDIENTES (CERO SOBREESCRITURA)
const configRef = doc(db, "Nicolas_config", "storeData");
const productsCol = collection(db, "Nicolas_products");
const categoriesCol = collection(db, "Nicolas_categories");
const promotionsCol = collection(db, "Nicolas_promotions");
const headerNavCol = collection(db, "Nicolas_headerNav");

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

// 2. ESCUCHADORES DE FIRESTORE EN TIEMPO REAL (INDIVIDUALES)
onSnapshot(configRef, (docSnap) => {
  if (docSnap.exists()) {
    appData.config = docSnap.data();
  } else {
    setDoc(configRef, appData.config);
  }
  applyStyles(appData.config.styles);
  renderHeader();
  renderFooter();
  checkInitialLoad();
});

onSnapshot(productsCol, (snapshot) => {
  appData.products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts();
  renderAdminProductsList();
  checkInitialLoad();
});

onSnapshot(categoriesCol, (snapshot) => {
  appData.categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCategories();
  populateCategorySelects();
  renderAdminLists();
  checkInitialLoad();
});

onSnapshot(promotionsCol, (snapshot) => {
  appData.promotions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderPromotions();
  renderAdminLists();
  checkInitialLoad();
});

onSnapshot(headerNavCol, (snapshot) => {
  appData.headerNav = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderHeader();
  renderAdminLists();
  checkInitialLoad();
});

function checkInitialLoad() {
  if (!isInitialLoaded) {
    const loader = document.getElementById("initial-loader");
    const mainApp = document.getElementById("main-app");
    if (loader) loader.classList.add("hidden");
    if (mainApp) mainApp.classList.remove("hidden");
    isInitialLoaded = true;
  }
}

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
  let msg = `*Hola,Deseo realizar esta compra en ${appData.config.brandName || 'Nico Motorepuesto'}*\n\n`;
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
  if (targetId === "sub-view-batch-prod") {
    renderBatchInputs();
  }
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

// 5. OPERACIONES ADMIN DE ESCRITURA Y ELIMINACIÓN
async function saveConfigData() {
  await setDoc(configRef, appData.config);
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
  
  if (selSingle) selSingle.innerHTML = optionsHTML;
  if (selBatch) selBatch.innerHTML = optionsHTML;
  if (selFilter) selFilter.innerHTML = `<option value="todos">-- Ver Todos los Productos --</option>` + optionsHTML;
}

// LOGO & IDENTIDAD
document.getElementById("form-logo-config").addEventListener("submit", async (e) => {
  e.preventDefault();
  appData.config.brandName = document.getElementById("input-brand-name").value;
  appData.config.logoUrl = document.getElementById("input-logo-url").value;
  appData.config.heroText = document.getElementById("input-hero-text").value;
  await saveConfigData();
  alert("Identidad actualizada correctamente");
});

// ENLACES ENCABEZADO
document.getElementById("form-header-link").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("input-link-id").value || Date.now().toString();
  const linkObj = {
    emoji: document.getElementById("input-link-emoji").value,
    title: document.getElementById("input-link-title").value,
    url: document.getElementById("input-link-url").value
  };

  await setDoc(doc(headerNavCol, id), linkObj);
  e.target.reset();
});

// PROMOCIONES Y AVISOS
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
    title: document.getElementById("input-promo-title").value,
    desc: document.getElementById("input-promo-desc").value,
    mediaType: mediaType,
    imgUrl: singleImg,
    images: carouselImages,
    videoUrl: videoUrl,
    price: document.getElementById("input-promo-price").value,
    validUntil: document.getElementById("input-promo-date").value
  };

  await setDoc(doc(promotionsCol, id), promoObj);
  e.target.reset();
  document.getElementById("input-promo-id").value = "";
  document.getElementById("cancel-promo-edit").classList.add("hidden");
  updateMediaInputVisibility();
  alert("¡Aviso / Promoción guardado con éxito!");
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
  const catObj = { name: document.getElementById("input-cat-name").value };

  await setDoc(doc(categoriesCol, id), catObj);
  e.target.reset();
  document.getElementById("input-cat-id").value = "";
  document.getElementById("cancel-cat-edit").classList.add("hidden");
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
    code: document.getElementById("input-prod-code").value,
    categoryId: document.getElementById("select-prod-category").value,
    title: document.getElementById("input-prod-title").value,
    desc: document.getElementById("input-prod-desc").value,
    imgUrl: document.getElementById("input-prod-img").value,
    oldPrice: document.getElementById("input-prod-old-price").value,
    price: document.getElementById("input-prod-price").value
  };

  await setDoc(doc(productsCol, id), prodObj);
  e.target.reset();
  document.getElementById("input-prod-id").value = "";
  document.getElementById("cancel-prod-edit").classList.add("hidden");
  alert("Producto guardado correctamente");
});

// CREACIÓN POR TANDA CON FILAS DINÁMICAS
function renderBatchInputs() {
  let container = document.getElementById("batch-items-container");
  if (!container) {
    const formBatch = document.getElementById("form-batch-product");
    if (!formBatch) return;
    container = document.createElement("div");
    container.id = "batch-items-container";
    container.style.marginTop = "15px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    
    const submitBtn = formBatch.querySelector('button[type="submit"]');
    if (submitBtn) {
      formBatch.insertBefore(container, submitBtn);
    } else {
      formBatch.appendChild(container);
    }
  }

  const countInput = document.getElementById("input-batch-count");
  const prefixInput = document.getElementById("input-batch-prefix");
  const startNumInput = document.getElementById("input-batch-start-num");

  const count = parseInt(countInput ? countInput.value : 10) || 10;
  const prefix = prefixInput ? prefixInput.value.trim() : "PROD";
  const startNum = parseInt(startNumInput ? startNumInput.value : 1) || 1;

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const currentCode = prefix ? `${prefix}-${startNum + i}` : `${startNum + i}`;
    const row = document.createElement("div");
    row.className = "batch-item-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "100px 1fr 120px 1fr 1fr";
    row.style.gap = "8px";
    row.style.alignItems = "center";
    row.style.padding = "8px";
    row.style.background = "rgba(255, 255, 255, 0.05)";
    row.style.borderRadius = "6px";

    row.innerHTML = `
      <span style="font-weight: bold; font-size: 0.85rem; opacity:0.8;">${currentCode}</span>
      <input type="text" class="batch-input-title nav-batch" data-row="${i}" data-field="title" placeholder="Nombre *" required style="padding:6px; border-radius:4px; border:1px solid #444; background:#1e1e1e; color:#fff;">
      <input type="number" step="0.01" class="batch-input-price nav-batch" data-row="${i}" data-field="price" placeholder="Precio *" required style="padding:6px; border-radius:4px; border:1px solid #444; background:#1e1e1e; color:#fff;">
      <input type="text" class="batch-input-brand nav-batch" data-row="${i}" data-field="brand" placeholder="Marca (Opcional)" style="padding:6px; border-radius:4px; border:1px solid #444; background:#1e1e1e; color:#fff;">
      <input type="url" class="batch-input-img nav-batch" data-row="${i}" data-field="img" placeholder="URL Imagen (Opcional)" style="padding:6px; border-radius:4px; border:1px solid #444; background:#1e1e1e; color:#fff;">
    `;
    container.appendChild(row);
  }

  // Navegación con ENTER entre campos
  const navInputs = Array.from(container.querySelectorAll(".nav-batch"));
  navInputs.forEach((input, index) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (index + 1 < navInputs.length) {
          navInputs[index + 1].focus();
        }
      }
    });
  });
}

// Escuchadores para re-generar dinamismo de filas
["input-batch-count", "input-batch-prefix", "input-batch-start-num"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", renderBatchInputs);
    el.addEventListener("change", renderBatchInputs);
  }
});

document.getElementById("form-batch-product").addEventListener("submit", async (e) => {
  e.preventDefault();
  const countInput = document.getElementById("input-batch-count");
  const prefixInput = document.getElementById("input-batch-prefix");
  const startNumInput = document.getElementById("input-batch-start-num");
  const categorySelect = document.getElementById("select-batch-category");

  const count = parseInt(countInput ? countInput.value : 10) || 10;
  const prefix = prefixInput ? prefixInput.value.trim() : "PROD";
  let startNum = parseInt(startNumInput ? startNumInput.value : 1) || 1;
  const categoryId = categorySelect ? categorySelect.value : "";

  const rows = document.querySelectorAll("#batch-items-container .batch-item-row");
  const promises = [];

  rows.forEach((row, i) => {
    const code = prefix ? `${prefix}-${startNum + i}` : `${startNum + i}`;
    const titleVal = row.querySelector(".batch-input-title")?.value.trim() || "";
    const priceVal = row.querySelector(".batch-input-price")?.value.trim() || "0";
    const brandVal = row.querySelector(".batch-input-brand")?.value.trim() || "";
    const imgVal = row.querySelector(".batch-input-img")?.value.trim() || "";

    if (titleVal) {
      const fullTitle = brandVal ? `${titleVal} (${brandVal})` : titleVal;
      const newId = `${Date.now()}_${i}`;
      const newProd = {
        code: code,
        categoryId: categoryId,
        title: fullTitle,
        desc: brandVal ? `Marca: ${brandVal}` : "",
        imgUrl: imgVal,
        oldPrice: "",
        price: priceVal
      };
      promises.push(setDoc(doc(productsCol, newId), newProd));
    }
  });

  if (promises.length === 0) {
    alert("Por favor, completa al menos un nombre y precio.");
    return;
  }

  await Promise.all(promises);
  alert(`Se crearon ${promises.length} productos correctamente.`);
  e.target.reset();
  renderBatchInputs();
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

  await saveConfigData();
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
  await deleteDoc(doc(headerNavCol, id));
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
  await deleteDoc(doc(categoriesCol, id));
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
  await deleteDoc(doc(promotionsCol, id));
};

window.deleteProduct = async function(id) {
  if (!confirm("¿Deseas eliminar este producto?")) return;
  await deleteDoc(doc(productsCol, id));
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
