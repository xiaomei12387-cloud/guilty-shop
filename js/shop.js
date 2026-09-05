// ==========================================================================
// 🛒 GUILTY PROTOCOL // ARSENAL SHOP CATALOG & CHECKOUT ENGINE (js/shop.js)
// ==========================================================================

const PRODUCTS = [
  {
    id: "guilty-choker",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "貓痕義體項圈",
    price: 1990,
    desc: "以航太級尼龍結合高韌性醫療 TPU 內襯，精密計算前喉結避空壓點，提供兼具絕對控制與舒適度的神經防護。",
    note: "附贈專屬高強度不鏽鋼戰術扣具與防拆雷射標籤。",
    img: "./images/image_choker.jpg",
    images: ["./images/image_choker.jpg", "./images/image_choker_detail.jpg", "./icons/icon-512.png"],
    specs: [],
    chokerSizes: ["S 碼 (29 – 33 cm)", "M 碼 (34 – 38 cm)"]
  },
  {
    id: "guilty-whip",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "SYNAPSE TACTICAL WHIP // 神經突觸戰術長鞭",
    price: 1500,
    desc: "12 股重磅手工編織戰術纖維，尾端導入高回彈微型配重。破空聲清脆冷冽，落點精確無偏差。",
    note: "總長度約 1.3 公尺，握柄採高抓地力霧面防滑橡膠。",
    img: "./images/image_whip.jpg",
    images: ["./images/image_whip.jpg", "./icons/icon-512.png"],
    specs: ["標準暗黑黑化版", "神經霓虹綠特仕版"]
  },
  {
    id: "shushi-rope",
    brand: "shushi",
    brandName: "束室特選繩藝",
    title: "束室特選・職人手工精煉麻繩【單條裝】",
    price: 350,
    desc: "13 道古法脫漿、深層天然植物油浸潤與蜂蠟烘烤。手感細膩溫潤，極度親膚且抗拉緊實。",
    note: "單條裝（長度 7.5 公尺，直徑 6mm）",
    img: "./images/image_rope.jpg",
    images: ["./images/image_rope.jpg", "./icons/icon-512.png"],
    specs: ["深褐色 (黑胡桃油淬)", "天然原麻色 (白蜂蠟輕潤)"]
  }
];

let cart = JSON.parse(localStorage.getItem("guilty_cart")) || [];
let currentFilteredBrand = "all";
let activeCheckoutItem = null;
let activePromoDiscount = 0; 
let activeDiscountRate = 1.0;

function saveCart() {
  localStorage.setItem("guilty_cart", JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById("headerCartCount");
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) badge.textContent = totalQty;

  const container = document.getElementById("cartItemsContainer");
  const subtotalEl = document.getElementById("cartDrawerSubtotal");
  const banner = document.getElementById("cartFreeShippingBanner");
  if (!container || !subtotalEl) return;

  if (cart.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:30px 0;">[ 裝備庫目前無暫存檔案 ]</div>`;
    subtotalEl.textContent = "NT$ 0";
    if (banner) banner.innerHTML = "";
    return;
  }

  let subtotal = 0;
  container.innerHTML = cart.map((item, index) => {
    subtotal += item.price * item.qty;
    return `
      <div class="cart-item-card">
        <img src="${item.img}" class="cart-item-thumb" onclick="openProductDetail('${item.productId}')" />
        <div class="cart-item-info">
          <div class="cart-item-title" onclick="openProductDetail('${item.productId}')">${item.title}</div>
          <div class="cart-item-spec">規格：${item.spec}</div>
          <div class="cart-item-price">NT$ ${item.price.toLocaleString()}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="changeCartQty(${index}, -1)">-</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeCartQty(${index}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-del" onclick="removeCartItem(${index})">✕</button>
      </div>
    `;
  }).join('');

  subtotalEl.textContent = `NT$ ${subtotal.toLocaleString()}`;

  if (banner) {
    if (subtotal >= 1800) {
      banner.innerHTML = `<span style="color:var(--accent-cyan);">✔ 已達成全館 NT$ 1,800 免運費標準！</span>`;
    } else {
      const diff = 1800 - subtotal;
      banner.innerHTML = `<span style="color:var(--text-muted);">距離免運門檻還差 <strong>NT$ ${diff.toLocaleString()}</strong></span>`;
    }
  }
}

function changeCartQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
}

function toggleCart(isOpen) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("navOverlay");
  if (!drawer || !overlay) return;
  if (isOpen) {
    drawer.classList.add("open");
    overlay.classList.add("active");
    updateCartUI();
  } else {
    drawer.classList.remove("open");
    if (!document.getElementById("sideNav").classList.contains("open")) {
      overlay.classList.remove("active");
    }
  }
}

function filterBrand(brand) {
  currentFilteredBrand = brand;
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  renderProductCards();
}

function renderProductCards() {
  const grid = document.getElementById("productGrid");
  if (!grid) {
    console.error("❌ 找不到 productGrid 容器，商城無法渲染！");
    return;
  }

  const filtered = currentFilteredBrand === "all" ? PRODUCTS : PRODUCTS.filter(p => p.brand === currentFilteredBrand);

  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProductDetail('${p.id}')">
      <div class="card-thumb">
        <span class="badge ${p.brand === 'guilty' ? 'badge-guilty' : 'badge-shushi'}">${p.brandName}</span>
        <img src="${p.img}" alt="${p.title}" />
      </div>
      <div class="card-body">
        <div style="font-size:0.7rem; color:var(--text-muted); font-family:monospace; margin-bottom:2px;">[ ARSENAL // CODE-${p.id.toUpperCase()} ]</div>
        <h3 style="font-size:0.95rem; font-weight:bold; color:#fff; margin-bottom:6px; line-height:1.3;">${p.title}</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          <span style="font-size:1.05rem; color:var(--accent-cyan); font-weight:bold;">NT$ ${p.price.toLocaleString()}</span>
          <span style="font-size:0.75rem; color:var(--text-muted); border:1px solid var(--panel-border); padding:2px 8px;">調用配置 →</span>
        </div>
      </div>
    </div>
  `).join('');
}

let selectedProductSpec = "";
let selectedProductSize = "";

function openProductDetail(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  activeCheckoutItem = p;
  selectedProductSpec = (p.specs && p.specs.length > 0) ? p.specs[0] : "標準配置";
  selectedProductSize = (p.chokerSizes && p.chokerSizes.length > 0) ? p.chokerSizes[0] : "";

  document.getElementById("detailProductTitle").textContent = p.title;
  document.getElementById("detailProductDesc").textContent = p.desc;
  document.getElementById("detailPriceDisplay").textContent = `NT$ ${p.price.toLocaleString()}`;

  const heroArea = document.getElementById("detailHeroImgArea");
  if (heroArea) {
    heroArea.innerHTML = `
      <div class="hud-corner hud-tl"></div><div class="hud-corner hud-tr"></div>
      <div class="hud-corner hud-bl"></div><div class="hud-corner hud-br"></div>
      <img src="${p.images ? p.images[0] : p.img}" onclick="openLightbox(this.src)" style="width:100%; height:100%; object-fit:cover; cursor:zoom-in;" />
    `;
  }

  const thumbsRow = document.getElementById("detailThumbsRow");
  if (thumbsRow) {
    if (p.images && p.images.length > 1) {
      thumbsRow.style.display = "flex";
      thumbsRow.innerHTML = p.images.map((imgSrc, idx) => `
        <img src="${imgSrc}" onclick="switchDetailMainImage('${imgSrc}')" style="width:65px; height:65px; object-fit:cover; border:1px solid ${idx===0?'var(--accent-cyan)':'var(--panel-border)'}; cursor:pointer; border-radius:3px;" />
      `).join('');
    } else {
      thumbsRow.style.display = "none";
      thumbsRow.innerHTML = "";
    }
  }

  const optArea = document.getElementById("detailDynamicOptions");
  if (optArea) {
    let html = "";
    if (p.specs && p.specs.length > 0) {
      html += `
        <div class="form-group">
          <label>✦ 色彩 / 材質配置*</label>
          <div class="radio-grid">
            ${p.specs.map(s => `<div class="radio-card ${s === selectedProductSpec ? 'active' : ''}" onclick="selectSpec('${s}', this)">${s}</div>`).join('')}
          </div>
        </div>
      `;
    }
    optArea.innerHTML = html;
  }

  const chokerArea = document.getElementById("detailChokerSpecificArea");
  if (chokerArea) {
    if (p.chokerSizes && p.chokerSizes.length > 0) {
      chokerArea.innerHTML = `
        <div class="form-group">
          <label>✦ 項圈尺寸選擇 (Size)*</label>
          <div class="radio-grid">
            ${p.chokerSizes.map(sz => `<div class="radio-card ${sz === selectedProductSize ? 'active' : ''}" onclick="selectChokerSize('${sz}', this)">${sz}</div>`).join('')}
          </div>
        </div>
      `;
    } else {
      chokerArea.innerHTML = "";
    }
  }

  setActiveView("view-product-detail");
  history.pushState({ view: 'detail', id: p.id }, '', '#detail');
}

function switchDetailMainImage(src) {
  const heroArea = document.getElementById("detailHeroImgArea");
  if (heroArea) {
    const img = heroArea.querySelector("img");
    if (img) img.src = src;
  }
}

function openLightbox(src) {
  const lightbox = document.getElementById("productLightbox");
  const lbImg = document.getElementById("lightboxImg");
  if (lightbox && lbImg) {
    lbImg.src = src;
    lightbox.style.display = "flex";
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("productLightbox");
  if (lightbox) lightbox.style.display = "none";
}

function selectSpec(spec, el) {
  selectedProductSpec = spec;
  const parent = el.closest(".radio-grid");
  if (parent) parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
}

function selectChokerSize(size, el) {
  selectedProductSize = size;
  const parent = el.closest(".radio-grid");
  if (parent) parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
}

function addCurrentProductToCart() {
  if (!activeCheckoutItem) return;
  const specText = selectedProductSize ? `${selectedProductSpec} / ${selectedProductSize}` : selectedProductSpec;

  const existing = cart.find(i => i.productId === activeCheckoutItem.id && i.spec === specText);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      productId: activeCheckoutItem.id,
      title: activeCheckoutItem.title,
      price: activeCheckoutItem.price,
      img: activeCheckoutItem.img,
      spec: specText,
      qty: 1
    });
  }

  saveCart();
  toggleCart(true);
}

function buyNowFromDetail() {
  if (!activeCheckoutItem) return;
  const specText = selectedProductSize ? `${selectedProductSpec} / ${selectedProductSize}` : selectedProductSpec;
  
  cart = [{
    productId: activeCheckoutItem.id,
    title: activeCheckoutItem.title,
    price: activeCheckoutItem.price,
    img: activeCheckoutItem.img,
    spec: specText,
    qty: 1
  }];
  saveCart();
  proceedToCheckoutFromCart();
}

// --------------------------------------------------------------------------
// 💳 結帳與真實密鑰核銷引擎（LOVEGUILTY, IAMSUB, WANG18X）
// --------------------------------------------------------------------------
let selectedShippingMethod = "711";
let selectedPaymentMethod = "cod";
let activeShippingFee = 60;

function proceedToCheckoutFromCart() {
  if (cart.length === 0) {
    alert("裝備庫目前為空！");
    return;
  }
  toggleCart(false);
  renderCheckoutSummary();
  setActiveView("view-checkout");
  history.pushState({ view: 'checkout' }, '', '#checkout');
}

function renderCheckoutSummary() {
  const itemsContainer = document.getElementById("checkoutOrderItemsList");
  const summaryContainer = document.getElementById("checkoutFinancialSummary");
  if (!itemsContainer || !summaryContainer) return;

  itemsContainer.innerHTML = cart.map(i => `
    <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-bottom:1px dashed var(--panel-border); padding:6px 0;">
      <div><strong style="color:#fff;">${i.title}</strong> <span style="color:var(--text-muted);">(規格：${i.spec})</span> x ${i.qty}</div>
      <div style="color:var(--accent-cyan); font-weight:bold;">NT$ ${(i.price * i.qty).toLocaleString()}</div>
    </div>
  `).join('');

  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  let discountedSubtotal = Math.round(subtotal * activeDiscountRate);
  let finalSubtotal = Math.max(0, discountedSubtotal - activePromoDiscount);

  activeShippingFee = (finalSubtotal >= 1800) ? 0 : 60;
  if (selectedShippingMethod === 'home') activeShippingFee = Math.max(activeShippingFee, 120);
  if (selectedShippingMethod === 'meetup') activeShippingFee = 0;

  let totalPayable = finalSubtotal + activeShippingFee;

  summaryContainer.innerHTML = `
    <div style="font-size:0.82rem; line-height:1.7;">
      <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">裝備小計：</span><span>NT$ ${subtotal.toLocaleString()}</span></div>
      ${activeDiscountRate < 1.0 ? `<div style="display:flex; justify-content:space-between; color:var(--accent-cyan);"><span>特工首購 8 折優惠 (IAMSUB)：</span><span>- NT$ ${(subtotal - discountedSubtotal).toLocaleString()}</span></div>` : ''}
      ${activePromoDiscount > 0 ? `<div style="display:flex; justify-content:space-between; color:var(--accent-cyan);"><span>協議密鑰折抵：</span><span>- NT$ ${activePromoDiscount.toLocaleString()}</span></div>` : ''}
      <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">物流運費：</span><span>${activeShippingFee === 0 ? '<strong style="color:var(--accent-cyan);">免運 (FREE)</strong>' : 'NT$ ' + activeShippingFee}</span></div>
      <div style="display:flex; justify-content:space-between; border-top:1px solid var(--panel-border); margin-top:6px; padding-top:6px; font-weight:bold; font-size:1.05rem;">
        <span style="color:#fff;">應付總額 (TOTAL)：</span><span style="color:var(--accent-cyan);">NT$ ${totalPayable.toLocaleString()}</span>
      </div>
    </div>
  `;
}

function applyPromoCode() {
  const input = document.getElementById("promoCodeInput");
  const msg = document.getElementById("promoStatusMsg");
  const removeBtn = document.getElementById("removePromoBtn");
  if (!input || !msg) return;

  const code = input.value.trim().toUpperCase();
  
  if (code === "LOVEGUILTY") {
    let choker = cart.find(i => i.productId === "guilty-choker");
    if (!choker) {
      msg.innerHTML = `<span style="color:var(--danger-red);">❌ 密鑰適用失敗：購物車內需包含「貓痕義體項圈」</span>`;
      return;
    }
    const bankCard = document.getElementById("payMethodBank");
    if (bankCard) selectPayment('bank', bankCard);

    activePromoDiscount = (1990 - 990) * choker.qty;
    msg.innerHTML = `<span style="color:var(--accent-cyan);">✔ 盲鳥協議 [LOVEGUILTY] 啟動：項圈折至 NT$ 990（已鎖定 ATM 結算）</span>`;
    if (removeBtn) removeBtn.style.display = "inline-block";
    renderCheckoutSummary();
  } 
  else if (code === "IAMSUB") {
    activeDiscountRate = 0.8;
    msg.innerHTML = `<span style="color:var(--accent-cyan);">✔ 首購認證 [IAMSUB] 啟動：全單享 8 折優惠</span>`;
    if (removeBtn) removeBtn.style.display = "inline-block";
    renderCheckoutSummary();
  } 
  else if (code === "WANG18X") {
    let choker = cart.find(i => i.productId === "guilty-choker");
    if (!choker) {
      msg.innerHTML = `<span style="color:var(--danger-red);">❌ 密鑰適用失敗：購物車內需包含「貓痕義體項圈」</span>`;
      return;
    }
    activePromoDiscount = (1990 - 1580) * choker.qty;
    msg.innerHTML = `<span style="color:var(--accent-cyan);">✔ 早鳥排產協議 [WANG18X] 啟動：項圈折至 NT$ 1,580</span>`;
    if (removeBtn) removeBtn.style.display = "inline-block";
    renderCheckoutSummary();
  } 
  else {
    msg.innerHTML = `<span style="color:var(--danger-red);">❌ 無效的特工密鑰</span>`;
  }
}

function removePromoCode() {
  activePromoDiscount = 0;
  activeDiscountRate = 1.0;
  const input = document.getElementById("promoCodeInput");
  const msg = document.getElementById("promoStatusMsg");
  const removeBtn = document.getElementById("removePromoBtn");
  if (input) input.value = "";
  if (msg) msg.innerHTML = "";
  if (removeBtn) removeBtn.style.display = "none";
  renderCheckoutSummary();
}

function selectShipping(method, el) {
  selectedShippingMethod = method;
  const parent = el.closest(".radio-grid");
  if (parent) parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");

  const cvsBox = document.getElementById("cvsDropdownContainer");
  const manualBox = document.getElementById("manualLocationGroup");
  if (method === 'home') {
    if (cvsBox) cvsBox.style.display = "none";
    if (manualBox) manualBox.style.display = "block";
    activeShippingFee = 120;
  } else if (method === 'meetup') {
    if (cvsBox) cvsBox.style.display = "none";
    if (manualBox) manualBox.style.display = "block";
    activeShippingFee = 0;
  } else {
    if (cvsBox) cvsBox.style.display = "block";
    if (manualBox) manualBox.style.display = "none";
    activeShippingFee = 60;
  }
  renderCheckoutSummary();
}

function selectPayment(method, el) {
  selectedPaymentMethod = method;
  const parent = el ? el.closest(".radio-grid") : null;
  if (parent) {
    parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
    if (el) el.classList.add("active");
  } else if (method === 'bank') {
    const bankCard = document.getElementById("payMethodBank");
    const codCard = document.getElementById("payMethodCod");
    if (bankCard) bankCard.classList.add("active");
    if (codCard) codCard.classList.remove("active");
  }

  const note = document.getElementById("paymentNote");
  if (note) {
    note.textContent = method === 'cod' ? "貨到超商門市付款即可。" : "請於 24 小時內完成轉帳，並回報後台對帳。";
  }
}
