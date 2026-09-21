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
    img: "./images/collar_all.png",
    images: ["./images/collar_all.png", "./images/collar_01.png", "./images/collar_02.png", "./images/collar_03.png", "./images/collar_04.png", "./images/collar_05.png"],
    specs: [],
    chokerSizes: ["S 碼 (29 – 33 cm)", "M 碼 (34 – 38 cm)"]
  },
  // 📦 戰術長鞭／皮革防護系列規格更新
  {
    id: "product-whip-01",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "神經校準戰術長鞭",
    price: 1500,
    desc: "重磅手工編織戰術長鞭。精確平衡配重，具備俐落破空手感與精準神經打擊反饋。",
    note: "提供 1.2米 / 1.5米 規格定制，選擇「其他顏色洽客服」將額外加收 NT$ 100 客製費用。",
    img: "./images/whip_01.png", 
    images: ["./images/whip_01.png","./images/whip_02.png","./images/whip_03.png"], 
    specs: ["黑", "白", "藍", "紫黑", "白灰", "其他顏色洽客服"],
    whipLengths: [
      { name: "1.2米", price: 1500 },
      { name: "1.5米", price: 1700 }
    ]
  },
  {
    id: "shushi-rope",
    brand: "shushi",
    brandName: "束室特選繩藝",
    title: "束室特選・職人手工精煉麻繩【單條裝】",
    price: 600,
    desc: "13 道古法脫漿、深層天然植物油浸潤與蜂蠟烘烤。手感細膩溫潤，極度親膚且抗拉緊實。",
    note: "單條裝（長度 7.5 公尺，直徑 6mm）",
    img: "./images/image_rope.jpg",
    images: ["./images/image_rope.jpg", "./icons/icon-512.png"],
    specs: ["深褐色 (黑胡桃油淬)", "天然原麻色 (白蜂蠟輕潤)"], 
    ropeLengths: [
      { name: "8米", price: 600 },
      { name: "10米", price: 700 }
    ]
  },
  {
    id: "product-鞭-long9",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "NEURO-9 脈衝九股教鞭",
    price: 2700,
    desc: "高密度編織工藝，長版九股設計。具備沉穩的揮擊重量與精準的破空反饋，提供強烈而清晰的感官刺激。",
    note: "專業戰術級長九股編織款式。",
    img: "./images/whipbar_03.png",
    images: ["./images/whipbar_03.png"],
    specs: ["標準配置"]
  },
  {
    id: "product-鞭-short3",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "FRACTURE-3 斷點三股教鞭",
    price: 800,
    desc: "精巧俐落的三股短鞭配置。適合近距離、高靈活度的精準點控與節奏訓誡。",
    note: "入門與進階皆宜的靈活短三股款式。",
    img: "./images/whipbar_02.png",
    images: ["./images/whipbar_02.png"],
    specs: ["標準配置"]
  },
  {
    id: "product-鞭-full",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "SHIELD-BAR 戰術全包教鞭",
    price: 1500,
    desc: "全面包覆防護設計的扎實教鞭。手感溫潤且兼具適度的打擊重量，兼顧安全與深刻的回饋感。",
    note: "全包覆防護戰術款式。",
    img: "./images/whipbar_01.png",
    images: ["./images/whipbar_01.png"],
    specs: ["標準配置"]
  }
];

let cart = JSON.parse(localStorage.getItem("guilty_cart")) || [];
let currentFilteredBrand = "all";
let activeCheckoutItem = null;
let activePromoDiscount = 0; 
let activeDiscountRate = 1.0;

let selectedProductSpec = "";
let selectedProductSize = "";
let selectedWhipLength = "";
let currentDetailPrice = 0;

function saveCart() {
  localStorage.setItem("guilty_cart", JSON.stringify(cart));
  updateCartUI();
}

function openProductDetail(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  activeCheckoutItem = p;
  selectedProductSpec = (p.specs && p.specs.length > 0) ? p.specs[0] : "標準配置";
  selectedProductSize = (p.chokerSizes && p.chokerSizes.length > 0) ? p.chokerSizes[0] : "";
  
  // 初始化鞭子/麻繩預設長度與價格
  selectedWhipLength = (p.whipLengths && p.whipLengths.length > 0) ? p.whipLengths[0].name : ((p.ropeLengths && p.ropeLengths.length > 0) ? p.ropeLengths[0].name : "");
  currentDetailPrice = (p.whipLengths && p.whipLengths.length > 0) ? p.whipLengths[0].price : ((p.ropeLengths && p.ropeLengths.length > 0) ? p.ropeLengths[0].price : p.price);

  document.getElementById("detailProductTitle").textContent = p.title;
  document.getElementById("detailProductDesc").textContent = p.desc;
  document.getElementById("detailPriceDisplay").textContent = `NT$ ${currentDetailPrice.toLocaleString()}`;
  
  // 動態渲染商品的專屬備註或客製說明提示
  const noteContainer = document.getElementById("detailProductNoteContainer");
  if (noteContainer) {
    if (p.note) {
      noteContainer.innerHTML = `
        <div class="mt-3 p-2.5 rounded bg-black/40 border border-[#00ff88]/20 text-[11px] font-mono text-[#00ff88] flex items-start gap-2">
          <span class="material-symbols-outlined text-[14px] shrink-0 mt-0.5">info</span>
          <span>${p.note}</span>
        </div>
      `;
    } else {
      noteContainer.innerHTML = "";
    }
  }

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
    // ✦ 鞭子或麻繩長度規格按鈕
    const lengths = p.whipLengths || p.ropeLengths;
    if (lengths && lengths.length > 0) {
      html += `
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:0.75rem; color:var(--accent-cyan); font-weight:bold;">✦ 選擇長度規格 (Length)*</label>
          <div class="radio-grid">
            ${lengths.map((l, idx) => `
              <div class="radio-card ${idx === 0 ? 'active' : ''}" onclick="selectWhipLength('${l.name}',${l.price}, this)">
                ${l.name} (NT$ ${l.price.toLocaleString()})
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 色彩 / 材質配置
    if (p.specs && p.specs.length > 0) {
      html += `
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:0.75rem; color:var(--accent-cyan); font-weight:bold;">✦ 色彩 / 材質配置* (選其他顏色請洽客服)</label>
          <div class="radio-grid" style="grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));">
            ${p.specs.map(s => `
              <div class="radio-card ${s === selectedProductSpec ? 'active' : ''}" onclick="selectSpec('${s}', this)" ${s === '其他顏色洽客服' ? 'style="border-style:dashed; color:var(--accent-purple);"' : ''}>
                ${s}
              </div>
            `).join('')}
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
          <label style="font-size:0.75rem; color:var(--accent-cyan); font-weight:bold;">✦ 項圈尺寸選擇 (Size)*</label>
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

// ✦ 智慧更新價格（長度基礎價 + 其他顏色加收 100 元）
function updateWhipDetailPrice() {
  const p = activeCheckoutItem;
  if (!p) return;

  let basePrice = p.price;
  const lengths = p.whipLengths || p.ropeLengths;
  if (lengths) {
    const foundLen = lengths.find(l => l.name === selectedWhipLength);
    if (foundLen) basePrice = foundLen.price;
  }

  let extra = (selectedProductSpec === "其他顏色洽客服") ? 100 : 0;
  currentDetailPrice = basePrice + extra;

  const priceDisplay = document.getElementById("detailPriceDisplay");
  if (priceDisplay) {
    priceDisplay.textContent = `NT$ ${currentDetailPrice.toLocaleString()}`;
  }
}

function selectWhipLength(lenName, basePrice, el) {
  selectedWhipLength = lenName;
  updateWhipDetailPrice();

  const parent = el.closest(".radio-grid");
  if (parent) parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
}

function selectSpec(spec, el) {
  selectedProductSpec = spec;
  updateWhipDetailPrice(); // 切換顏色時自動計算加價

  const parent = el.closest(".radio-grid");
  if (parent) parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
}

function updateCartUI() {
  const countBadge = document.getElementById("headerCartCountText");
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (countBadge) countBadge.textContent = `[${String(totalQty).padStart(2, '0')}]`;

  const countHeader = document.getElementById("cart-item-count");
  if (countHeader) countHeader.textContent = `${totalQty} 項目`;

  const container = document.getElementById("cart-list");
  const subtotalEl = document.getElementById("subtotal-val");
  const grandTotalEl = document.getElementById("grand-total-val");
  const shippingValEl = document.getElementById("shipping-val");
  const progressBar = document.getElementById("shipping-progress-bar");
  const progressText = document.getElementById("shipping-progress-text");

  if (!container || !subtotalEl) return;

  if (cart.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-zinc-500">調用抽屜目前無裝備</div>`;
    subtotalEl.textContent = "NT$ 0";
    if (grandTotalEl) grandTotalEl.textContent = "NT$ 60";
    if (shippingValEl) shippingValEl.textContent = "NT$ 60";
    if (progressBar) progressBar.style.width = "0%";
    if (progressText) progressText.textContent = "還差 NT$ 1,800";
    return;
  }

  let subtotal = 0;
  container.innerHTML = cart.map((item, index) => {
    subtotal += item.price * item.qty;
    const safeId = String(item.productId || "");

    return `
      <div class="flex items-center justify-between bg-black/50 p-2.5 rounded border border-white/5 gap-3">
        <img src="${item.img}" class="w-12 h-12 object-cover rounded border border-white/10 shrink-0 cursor-pointer" onclick="openProductDetail('${safeId}')" />
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold text-white truncate cursor-pointer hover:text-[#00ff88]" onclick="openProductDetail('${safeId}')">${item.title}</div>
          <div class="text-[10px] text-zinc-400 truncate">規格：${item.spec}</div>
          <div class="text-xs text-[#00ff88] font-mono mt-0.5">NT$ ${item.price.toLocaleString()} x ${item.qty}</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 font-mono">
          <button class="w-6 h-6 bg-surface-container border border-white/10 text-white rounded text-xs cursor-pointer hover:border-[#00ff88]" onclick="changeCartIndexQty(${index}, -1)">-</button>
          <span class="text-xs w-5 text-center text-white">${item.qty}</span>
          <button class="w-6 h-6 bg-surface-container border border-white/10 text-white rounded text-xs cursor-pointer hover:border-[#00ff88]" onclick="changeCartIndexQty(${index}, 1)">+</button>
          <button class="ml-1 text-zinc-500 hover:text-red-400 text-xs px-1 cursor-pointer" onclick="removeCartIndexItem(${index})">✕</button>
        </div>
      </div>
    `;
  }).join('');

  subtotalEl.textContent = `NT$ ${subtotal.toLocaleString()}`;

  // 計算運費與滿額進度
  let shippingFee = 60;
  if (subtotal >= 1800 || selectedShippingMethod === 'meetup') {
    shippingFee = 0;
  } else if (selectedShippingMethod === 'home') {
    shippingFee = 120;
  }

  if (shippingValEl) shippingValEl.textContent = shippingFee === 0 ? "免運 (FREE)" : `NT$ ${shippingFee}`;
  
  let discountedSubtotal = Math.round(subtotal * activeDiscountRate);
  let finalSubtotal = Math.max(0, discountedSubtotal - activePromoDiscount);
  let grandTotal = finalSubtotal + shippingFee;
  if (grandTotalEl) grandTotalEl.textContent = `NT$ ${grandTotal.toLocaleString()}`;

  if (progressBar && progressText) {
    if (subtotal >= 1800) {
      progressBar.style.width = "100%";
      progressText.textContent = "已達成免運協議！";
    } else {
      let percent = Math.min(100, Math.round((subtotal / 1800) * 100));
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `還差 NT$ ${(1800 - subtotal).toLocaleString()}`;
    }
  }
}

function toggleCart(isOpen) {
  const cartAside = document.querySelector("aside");
  if (cartAside) {
    cartAside.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  updateCartUI();
}

function toggleMobileCartDrawer(isOpen) {
  const drawer = document.getElementById("mobileCartDrawer");
  const overlay = document.getElementById("mobileCartOverlay");
  if (!drawer) return;

  if (isOpen) {
    drawer.style.transform = "translateY(0)";
    if (overlay) overlay.classList.remove("hidden");
    // 同步渲染手機抽屜內的清單
    const mobileList = document.getElementById("mobile-cart-list");
    const desktopList = document.getElementById("cart-list");
    if (mobileList && desktopList) {
      mobileList.innerHTML = desktopList.innerHTML;
    }
  } else {
    drawer.style.transform = "translateY(100%)";
    if (overlay) overlay.classList.add("hidden");
  }
}

// 同步在原本的 updateCartUI 底部加上手機列的數值更新
// (把這幾行加到你現有的 updateCartUI 函式結尾即可)
function updateMobileCartBarUI(totalQty, grandTotal) {
  const badge = document.getElementById("mobileCartCountBadge");
  const totalVal = document.getElementById("mobileGrandTotalVal");
  const mobSubtotal = document.getElementById("mobile-subtotal-val");
  const mobGrand = document.getElementById("mobile-grand-total-val");

  if (badge) badge.textContent = totalQty;
  if (totalVal) totalVal.textContent = `NT$ ${grandTotal.toLocaleString()}`;
  if (mobSubtotal) mobSubtotal.textContent = document.getElementById("subtotal-val")?.textContent || "NT$ 0";
  if (mobGrand) mobGrand.textContent = `NT$ ${grandTotal.toLocaleString()}`;
}

function changeCartIndexQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
}

function removeCartIndexItem(index) {
  if (!cart[index]) return;
  cart.splice(index, 1);
  saveCart();
}

function filterBrand(brand) {
  currentFilteredBrand = brand;
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  renderProductCards();
}

function renderProductCards() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

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

function selectChokerSize(size, el) {
  selectedProductSize = size;
  const parent = el.closest(".radio-grid");
  if (parent) parent.querySelectorAll(".radio-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
}

function addCurrentProductToCart() {
  if (!activeCheckoutItem) return;

  let specParts = [];
  if (selectedWhipLength) specParts.push(selectedWhipLength);
  if (selectedProductSpec) specParts.push(selectedProductSpec);
  if (selectedProductSize) specParts.push(selectedProductSize);
  const specText = specParts.join(" / ") || "標準配置";

  const finalPrice = currentDetailPrice || activeCheckoutItem.price;

  const existing = cart.find(i => i.productId === activeCheckoutItem.id && i.spec === specText);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      productId: activeCheckoutItem.id,
      title: activeCheckoutItem.title,
      price: finalPrice,
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

  let specParts = [];
  if (selectedWhipLength) specParts.push(selectedWhipLength);
  if (selectedProductSpec) specParts.push(selectedProductSpec);
  if (selectedProductSize) specParts.push(selectedProductSize);
  const specText = specParts.join(" / ") || "標準配置";

  const finalPrice = currentDetailPrice || activeCheckoutItem.price;

  cart = [{
    productId: activeCheckoutItem.id,
    title: activeCheckoutItem.title,
    price: finalPrice,
    img: activeCheckoutItem.img,
    spec: specText,
    qty: 1
  }];
  saveCart();
  proceedToCheckoutFromCart();
}

// --------------------------------------------------------------------------
// 💳 結帳、優惠碼與串接試算表 StoreDB 超商聯動引擎
// --------------------------------------------------------------------------
let selectedShippingMethod = "711";
let selectedPaymentMethod = "cod";
let activeShippingFee = 60;
let cachedStoreLocations = [];

function proceedToCheckoutFromCart() {
  if (cart.length === 0) {
    alert("裝備庫目前為空！");
    return;
  }
  toggleCart(false);
  renderCheckoutSummary();
  loadCvsCities(selectedShippingMethod);
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
    loadCvsCities(method);
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

// --------------------------------------------------------------------------
// 📍 StoreDB 超商試算表聯動邏輯
// --------------------------------------------------------------------------
function loadCvsCities(brand) {
  const citySelect = document.getElementById("cvsCitySelect");
  const distSelect = document.getElementById("cvsDistSelect");
  const storeSelect = document.getElementById("cvsStoreSelect");
  if (!citySelect) return;

  citySelect.innerHTML = `<option value="">載入縣市中...</option>`;
  if (distSelect) { distSelect.innerHTML = `<option value="">-- 行政區 --</option>`; distSelect.disabled = true; }
  if (storeSelect) { storeSelect.innerHTML = `<option value="">-- 門市名稱 --</option>`; storeSelect.disabled = true; }

  const url = `${CONFIG.API_URL}?action=getCvsLocations&brand=${brand}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      cachedStoreLocations = data || [];
      const cities = [...new Set(cachedStoreLocations.map(item => item.city))].filter(Boolean);
      citySelect.innerHTML = `<option value="">-- 選擇縣市 --</option>` + cities.map(c => `<option value="${c}">${c}</option>`).join('');
    })
    .catch(() => {
      citySelect.innerHTML = `<option value="">載入失敗，請重試</option>`;
    });
}

function onCityChanged(cityName) {
  const distSelect = document.getElementById("cvsDistSelect");
  const storeSelect = document.getElementById("cvsStoreSelect");
  if (!distSelect) return;

  if (!cityName) {
    distSelect.innerHTML = `<option value="">-- 行政區 --</option>`;
    distSelect.disabled = true;
    if (storeSelect) { storeSelect.innerHTML = `<option value="">-- 門市名稱 --</option>`; storeSelect.disabled = true; }
    return;
  }

  const filtered = cachedStoreLocations.filter(i => i.city === cityName);
  const dists = [...new Set(filtered.map(item => item.dist))].filter(Boolean);

  distSelect.innerHTML = `<option value="">-- 選擇行政區 --</option>` + dists.map(d => `<option value="${d}">${d}</option>`).join('');
  distSelect.disabled = false;
  if (storeSelect) { storeSelect.innerHTML = `<option value="">-- 門市名稱 --</option>`; storeSelect.disabled = true; }
}

function onDistChanged(distName) {
  const storeSelect = document.getElementById("cvsStoreSelect");
  const cityName = document.getElementById("cvsCitySelect").value;
  if (!storeSelect) return;

  if (!distName) {
    storeSelect.innerHTML = `<option value="">-- 門市名稱 --</option>`;
    storeSelect.disabled = true;
    return;
  }

  const brand = selectedShippingMethod; 
  const url = `${CONFIG.API_URL}?action=getCvsLocations&brand=${brand}&city=${encodeURIComponent(cityName)}&dist=${encodeURIComponent(distName)}`;
  
  storeSelect.innerHTML = `<option value="">載入門市中...</option>`;
  storeSelect.disabled = true;

  fetch(url)
    .then(res => res.json())
    .then(stores => {
      if (!stores || stores.length === 0) {
        storeSelect.innerHTML = `<option value="">此區域無可用門市</option>`;
        return;
      }
      storeSelect.innerHTML = `<option value="">-- 選擇門市 (${stores.length}家) --</option>` + stores.map(s => `
        <option value="${s.id}" data-name="${s.name}" data-addr="${s.addr}">${s.name} (${s.id}) - ${s.addr}</option>
      `).join('');
      storeSelect.disabled = false;
    })
    .catch(() => {
      storeSelect.innerHTML = `<option value="">門市載入失敗</option>`;
    });
}

function onStorePicked(storeId) {
  const storeSelect = document.getElementById("cvsStoreSelect");
  const confirmedCard = document.getElementById("storeConfirmedCard");
  const nameText = document.getElementById("confirmedStoreNameText");
  const addrText = document.getElementById("confirmedStoreAddrText");
  const hiddenInput = document.getElementById("finalShippingLocation");

  if (!storeId || !storeSelect) {
    if (confirmedCard) confirmedCard.style.display = "none";
    return;
  }

  const opt = storeSelect.options[storeSelect.selectedIndex];
  const storeName = opt.getAttribute("data-name") || "";
  const storeAddr = opt.getAttribute("data-addr") || "";
  const fullText = `[${selectedShippingMethod.toUpperCase()}] ${storeName} (${storeId}) - ${storeAddr}`;

  if (confirmedCard && nameText && addrText && hiddenInput) {
    nameText.textContent = `${storeName} (代號: ${storeId})`;
    addrText.textContent = storeAddr;
    confirmedCard.style.display = "block";
    hiddenInput.value = fullText;
  }
}

// --------------------------------------------------------------------------
// 📄 渲染訂單成功明細與 ATM 匯款資訊
// --------------------------------------------------------------------------
function renderSuccessOrderSummary(order) {
  const detailsBox = document.getElementById("successOrderDetailsContent");
  const atmBox = document.getElementById("successAtmBox");
  const atmTotal = document.getElementById("successAtmTotal");
  if (!detailsBox) return;

  if (order.payment.includes("ATM") || order.payment.includes("銀行")) {
    if (atmBox) atmBox.style.display = "block";
    if (atmTotal) atmTotal.textContent = `NT$ ${order.price.toLocaleString()}`;
  } else {
    if (atmBox) atmBox.style.display = "none";
  }

  detailsBox.innerHTML = `
    <div><strong>案件編號：</strong><span style="color:var(--accent-cyan);">${order.orderId}</span></div>
    <div><strong>調用裝備：</strong>${order.product}</div>
    <div><strong>協議總額：</strong><span style="color:var(--accent-cyan); font-weight:bold;">NT$ ${order.price.toLocaleString()} (${order.payment})</span></div>
    <div><strong>收件特工：</strong>${order.name} (${order.phone})</div>
    <div><strong>安全信箱：</strong>${order.email || '未提供'}</div>
    <div><strong>配送途徑：</strong>${order.shipping}</div>
    <div><strong>取件地點：</strong><span style="color:#fff;">${order.location}</span></div>
    ${order.engraving ? `<div><strong>客製備註：</strong>${order.engraving}</div>` : ''}
  `;
}
