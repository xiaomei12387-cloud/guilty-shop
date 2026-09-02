// ==========================================================================
// 🛒 GUILTY PROTOCOL // ARSENAL SHOP MODULE (js/shop.js)
// ==========================================================================

// 裝備產品目錄庫
const PRODUCTS = [
  {
    id: "guilty-choker",
    brand: "guilty",
    brandName: "欲室｜共犯",
    title: "貓掌印痕外骨骼項圈",
    price: 1990,
    desc: "3D 列印工業級尼龍裝甲，前喉結避空人體工學曲線。磁吸快拆模組，隱形微型顯影認罪印記。",
    note: "客製雷雕銘牌與神經顯影印記",
    img: "./icons/icon-512.png",
    specs: ["S 碼 (29-33cm)", "M 碼 (34-38cm)"]
  },
  {
    id: "guilty-whip",
    brand: "guilty",
    brandName: "欲室｜共犯",
    title: "神經突觸精密戰術長鞭",
    price: 1500,
    desc: "航太級配重手柄，耐磨高密編織鞭身。破空阻力極小化，提供銳利而精確的神經末梢感知。",
    note: "附防掉手腕帶與專屬收納套筒",
    img: "./icons/icon-512.png",
    // ✦ 升級為雙重動態規格選項，顏色與長度一次滿足！
    options: [
      { name: "顏色", values: ["黑", "白", "藍", "紫黑", "黑紅"] },
      { name: "長度", values: ["1.2 米 (CQB 近距校準型)", "1.5 米 (EXTENDED 遠距壓制型)"] }
    ],
    specs: [
      "黑 / 1.2M", "黑 / 1.5M", 
      "白 / 1.2M", "白 / 1.5M", 
      "藍 / 1.2M", "藍 / 1.5M", 
      "紫黑 / 1.2M", "紫黑 / 1.5M", 
      "黑紅 / 1.2M", "黑紅 / 1.5M"
    ]
  },
  {
    id: "shushi-rope",
    brand: "shushi",
    brandName: "shushi束室",
    title: "束室特選・職人手工精煉麻繩【3條組】",
    price: 990,
    desc: "13 道古法脫漿、深層天然植物油浸潤與蜂蠟烘烤。手感細膩溫潤，極度親膚且抗拉緊實。",
    note: "每組 3 條（每條長度 7.5 公尺，直徑 6mm）",
    img: "./images/image_rope.jpg",
    specs: ["深褐色 (黑胡桃油淬)", "天然原麻色 (白蜂蠟輕潤)"]
  },
  {
    id: "guilty-restraint",
    brand: "guilty",
    brandName: "欲室｜共犯",
    title: "外骨骼柔性戰術肢體束縛帶【對裝】",
    price: 1980,
    desc: "外層高強度工業織帶，內襯醫療級減壓 TPU。快拆戰術金屬插扣，長效配戴零勒痕壓迫。",
    note: "手腕與腳踝雙用通用尺寸",
    img: "./icons/icon-512.png",
    specs: ["標準對裝 (手腕用)", "加長對裝 (腳踝用)"]
  }
];

// 購物車與當前結帳狀態
let cart = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CART)) || [];
let currentProduct = null;
let currentSelectedSpec = null;
let currentChokerPrint = "微型顯影『罪』印記";
let currentShipping = "711";
let currentShippingName = "7-11 超商取貨";
let currentShippingFee = 60;
let currentPayment = "cod";
let appliedPromo = null;

// --------------------------------------------------------------------------
// 1. 裝備目錄渲染與過濾
// --------------------------------------------------------------------------
function renderProductCards(filter = "all") {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const filtered = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.brand === filter);

  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProductDetail('${p.id}')">
      <div class="card-thumb">
        <img src="${p.img}" alt="${p.title}" loading="lazy" />
        <span class="badge ${p.brand === 'guilty' ? 'badge-guilty' : 'badge-shushi'}">
          [ ${p.brandName} ]
        </span>
      </div>
      <div class="card-body">
        <h3 style="font-size:1rem; font-weight:bold; color:#fff; margin-bottom:6px;">${p.title}</h3>
        <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.5; margin-bottom:10px;">${p.desc}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--panel-border); padding-top:8px;">
          <span style="font-size:1.1rem; color:var(--accent-cyan); font-weight:bold;">NT$ ${p.price.toLocaleString()}</span>
          <span style="font-size:0.75rem; color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:2px 8px; border-radius:2px;">配置裝備 →</span>
        </div>
      </div>
    </div>
  `).join('');
}

function filterBrand(brand) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderProductCards(brand);
}

// --------------------------------------------------------------------------
// 2. 裝備詳細配置視圖
// --------------------------------------------------------------------------
function openProductDetail(productId) {
  currentProduct = PRODUCTS.find(p => p.id === productId);
  if (!currentProduct) return;

  currentSelectedSpec = currentProduct.specs[0];
  currentChokerPrint = "微型顯影『罪』印記";

  setActiveView("view-product-detail");
  history.pushState({ view: "detail", productId }, "", `#detail-${productId}`);

  document.getElementById("detailHeroImgArea").innerHTML = `
    <img src="${currentProduct.img}" style="width:100%; height:100%; object-fit:cover;" />
  `;
  document.getElementById("detailProductTitle").textContent = `${currentProduct.brandName} // ${currentProduct.title}`;
  document.getElementById("detailProductDesc").textContent = currentProduct.desc;
  document.getElementById("detailPriceDisplay").textContent = `NT$ ${currentProduct.price.toLocaleString()}`;

  // 動態規格選項
  const optContainer = document.getElementById("detailDynamicOptions");
  optContainer.innerHTML = `
    <label style="font-size:0.75rem; color:var(--accent-cyan); margin-bottom:6px;">▼ 選擇戰術規格 / 尺寸：</label>
    <div class="radio-grid" style="margin-bottom:14px;">
      ${currentProduct.specs.map((spec, i) => `
        <div class="radio-card ${i === 0 ? 'active' : ''}" onclick="selectDetailSpec('${spec}', this)">
          ${spec}
        </div>
      `).join('')}
    </div>
  `;

  // 旗艦項圈專屬自訂印記
  const chokerArea = document.getElementById("detailChokerSpecificArea");
  if (currentProduct.id === "guilty-choker") {
    chokerArea.innerHTML = `
      <div style="background:#000; border:1px dashed var(--accent-cyan); padding:12px; border-radius:4px; margin-bottom:14px;">
        <label style="font-size:0.75rem; color:var(--accent-cyan);">▼ 內襯微型顯影印記 (配戴壓迫顯影技術)：</label>
        <div class="radio-grid" style="margin-top:6px;">
          <div class="radio-card active" onclick="selectChokerPrint('微型顯影『罪』印記', this)">微型『罪』印記</div>
          <div class="radio-card" onclick="selectChokerPrint('神經突觸矩陣符號', this)">神經突觸符號</div>
          <div class="radio-card" onclick="selectChokerPrint('純黑無顯影 (極簡款)', this)">純黑無顯影</div>
        </div>
      </div>
    `;
  } else {
    chokerArea.innerHTML = "";
  }
}

function selectDetailSpec(spec, el) {
  currentSelectedSpec = spec;
  el.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function selectChokerPrint(printText, el) {
  currentChokerPrint = printText;
  el.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

// --------------------------------------------------------------------------
// 3. 購物車管理邏輯
// --------------------------------------------------------------------------
function saveCart() {
  localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(cart));
  updateCartUI();
}

function toggleCart(isOpen) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("navOverlay");
  if (isOpen) {
    drawer.classList.add("open");
    overlay.classList.add("active");
  } else {
    drawer.classList.remove("open");
    if (!document.getElementById("sideNav").classList.contains("open")) {
      overlay.classList.remove("active");
    }
  }
}

function addCurrentProductToCart() {
  if (!currentProduct) return;

  const specLabel = currentProduct.id === "guilty-choker" 
    ? `${currentSelectedSpec} / ${currentChokerPrint}` 
    : currentSelectedSpec;

  const cartItemId = `${currentProduct.id}_${specLabel}`;
  const existing = cart.find(item => item.cartItemId === cartItemId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId,
      id: currentProduct.id,
      title: currentProduct.title,
      brandName: currentProduct.brandName,
      price: currentProduct.price,
      specText: specLabel,
      img: currentProduct.img,
      qty: 1
    });
  }

  saveCart();
  toggleCart(true);
}

function buyNowFromDetail() {
  addCurrentProductToCart();
  toggleCart(false);
  openCheckoutView();
}

function updateCartQty(cartItemId, delta) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.cartItemId !== cartItemId);
  }
  saveCart();
}

function removeCartItem(cartItemId) {
  cart = cart.filter(i => i.cartItemId !== cartItemId);
  saveCart();
}

function getCartSubtotal() {
  return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
}

function updateCartUI() {
  const countBadge = document.getElementById("headerCartCount");
  const itemsContainer = document.getElementById("cartItemsContainer");
  const subtotalText = document.getElementById("cartDrawerSubtotal");
  const banner = document.getElementById("cartFreeShippingBanner");

  const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
  const subtotal = getCartSubtotal();

  if (countBadge) countBadge.textContent = totalQty;
  if (subtotalText) subtotalText.textContent = `NT$ ${subtotal.toLocaleString()}`;

  if (banner) {
    if (subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD) {
      banner.innerHTML = `<span style="color:var(--accent-cyan); font-weight:bold;">✔ 已達成免運門檻（滿 NT$ ${CONFIG.FREE_SHIPPING_THRESHOLD.toLocaleString()} 免運）</span>`;
    } else {
      const diff = CONFIG.FREE_SHIPPING_THRESHOLD - subtotal;
      banner.innerHTML = `<span style="color:var(--text-muted);">還差 <strong style="color:var(--accent-cyan);">NT$ ${diff.toLocaleString()}</strong> 享全館免運費</span>`;
    }
  }

  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); padding:40px 0; font-size:0.85rem;">
          [ 裝備庫目前為空 ]<br>點擊裝備加入調用清單
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item-card">
        <img src="${item.img}" class="cart-item-thumb" />
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-spec">${item.specText}</div>
          <div class="cart-item-price">NT$ ${item.price.toLocaleString()}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="updateCartQty('${item.cartItemId}', -1)">-</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty('${item.cartItemId}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-del" onclick="removeCartItem('${item.cartItemId}')">✕</button>
      </div>
    `).join('');
  }
}

function proceedToCheckoutFromCart() {
  if (cart.length === 0) {
    alert("裝備庫為空，請先選取裝備！");
    return;
  }
  toggleCart(false);
  openCheckoutView();
}

// --------------------------------------------------------------------------
// 4. 終端結帳與物流計算
// --------------------------------------------------------------------------
function calculateFinancials() {
  const subtotal = getCartSubtotal();
  const isFreeShip = subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD || currentShipping === "meetup";
  const shippingFee = isFreeShip ? 0 : currentShippingFee;

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent") {
      discount = Math.round(subtotal * (1 - appliedPromo.value));
    } else if (appliedPromo.type === "fixed") {
      discount = Math.min(subtotal, appliedPromo.value);
    }
  }

  const totalAmount = Math.max(0, subtotal - discount + shippingFee);
  return { subtotal, discount, shippingFee, totalAmount };
}

function openCheckoutView() {
  setActiveView("view-checkout");
  history.pushState({ view: "checkout" }, "", "#checkout");
  renderCheckoutSummary();
  initCvsCityDropdown();
}

function renderCheckoutSummary() {
  const itemsList = document.getElementById("checkoutOrderItemsList");
  const summaryBox = document.getElementById("checkoutFinancialSummary");
  if (!itemsList || !summaryBox) return;

  itemsList.innerHTML = cart.map(i => `
    <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:6px; border-bottom:1px dashed var(--panel-border); padding-bottom:6px;">
      <div>
        <span style="color:#fff;">${i.title}</span><br>
        <span style="color:var(--text-muted); font-size:0.75rem;">${i.specText} × ${i.qty}</span>
      </div>
      <div style="color:var(--accent-cyan); font-weight:bold;">NT$ ${(i.price * i.qty).toLocaleString()}</div>
    </div>
  `).join('');

  const fin = calculateFinancials();
  summaryBox.innerHTML = `
    <div style="margin-top:10px; font-size:0.85rem; line-height:1.8;">
      <div style="display:flex; justify-content:space-between;">
        <span style="color:var(--text-muted);">裝備小計：</span>
        <span>NT$ ${fin.subtotal.toLocaleString()}</span>
      </div>
      ${fin.discount > 0 ? `
        <div style="display:flex; justify-content:space-between; color:var(--danger-red);">
          <span>折扣代碼折抵 (${appliedPromo.code})：</span>
          <span>- NT$ ${fin.discount.toLocaleString()}</span>
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between;">
        <span style="color:var(--text-muted);">絕密隱私運費：</span>
        <span>${fin.shippingFee === 0 ? '<strong style="color:var(--accent-cyan);">免運 (FREE)</strong>' : `NT$ ${fin.shippingFee}`}</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-top:1px solid var(--panel-border); padding-top:8px; margin-top:8px; font-size:1.1rem; font-weight:bold;">
        <span style="color:#fff;">協議調用總額：</span>
        <span style="color:var(--accent-cyan);">NT$ ${fin.totalAmount.toLocaleString()}</span>
      </div>
    </div>
  `;
}

function selectShipping(type, el) {
  currentShipping = type;
  el.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  const cvsBox = document.getElementById("cvsDropdownContainer");
  const manualBox = document.getElementById("manualLocationGroup");

  if (type === "711") {
    currentShippingName = "7-11 超商取貨";
    currentShippingFee = 60;
    cvsBox.style.display = "block";
    manualBox.style.display = "none";
    initCvsCityDropdown();
  } else if (type === "family") {
    currentShippingName = "全家 超商取貨";
    currentShippingFee = 60;
    cvsBox.style.display = "block";
    manualBox.style.display = "none";
    initCvsCityDropdown();
  } else if (type === "home") {
    currentShippingName = "黑貓 絕密宅配";
    currentShippingFee = 120;
    cvsBox.style.display = "none";
    manualBox.style.display = "block";
  } else if (type === "meetup") {
    currentShippingName = "線下面交 (特工約定時地)";
    currentShippingFee = 0;
    cvsBox.style.display = "none";
    manualBox.style.display = "block";
  }

  renderCheckoutSummary();
}

function selectPayment(method, el) {
  currentPayment = method;
  el.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  const note = document.getElementById("paymentNote");
  if (method === "cod") {
    note.textContent = "貨物送達指定超商門市後，取貨現場付款即可。";
  } else {
    note.textContent = "請於送出訂單後，依畫面指示匯入指定安全帳戶以完成調用鎖定。";
  }
}

// --------------------------------------------------------------------------
// 5. 超商門市級聯下拉選單 (JSONP 串接 StoreDB)
// --------------------------------------------------------------------------
function initCvsCityDropdown() {
  const citySel = document.getElementById("cvsCitySelect");
  if (!citySel) return;

  citySel.innerHTML = "<option value=''>-- 載入縣市中... --</option>";
  const brand = currentShipping === "711" ? "711" : "family";

  const cbName = "cityCb_" + Date.now();
  window[cbName] = function(data) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    if (!data || data.length === 0) {
      citySel.innerHTML = "<option value=''>-- 無門市數據，改由手動填寫 --</option>";
      return;
    }

    const uniqueCities = [...new Set(data.map(item => item.city).filter(Boolean))];
    citySel.innerHTML = "<option value=''>-- 選擇縣市 --</option>" + 
      uniqueCities.map(c => `<option value="${c}">${c}</option>`).join('');
  };

  const script = document.createElement("script");
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getCvsLocations&brand=${brand}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function onCityChanged(city) {
  const distSel = document.getElementById("cvsDistSelect");
  const storeSel = document.getElementById("cvsStoreSelect");
  distSel.disabled = true;
  storeSel.disabled = true;
  storeSel.innerHTML = "<option value=''>-- 選擇門市名稱 (店號) --</option>";
  if (!city) return;

  const brand = currentShipping === "711" ? "711" : "family";
  const cbName = "distCb_" + Date.now();
  window[cbName] = function(data) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    const uniqueDists = [...new Set(data.filter(i => i.city === city).map(i => i.dist).filter(Boolean))];
    distSel.innerHTML = "<option value=''>-- 選擇行政區 --</option>" + 
      uniqueDists.map(d => `<option value="${d}">${d}</option>`).join('');
    distSel.disabled = false;
  };

  const script = document.createElement("script");
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getCvsLocations&brand=${brand}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function onDistChanged(dist) {
  const city = document.getElementById("cvsCitySelect").value;
  const storeSel = document.getElementById("cvsStoreSelect");
  storeSel.disabled = true;
  if (!dist) return;

  const brand = currentShipping === "711" ? "711" : "family";
  const cbName = "storeCb_" + Date.now();
  window[cbName] = function(data) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    storeSel.innerHTML = "<option value=''>-- 選擇超商門市 --</option>" + 
      data.map(st => `<option value="${st.id}|${st.name}|${st.addr}">${st.name} (${st.id})</option>`).join('');
    storeSel.disabled = false;
  };

  const script = document.createElement("script");
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getCvsLocations&brand=${brand}&city=${encodeURIComponent(city)}&dist=${encodeURIComponent(dist)}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function onStorePicked(val) {
  if (!val) return;
  const [id, name, addr] = val.split("|");
  const displayLocation = `${currentShippingName} ${name}門市 (店號:${id}) - ${addr}`;

  document.getElementById("finalShippingLocation").value = displayLocation;
  document.getElementById("confirmedStoreNameText").textContent = `${name} 門市 (店號: ${id})`;
  document.getElementById("confirmedStoreAddrText").textContent = addr;
  document.getElementById("storeConfirmedCard").style.display = "block";
}

// --------------------------------------------------------------------------
// 6. 優惠折扣碼核銷
// --------------------------------------------------------------------------
function applyPromoCode() {
  const codeInput = document.getElementById("promoCodeInput");
  const msg = document.getElementById("promoStatusMsg");
  const removeBtn = document.getElementById("removePromoBtn");
  const rawCode = codeInput.value.trim().toUpperCase();

  if (!rawCode) return;

  if (rawCode === "IAMSUB" || rawCode === "GUILTY90") {
    appliedPromo = { code: rawCode, type: "percent", value: 0.9 };
    msg.style.color = "var(--accent-cyan)";
    msg.textContent = `✔ 密鑰核銷成功：全單享有 9 折專屬優惠！`;
    removeBtn.style.display = "block";
    codeInput.disabled = true;
  } else if (rawCode === "FREESHIP") {
    appliedPromo = { code: rawCode, type: "fixed", value: currentShippingFee };
    msg.style.color = "var(--accent-cyan)";
    msg.textContent = `✔ 免運通行證生效：折抵全額運費！`;
    removeBtn.style.display = "block";
    codeInput.disabled = true;
  } else {
    msg.style.color = "var(--danger-red)";
    msg.textContent = `❌ 無效或已過期的折扣密鑰。`;
  }
  renderCheckoutSummary();
}

function removePromoCode() {
  appliedPromo = null;
  const codeInput = document.getElementById("promoCodeInput");
  const msg = document.getElementById("promoStatusMsg");
  const removeBtn = document.getElementById("removePromoBtn");

  codeInput.disabled = false;
  codeInput.value = "";
  msg.textContent = "";
  removeBtn.style.display = "none";
  renderCheckoutSummary();
}

// --------------------------------------------------------------------------
// 7. 簽署協議提交訂單 (含明確 action 標記，杜絕誤發通知)
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("裝備庫為空，無法進行協議調用！");
      return;
    }

    const finalLocation = document.getElementById("finalShippingLocation").value ||
                          document.getElementById("manualShippingLocation").value;

    if (!finalLocation) {
      alert("請完整選取取貨門市或填寫交付地址！");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "協議密鑰鎖定中 (ENCRYPTING)...";

    const fin = calculateFinancials();
    const orderData = {
      action: "createOrder", // 明確標記為建立訂單
      orderId: "CASE-" + Date.now().toString().slice(-6),
      product: cart.map(i => `${i.title} [${i.specText}] × ${i.qty}`).join(" + "),
      price: fin.totalAmount,
      name: document.getElementById("custName").value.trim(),
      email: document.getElementById("custEmail").value.trim(),
      phone: document.getElementById("custPhone").value.trim(),
      engraving: document.getElementById("custEngraving").value.trim() || "無",
      shipping: currentShippingName,
      location: finalLocation,
      payment: currentPayment === "cod" ? "超商取貨付款" : "銀行 ATM 匯款",
      saveToProfile: document.getElementById("saveToProfileCheck").checked,
      createdAt: new Date().toLocaleString("zh-TW", { hour12: false })
    };

    fetch(CONFIG.API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderData)
    }).then(() => {
      // 本機歷史紀錄封存
      const historyOrders = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS)) || [];
      historyOrders.unshift(orderData);
      localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(historyOrders));

      // 清空購物車
      cart = [];
      saveCart();

      // 切換至成功頁面
      submitBtn.disabled = false;
      submitBtn.textContent = "確認協議並鎖定調用 (LOCK)";
      setActiveView("view-success");
      history.pushState({ view: "success" }, "", "#success");
    }).catch(err => {
      submitBtn.disabled = false;
      submitBtn.textContent = "確認協議並鎖定調用 (LOCK)";
      alert("連線協議發送失敗，請檢查網路連線狀態！");
    });
  });
});
