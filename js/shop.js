// ==========================================
// 🛒 GUILTY SHOP & CHECKOUT ENGINE (js/shop.js)
// ==========================================

let cart = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CART)) || [];
let currentDetailProduct = null;
let currentDetailRopeLength = '8 米 (8M)';
let currentDetailRopePrice = 600;
let currentWhipLength = '1.2 米 (1.2M) [CQB // 近距校準型]';
let currentWhipBasePrice = 1500;
let currentWhipColor = '極夜黑 [VOID BLACK]';
let currentWhipExtra = 0;

let currentShippingType = '711';
let currentShippingName = '7-11 超商取貨';
let currentPayment = '超商取貨付款';
let appliedPromo = null;

let currentCityDistMap = {};
let currentDistrictStores = [];
let verifiedCreator = null;

let products = [
  { 
    id: 'cat-choker', 
    brand: 'guilty', 
    brandName: '欲室｜共犯 GUILTY', 
    badgeClass: 'badge-guilty', 
    title: '【貓痕義體拘束項圈】', 
    desc: '消光 SLS 外骨骼裝甲與 TPU 85A 柔性肉球矩陣，取下後隱形烙印顯影 30-60 分鐘。', 
    note: '🚨 09.11 正式解鎖預購調用 (Batch 01)',
    price: 1990,
    img: '',
    hasSizes: true,
    isPreorder: true,
    sizes: [
      'S 碼（淨脖圍 29–33 cm，Model 著用）',
      'M 碼（淨脖圍 34–38 cm）'
    ]
  },
  { 
    id: 'synapse-whip', 
    brand: 'guilty', 
    brandName: '欲室｜共犯 GUILTY', 
    badgeClass: 'badge-guilty', 
    title: '【神經突觸戰術長鞭】', 
    desc: '一體化重磅緊密編織，精準配重實心鞭芯，傳遞純粹的神經校準訊號。', 
    note: '⚡ 預製/客製配色排產調用',
    price: 1500,
    img: '',
    isWhip: true,
    lengths: [
      { label: '1.2 米 (1.2M) [CQB // 近距校準型]', price: 1500 },
      { label: '1.5 米 (1.5M) [EXTENDED // 遠距壓制型]', price: 1500 }
    ],
    colors: [
      { label: '極夜黑 [VOID BLACK]', extra: 0 },
      { label: '幽靈白 [GHOST WHITE]', extra: 0 },
      { label: '信號藍 [SIGNAL BLUE]', extra: 0 },
      { label: '紫黑混編 [NEURAL PURPLE]', extra: 0 },
      { label: '小丑魚 [CLOWNFISH]', extra: 0 },
      { label: '自訂特殊光譜（請備註 / 聯繫客服）(+NT$100)', extra: 100 }
    ]
  },
  { 
    id: 'shushi-rope', 
    brand: 'shushi', 
    brandName: 'shushi束室 繩教室', 
    badgeClass: 'badge-shushi', 
    title: '【束室繩教室｜特選精煉麻繩】', 
    desc: '束室精工脫漿、過油打蠟特選麻繩，13 種配色與生繩規格可選，手感溫潤柔韌。', 
    note: '⚡ 現貨正常調用發貨',
    price: 600,
    img: './images/image_rope.jpg',
    isCustomRope: true,
    lengths: [
      { label: '8 米 (8M)', price: 600 },
      { label: '10 米 (10M)', price: 700 }
    ],
    variants: [
      '未處理 原色生繩', '未處理 彩色生繩 (請先確認庫存)',
      '01 原色麻繩', '02 紅色麻繩', '03 粉紅色麻繩',
      '04 紫色麻繩', '05 深藍色麻繩', '06 藍色麻繩',
      '07 墨綠色麻繩', '08 軍綠色麻繩', '09 咖啡色麻繩',
      '10 橘色麻繩', '11 金黃色麻繩', '安全剪刀 (不挑色)'
    ]
  },
  { 
    id: 'shushi-cuff-guard', 
    brand: 'shushi', 
    brandName: 'shushi束室 繩教室', 
    badgeClass: 'badge-shushi', 
    title: '【束室繩教室｜防勒皮革護腕墊】', 
    desc: '專為高拉力懸吊與繩縛設計，提供肌膚緩衝與關節壓迫保護。', 
    note: '⚡ 現貨正常調用發貨',
    price: 1280,
    img: ''
  }
];

function saveCart() {
  localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(cart));
  updateCartUI();
}

function toggleCart(isOpen) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('navOverlay');
  if (isOpen) {
    drawer.classList.add('open');
    overlay.classList.add('active');
    renderCartDrawer();
  } else {
    drawer.classList.remove('open');
    if (!document.getElementById('sideNav').classList.contains('open')) {
      overlay.classList.remove('active');
    }
  }
}

function getCartTotalCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function updateCartUI() {
  document.getElementById('headerCartCount').textContent = getCartTotalCount();
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = document.getElementById('cartItemsContainer');
  const subtotalEl = document.getElementById('cartDrawerSubtotal');
  const freeShippingBanner = document.getElementById('cartFreeShippingBanner');
  const subtotal = getCartSubtotal();

  subtotalEl.textContent = `NT$ ${subtotal.toLocaleString()}`;

  if (subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD) {
    freeShippingBanner.innerHTML = `<span style="color:var(--accent-cyan); font-weight:bold;">⚡ 已解鎖全館滿 NT$ 1,800 免運特權！</span>`;
  } else {
    const diff = CONFIG.FREE_SHIPPING_THRESHOLD - subtotal;
    freeShippingBanner.innerHTML = `<span style="color:var(--text-muted);">差 <strong style="color:var(--accent-cyan);">NT$ ${diff.toLocaleString()}</strong> 即可享有免運交付</span>`;
  }

  if (cart.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:40px 0; font-size:0.85rem;">[ 裝備庫目前為空 ]<br>點擊裝備目錄即可添加調用</div>`;
    return;
  }

  container.innerHTML = cart.map((item, index) => {
    const thumbHtml = (item.img && item.img.trim() !== '')
      ? `<img src="${item.img}" class="cart-item-thumb" onclick="openProductDetail('${item.productId}')" alt="${item.title}" />`
      : `<div class="cart-item-thumb" onclick="openProductDetail('${item.productId}')" style="display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-muted);">SPEC</div>`;

    return `
      <div class="cart-item-card">
        ${thumbHtml}
        <div class="cart-item-info">
          <div class="cart-item-title" onclick="openProductDetail('${item.productId}')">${item.title}</div>
          <div class="cart-item-spec">${item.specText || '標準規格'}</div>
          <div class="cart-item-price">NT$ ${item.price.toLocaleString()}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="changeCartItemQty(${index}, -1)">-</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeCartItemQty(${index}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-del" onclick="removeCartItem(${index})" title="移除裝備">✕</button>
      </div>
    `;
  }).join('');
}

function changeCartItemQty(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
  }
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
}

function renderProductCards(filter = 'all') {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const filtered = filter === 'all' ? products : products.filter(p => p.brand === filter);
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = `product-card`;
    card.onclick = () => openProductDetail(p.id);

    let priceText = `NT$ ${p.price.toLocaleString()}`;
    if (p.isCustomRope) priceText = `NT$ 600 起`;

    const thumbContent = (p.img && p.img.trim() !== '')
      ? `<img src="${p.img}" alt="${p.title}" onerror="this.parentElement.innerHTML='[ ${p.title} 預覽圖 ]';" />`
      : `[ ${p.title} 預覽圖 ]`;

    const statusNoteHtml = p.isPreorder 
      ? `<div style="font-size:0.7rem; color:#ff334b; margin-top:4px; font-weight:bold;">${p.note}</div>`
      : `<div style="font-size:0.7rem; color:var(--accent-cyan); margin-top:4px;">${p.note}</div>`;

    card.innerHTML = `
      <div class="card-thumb">
        <span class="badge ${p.badgeClass}">${p.brandName}</span>
        ${thumbContent}
      </div>
      <div class="card-body">
        <div style="font-size: 0.95rem; margin-bottom: 4px; font-weight: bold;">${p.title}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">${p.desc}</div>
        ${statusNoteHtml}
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--panel-border); padding-top:10px; margin-top:8px;">
          <span style="color: ${p.brand === 'guilty' ? 'var(--accent-cyan)' : 'var(--accent-purple)'}; font-weight: bold; font-size: 0.9rem;">${priceText}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">檢視裝備配置 →</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterBrand(brand) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderProductCards(brand);
}

function openProductDetail(productId, push = true) {
  toggleCart(false);
  currentDetailProduct = products.find(p => p.id === productId);
  if (!currentDetailProduct) return;

  currentDetailRopeLength = '8 米 (8M)';
  currentDetailRopePrice = 600;
  currentWhipLength = '1.2 米 (1.2M) [CQB // 近距校準型]';
  currentWhipBasePrice = 1500;
  currentWhipColor = '極夜黑 [VOID BLACK]';
  currentWhipExtra = 0;

  const heroArea = document.getElementById('detailHeroImgArea');
  if (currentDetailProduct.img && currentDetailProduct.img.trim() !== '') {
    heroArea.innerHTML = `<img src="${currentDetailProduct.img}" alt="${currentDetailProduct.title}" onerror="this.parentElement.innerHTML='<span style=\\'color:var(--text-muted);\\'>[ ${currentDetailProduct.title} 3D 義體檔案庫 ]</span>';" />`;
  } else {
    heroArea.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem;"><span style="color:var(--accent-cyan); font-weight:bold;">[ ${currentDetailProduct.title} ]</span><br>SPEC // 3D 外骨骼參數化檔案庫</div>`;
  }

  document.getElementById('detailProductTitle').textContent = currentDetailProduct.title;
  let descNoteHtml = currentDetailProduct.isPreorder 
    ? `<div style="color:#ff334b; font-weight:bold; font-size:0.8rem; margin-bottom:8px; border-left:2px solid #ff334b; padding-left:8px;">[ 官方公關解鎖中 // 9/11 正式開啟預購調用排產 ]</div>`
    : `<div style="color:var(--accent-cyan); font-size:0.75rem; margin-bottom:8px; border-left:2px solid var(--accent-cyan); padding-left:8px;">[ 官方核心研發 // 正常調用交付 ]</div>`;

  document.getElementById('detailProductDesc').innerHTML = descNoteHtml + currentDetailProduct.desc;

  const dynamicArea = document.getElementById('detailDynamicOptions');
  const chokerSpecificArea = document.getElementById('detailChokerSpecificArea');
  
  if (currentDetailProduct.id === 'cat-choker') {
    dynamicArea.innerHTML = `
      <div style="margin-bottom: 12px;">
        <label style="font-size:0.75rem; color:var(--accent-cyan);">義體尺寸規格（Model 淨脖圍 30cm 著用 S 碼）*</label>
        <select id="detailChokerSizeSelect" style="border-color:var(--accent-cyan);">
          ${currentDetailProduct.sizes.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
    `;

    chokerSpecificArea.innerHTML = `
      <div style="background:#000; border:1px dashed var(--panel-border); padding:16px; text-align:center; margin:16px 0;">
        <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:4px;">[ 點擊/懸停模擬肉球壓印觸感 ]</div>
        <div class="stamp-preview" id="detailStampBox">
          <span id="detailStampText" style="color:var(--text-muted); font-size:0.75rem;">觸控體驗</span>
        </div>
        <div style="font-size:0.75rem; color:var(--danger-red);">取下後肌膚顯影：持續 30–60 分鐘</div>
      </div>
    `;
    document.getElementById('detailPriceDisplay').textContent = `NT$ ${currentDetailProduct.price.toLocaleString()}`;
    document.getElementById('detailCheckoutBtn').textContent = '9/11 開放預購・調用結帳 →';

  } else if (currentDetailProduct.isWhip) {
    chokerSpecificArea.innerHTML = ``;
    dynamicArea.innerHTML = `
      <div style="margin-bottom: 12px;">
        <label style="font-size:0.75rem; color:var(--accent-cyan);">長度規格 (LENGTH)*</label>
        <select id="detailWhipLengthSelect" onchange="onDetailWhipChange()" style="border-color:var(--accent-cyan);">
          ${currentDetailProduct.lengths.map(l => `<option value="${l.label}" data-price="${l.price}">${l.label} - NT$ ${l.price}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="font-size:0.75rem; color:var(--accent-cyan);">配色光譜 (SPECTRUM)*</label>
        <select id="detailWhipColorSelect" onchange="onDetailWhipChange()" style="border-color:var(--accent-cyan);">
          ${currentDetailProduct.colors.map(c => `<option value="${c.label}" data-extra="${c.extra}">${c.label}</option>`).join('')}
        </select>
      </div>
    `;
    updateWhipDetailPrice();
    document.getElementById('detailCheckoutBtn').textContent = '立即簽署協議結帳 →';

  } else if (currentDetailProduct.isCustomRope) {
    chokerSpecificArea.innerHTML = ``;
    dynamicArea.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div>
          <label style="font-size:0.75rem; color:var(--accent-purple);">長度規格*</label>
          <select id="detailRopeLengthSelect" onchange="onDetailRopeLengthChange(this)" style="border-color:var(--accent-purple);">
            ${currentDetailProduct.lengths.map(l => `<option value="${l.label}">${l.label} - NT$ ${l.price}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:0.75rem; color:var(--accent-purple);">款式顏色*</label>
          <select id="detailRopeVariantSelect" style="border-color:var(--accent-purple);">
            ${currentDetailProduct.variants.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
    document.getElementById('detailPriceDisplay').textContent = `NT$ ${currentDetailRopePrice.toLocaleString()}`;
    document.getElementById('detailCheckoutBtn').textContent = '立即簽署協議結帳 →';
  } else {
    chokerSpecificArea.innerHTML = ``;
    dynamicArea.innerHTML = '';
    document.getElementById('detailPriceDisplay').textContent = `NT$ ${currentDetailProduct.price.toLocaleString()}`;
    document.getElementById('detailCheckoutBtn').textContent = '立即簽署協議結帳 →';
  }

  setActiveView('view-product-detail');
  if (push) {
    history.pushState({ view: 'product-detail', productId: productId }, '', `#product-${productId}`);
  }
}

function onDetailRopeLengthChange(selectEl) {
  const selectedOption = currentDetailProduct.lengths.find(l => l.label === selectEl.value);
  if (selectedOption) {
    currentDetailRopeLength = selectedOption.label;
    currentDetailRopePrice = selectedOption.price;
    document.getElementById('detailPriceDisplay').textContent = `NT$ ${currentDetailRopePrice.toLocaleString()}`;
  }
}

function onDetailWhipChange() {
  const lenEl = document.getElementById('detailWhipLengthSelect');
  const colEl = document.getElementById('detailWhipColorSelect');
  const optLen = lenEl.options[lenEl.selectedIndex];
  const optCol = colEl.options[colEl.selectedIndex];

  currentWhipLength = optLen.value;
  currentWhipBasePrice = parseInt(optLen.getAttribute('data-price')) || 1500;

  currentWhipColor = optCol.value;
  currentWhipExtra = parseInt(optCol.getAttribute('data-extra')) || 0;

  updateWhipDetailPrice();
}

function updateWhipDetailPrice() {
  const total = currentWhipBasePrice + currentWhipExtra;
  document.getElementById('detailPriceDisplay').textContent = `NT$ ${total.toLocaleString()}`;
}

function getCurrentConfiguredCartItem() {
  if (!currentDetailProduct) return null;

  let specText = '標準規格';
  let itemPrice = currentDetailProduct.price;

  if (currentDetailProduct.hasSizes) {
    specText = document.getElementById('detailChokerSizeSelect') ? document.getElementById('detailChokerSizeSelect').value : '標準規格';
  } else if (currentDetailProduct.isWhip) {
    specText = `${currentWhipLength.split(' ')[0]} // ${currentWhipColor}`;
    itemPrice = currentWhipBasePrice + currentWhipExtra;
  } else if (currentDetailProduct.isCustomRope) {
    const lengthVal = document.getElementById('detailRopeLengthSelect').value;
    const variantVal = document.getElementById('detailRopeVariantSelect').value;
    specText = `${variantVal} // ${lengthVal}`;
    itemPrice = currentDetailRopePrice;
  }

  return {
    key: `${currentDetailProduct.id}_${specText}`,
    productId: currentDetailProduct.id,
    title: currentDetailProduct.title,
    specText: specText,
    price: itemPrice,
    img: currentDetailProduct.img,
    qty: 1
  };
}

function addCurrentProductToCart() {
  const item = getCurrentConfiguredCartItem();
  if (!item) return;

  const existingIndex = cart.findIndex(c => c.key === item.key);
  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push(item);
  }

  saveCart();
  toggleCart(true);
}

function buyNowFromDetail() {
  addCurrentProductToCart();
  proceedToCheckoutFromCart();
}

function calculateShippingFee(subtotal, shippingType) {
  if (shippingType === 'meetup') return 0;
  if (subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD) return 0;
  return shippingType === 'home' ? 120 : 60;
}

function proceedToCheckoutFromCart(push = true) {
  if (cart.length === 0) {
    alert('裝備庫為空，請先選擇裝備！');
    return;
  }
  toggleCart(false);
  renderCheckoutView();
  setActiveView('view-checkout');
  initCvsDropdowns();
  updateMemberUI();
  if (push) {
    history.pushState({ view: 'checkout' }, '', '#checkout');
  }
}

function onPhoneChanged() {
  if (appliedPromo && appliedPromo.code === 'IAMSUB') {
    applyPromoCode();
  }
}

async function checkIsFirstPurchase(phone) {
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;

  let localOrders = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS)) || [];
  const hasLocalOrder = localOrders.some(o => String(o.phone).replace(/[^0-9]/g, '') === cleanPhone);
  if (hasLocalOrder) return false;

  try {
    const res = await new Promise((resolve) => {
      const cbName = 'checkFirst_' + Date.now();
      window[cbName] = function(cloudOrders) {
        const scriptEl = document.getElementById(cbName);
        if (scriptEl) scriptEl.remove();
        delete window[cbName];
        resolve(!cloudOrders || cloudOrders.length === 0);
      };
      const script = document.createElement('script');
      script.id = cbName;
      script.src = `${CONFIG.API_URL}?phone=${encodeURIComponent(cleanPhone)}&callback=${cbName}&_t=${Date.now()}`;
      script.onerror = () => resolve(true);
      document.body.appendChild(script);
    });
    return res;
  } catch (e) {
    return true;
  }
}

async function applyPromoCode() {
  const input = document.getElementById('promoCodeInput');
  const msg = document.getElementById('promoStatusMsg');
  const code = input.value.trim().toUpperCase();

  if (!code) {
    msg.innerHTML = `<span style="color:var(--danger-red);">請輸入折扣碼！</span>`;
    return;
  }

  const now = new Date();

  if (code === 'TOMOTACHI') {
    const hasWhip = cart.some(item => item.productId === 'synapse-whip');
    if (!hasWhip) {
      msg.innerHTML = `<span style="color:var(--danger-red);">此折扣碼僅適用於【神經突觸戰術長鞭】！</span>`;
      return;
    }
    appliedPromo = { code: 'TOMOTACHI', type: 'whip_discount' };
    forceBankPayment(false);
    msg.innerHTML = `<span style="color:var(--accent-cyan); font-weight:bold;">✔ 已成功套用 TOMOTACHI 特友協議！</span>`;
    document.getElementById('removePromoBtn').style.display = 'inline-block';
    renderCheckoutView();
    return;
  }

  if (code === 'LOVEGUILTY') {
    const start = new Date('2026-09-06T00:00:00+08:00');
    const end = new Date('2026-09-11T19:00:00+08:00');
    if (now < start || now > end) {
      msg.innerHTML = `<span style="color:var(--danger-red);">【LOVEGUILTY】盲鳥優惠協議尚未開啟或已逾期！</span>`;
      return;
    }
    appliedPromo = { code: 'LOVEGUILTY', type: 'blind', forceBankTransfer: true };
    forceBankPayment(true);
    msg.innerHTML = `<span style="color:var(--accent-cyan); font-weight:bold;">✔ 已成功套用盲鳥優惠！(限定 ATM 匯款)</span>`;
    document.getElementById('removePromoBtn').style.display = 'inline-block';
    renderCheckoutView();
    return;
  }

  if (code === 'IAMSUB') {
    const phone = document.getElementById('custPhone').value.trim();
    if (!phone) {
      msg.innerHTML = `<span style="color:var(--danger-red);">請先填寫聯絡電話以驗證首購資格！</span>`;
      return;
    }
    const isFirst = await checkIsFirstPurchase(phone);
    if (!isFirst) {
      msg.innerHTML = `<span style="color:var(--danger-red);">此電話已有調用案件紀錄，非首購特工。</span>`;
      return;
    }
    appliedPromo = { code: 'IAMSUB', type: 'first' };
    forceBankPayment(false);
    msg.innerHTML = `<span style="color:var(--accent-cyan); font-weight:bold;">✔ 特工首購資格驗證通過！全單享 8 折。</span>`;
    document.getElementById('removePromoBtn').style.display = 'inline-block';
    renderCheckoutView();
    return;
  }

  if (code === 'WANG18X') {
    appliedPromo = { code: 'WANG18X', type: 'early' };
    forceBankPayment(false);
    msg.innerHTML = `<span style="color:var(--accent-cyan); font-weight:bold;">✔ 已成功套用早鳥優惠！</span>`;
    document.getElementById('removePromoBtn').style.display = 'inline-block';
    renderCheckoutView();
    return;
  }

  msg.innerHTML = `<span style="color:var(--danger-red);">無效的協議折扣碼。</span>`;
}

function removePromoCode() {
  appliedPromo = null;
  document.getElementById('promoCodeInput').value = '';
  document.getElementById('promoStatusMsg').innerHTML = ``;
  document.getElementById('removePromoBtn').style.display = 'none';
  forceBankPayment(false);
  renderCheckoutView();
}

function forceBankPayment(isForce) {
  const codBtn = document.getElementById('payMethodCod');
  const bankBtn = document.getElementById('payMethodBank');
  const note = document.getElementById('paymentNote');

  if (isForce) {
    codBtn.classList.remove('active');
    codBtn.classList.add('disabled');
    bankBtn.classList.add('active');
    currentPayment = '銀行 ATM 匯款';
    note.innerHTML = `<strong style="color:#ff334b;">⚡ 盲鳥特惠限定：本單僅限「銀行 ATM 匯款」支付。</strong>`;
  } else {
    codBtn.classList.remove('disabled');
  }
}

function calculateOrderFinancials() {
  let originalSubtotal = getCartSubtotal();
  let discountedSubtotal = originalSubtotal;
  let discountAmount = 0;

  if (appliedPromo) {
    if (appliedPromo.type === 'whip_discount') {
      discountedSubtotal = cart.reduce((sum, item) => sum + (item.productId === 'synapse-whip' ? (item.price - 300) * item.qty : item.price * item.qty), 0);
    } else if (appliedPromo.type === 'blind') {
      discountedSubtotal = cart.reduce((sum, item) => sum + (item.productId === 'cat-choker' ? 990 * item.qty : item.price * item.qty), 0);
    } else if (appliedPromo.type === 'early') {
      discountedSubtotal = cart.reduce((sum, item) => sum + (item.productId === 'cat-choker' ? 1580 * item.qty : item.price * item.qty), 0);
    } else if (appliedPromo.type === 'first') {
      discountedSubtotal = Math.round(originalSubtotal * 0.8);
    }
    discountAmount = originalSubtotal - discountedSubtotal;
  }

  const shippingFee = calculateShippingFee(discountedSubtotal, currentShippingType);
  return { originalSubtotal, discountedSubtotal, discountAmount, shippingFee, totalAmount: discountedSubtotal + shippingFee };
}

function renderCheckoutView() {
  const itemsListEl = document.getElementById('checkoutOrderItemsList');
  const summaryEl = document.getElementById('checkoutFinancialSummary');
  const fin = calculateOrderFinancials();

  itemsListEl.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--panel-border); padding:6px 0; font-size:0.85rem;">
      <div>
        <strong>${item.title}</strong>
        <span style="font-size:0.75rem; color:var(--text-muted); display:block;">規格：${item.specText} × ${item.qty}</span>
      </div>
      <div style="color:var(--accent-cyan); font-weight:bold;">NT$ ${(item.price * item.qty).toLocaleString()}</div>
    </div>
  `).join('');

  summaryEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.85rem;">
      <span style="color:var(--text-muted);">小計：</span>
      <span>NT$ ${fin.originalSubtotal.toLocaleString()}</span>
    </div>
    ${fin.discountAmount > 0 ? `<div style="display:flex; justify-content:space-between; color:#ff334b; font-size:0.85rem;"><span>折扣：</span><span>- NT$ ${fin.discountAmount.toLocaleString()}</span></div>` : ''}
    <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:0.85rem;">
      <span style="color:var(--text-muted);">運費 (${currentShippingName})：</span>
      <span>NT$ ${fin.shippingFee}</span>
    </div>
    <div style="display:flex; justify-content:space-between; border-top:1px solid var(--panel-border); padding-top:10px; margin-top:10px;">
      <span style="font-weight:bold; color:#fff;">總金額：</span>
      <span style="color:var(--accent-cyan); font-weight:bold; font-size:1.25rem;">NT$ ${fin.totalAmount.toLocaleString()}</span>
    </div>
  `;
}

function selectShipping(type, el) {
  el.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentShippingType = type;

  const cvsContainer = document.getElementById('cvsDropdownContainer');
  const manualGroup = document.getElementById('manualLocationGroup');

  if (type === '711' || type === 'family') {
    currentShippingName = type === '711' ? '7-11 超商取貨' : '全家 超商取貨';
    cvsContainer.style.display = 'block';
    manualGroup.style.display = 'none';
    initCvsDropdowns();
  } else {
    currentShippingName = type === 'home' ? '黑貓 宅配到府' : '線下面交';
    cvsContainer.style.display = 'none';
    manualGroup.style.display = 'block';
  }
  renderCheckoutView();
}

function selectPayment(type, el) {
  if (appliedPromo && appliedPromo.forceBankTransfer && type === 'cod') {
    alert('【盲鳥特惠限定】此折扣碼僅支援「銀行 ATM 匯款」！');
    return;
  }
  el.parentElement.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentPayment = type === 'cod' ? '超商取貨付款' : '銀行 ATM 匯款';
}

function initCvsDropdowns() {
  const citySelect = document.getElementById('cvsCitySelect');
  citySelect.innerHTML = '<option value="">-- 連線試算表載入縣市中... --</option>';

  const cbName = 'cvsInit_' + Date.now();
  window[cbName] = function(data) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    currentCityDistMap = {};
    if (data && data.length > 0) {
      data.forEach(item => {
        if (!currentCityDistMap[item.city]) currentCityDistMap[item.city] = new Set();
        if (item.dist) currentCityDistMap[item.city].add(item.dist);
      });

      citySelect.innerHTML = '<option value="">-- 選擇縣市 --</option>';
      Object.keys(currentCityDistMap).forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
    }
  };

  const script = document.createElement('script');
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getCvsLocations&brand=${currentShippingType}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function onCityChanged(cityName) {
  const distSelect = document.getElementById('cvsDistSelect');
  distSelect.innerHTML = '<option value="">-- 選擇區域 --</option>';
  if (!cityName || !currentCityDistMap[cityName]) {
    distSelect.disabled = true;
    return;
  }
  currentCityDistMap[cityName].forEach(dist => {
    const opt = document.createElement('option');
    opt.value = dist;
    opt.textContent = dist;
    distSelect.appendChild(opt);
  });
  distSelect.disabled = false;
}

function onDistChanged(distName) {
  const cityName = document.getElementById('cvsCitySelect').value;
  const storeSelect = document.getElementById('cvsStoreSelect');
  storeSelect.innerHTML = '<option value="">-- 門市清單載入中... --</option>';
  storeSelect.disabled = true;

  const cbName = 'cvsStore_' + Date.now();
  window[cbName] = function(stores) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    if (stores && stores.length > 0) {
      currentDistrictStores = stores;
      storeSelect.innerHTML = '<option value="">-- 選擇門市 --</option>';
      stores.forEach(st => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify(st);
        opt.textContent = `${st.name} [${st.addr}]`;
        storeSelect.appendChild(opt);
      });
      storeSelect.disabled = false;
    }
  };

  const script = document.createElement('script');
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getCvsLocations&brand=${currentShippingType}&city=${encodeURIComponent(cityName)}&dist=${encodeURIComponent(distName)}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

function onStorePicked(storeJsonStr) {
  if (!storeJsonStr) return;
  const store = JSON.parse(storeJsonStr);
  document.getElementById('confirmedStoreNameText').textContent = `${store.name} (店號: ${store.id})`;
  document.getElementById('confirmedStoreAddrText').textContent = store.addr;
  document.getElementById('storeConfirmedCard').style.display = 'block';
  document.getElementById('finalShippingLocation').value = `${store.name} (${store.id}) - ${store.addr}`;
}

// 結帳表單監聽
document.getElementById('checkoutForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert('裝備庫為空！');
    return;
  }

  const fin = calculateOrderFinancials();
  const orderData = {
    orderId: 'CASE-' + Date.now().toString().slice(-6),
    product: cart.map(item => `${item.title} (${item.specText}) × ${item.qty}`).join(' + '),
    price: fin.totalAmount,
    name: document.getElementById('custName').value.trim(),
    email: document.getElementById('custEmail').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    engraving: document.getElementById('custEngraving').value.trim() || '無',
    shipping: currentShippingName,
    location: document.getElementById('finalShippingLocation').value || document.getElementById('manualShippingLocation').value,
    payment: currentPayment,
    saveToProfile: document.getElementById('saveToProfileCheck').checked,
    createdAt: new Date().toLocaleString('zh-TW', { hour12: false })
  };

  fetch(CONFIG.API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(orderData)
  });

  cart = [];
  saveCart();
  setActiveView('view-success');
  alert(`✔ 案件 #${orderData.orderId} 簽署完成！`);
});