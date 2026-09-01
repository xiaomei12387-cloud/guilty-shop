// ==========================================================================
// 🎮 GUILTY PROTOCOL // TRACKER & NEURAL PROFILE (js/tracker.js)
// ==========================================================================

const DEFAULT_PRESET_TAGS = {
  preferences: [
    "重度SP", "輕度訓誡", "神經突觸長鞭", "散鞭/九尾", 
    "精煉繩縛", "高空懸吊", "感官剝奪(眼罩/目鏡)", "低溫滴蠟", 
    "外骨骼拘束", "磁吸項圈烙印", "罰跪/體位限制", "任務調教", "放置/拘禁"
  ],
  hardLimits: [
    "❌ 拒絕見血/穿刺", "❌ 拒絕言語羞辱", "❌ 拒絕永久烙印", 
    "❌ 拒絕窒息/壓迫前喉", "❌ 拒絕臉部打擊", "❌ 拒絕未脫油生繩", "❌ 拒絕公開場所"
  ]
};

let trackerState = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TRACKER)) || {
  currentMode: "dom",
  profile: {
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=agent18x",
    name: "特工 18X",
    role: "支配者 (Dom)",
    twitter: "https://x.com/18X_inthc",
    customLinkTitle: "個人作品集",
    customLinkUrl: "",
    bio: "工業義體外骨骼研發者。專注於精確神經回饋與參數化拘束。",
    safeword: "MAYDAY (紅色停止 / 黃色減速)",
    allPreferences: [...DEFAULT_PRESET_TAGS.preferences],
    allLimits: [...DEFAULT_PRESET_TAGS.hardLimits],
    selectedTags: ["重度SP", "神經突觸長鞭", "外骨骼拘束", "精煉繩縛"],
    limits: ["❌ 拒絕見血/穿刺", "❌ 拒絕窒息/壓迫前喉"]
  },
  partners: [
    {
      id: "partner-001",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sub07",
      name: "服從者 No.07",
      role: "服從者 (Sub)",
      twitter: "https://x.com/",
      isPinned: true,
      spCount: 35,
      whipCount: 12,
      spTarget: 50,
      whipTarget: 20,
      notes: "耐受度良好，偏好 1.2M CQB 近身校準",
      history: []
    }
  ],
  activePartnerId: "partner-001",
  calendar: []
};

// 確保資料庫結構相容
if (!trackerState.profile.allPreferences) trackerState.profile.allPreferences = [...DEFAULT_PRESET_TAGS.preferences];
if (!trackerState.profile.allLimits) trackerState.profile.allLimits = [...DEFAULT_PRESET_TAGS.hardLimits];

function saveTrackerState() {
  localStorage.setItem(CONFIG.STORAGE_KEYS.TRACKER, JSON.stringify(trackerState));
}

// --------------------------------------------------------------------------
// 1. 個人檔案設定 (頭像、推特、自訂連結、自訂標籤)
// --------------------------------------------------------------------------
function handleSaveProfileForm(e) {
  e.preventDefault();
  const p = trackerState.profile;
  p.name = document.getElementById('profEditName').value.trim() || p.name;
  p.role = document.getElementById('profEditRole').value;
  p.avatar = document.getElementById('profEditAvatar').value.trim() || p.avatar;
  p.twitter = document.getElementById('profEditTwitter').value.trim();
  p.customLinkTitle = document.getElementById('profEditLinkTitle').value.trim();
  p.customLinkUrl = document.getElementById('profEditLinkUrl').value.trim();
  p.safeword = document.getElementById('profEditSafeword').value.trim();
  p.bio = document.getElementById('profEditBio').value.trim();

  saveTrackerState();
  renderTrackerApp();
  alert("✔ 個人特工檔案與通行證已更新！");
}

function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    document.getElementById('profEditAvatar').value = base64;
    document.getElementById('avatarPreviewImg').src = base64;
    trackerState.profile.avatar = base64;
    saveTrackerState();
    generateMyQrCode();
  };
  reader.readAsDataURL(file);
}

// 自訂新增偏好或雷點標籤
function addCustomTag(type) {
  const inputId = type === 'pref' ? 'newCustomPrefInput' : 'newCustomLimitInput';
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) return;

  const prof = trackerState.profile;
  if (type === 'pref') {
    if (!prof.allPreferences.includes(text)) prof.allPreferences.push(text);
    if (!prof.selectedTags.includes(text)) prof.selectedTags.push(text);
  } else {
    const limitText = text.startsWith('❌') ? text : `❌ ${text}`;
    if (!prof.allLimits.includes(limitText)) prof.allLimits.push(limitText);
    if (!prof.limits.includes(limitText)) prof.limits.push(limitText);
  }

  input.value = '';
  saveTrackerState();
  renderProfileTags();
  generateMyQrCode();
}

function toggleTag(tagType, tagText) {
  const profile = trackerState.profile;
  const list = tagType === "pref" ? profile.selectedTags : profile.limits;
  const index = list.indexOf(tagText);

  if (index > -1) {
    list.splice(index, 1);
  } else {
    list.push(tagText);
  }

  saveTrackerState();
  renderProfileTags();
  generateMyQrCode();
}

// --------------------------------------------------------------------------
// 2. QR Code 生成 (連到公開 Profile 參數與一鍵加好友)
// --------------------------------------------------------------------------
function generateMyQrCode() {
  const qrContainer = document.getElementById("myQrCodeBox");
  if (!qrContainer) return;

  const prof = trackerState.profile;
  const payload = {
    app: "GUILTY",
    v: 1,
    name: prof.name,
    role: prof.role,
    avatar: prof.avatar.startsWith('data:') ? '' : prof.avatar, // 避免 base64 過長
    twitter: prof.twitter,
    customTitle: prof.customLinkTitle,
    customUrl: prof.customLinkUrl,
    safeword: prof.safeword,
    tags: prof.selectedTags,
    limits: prof.limits
  };

  // 產生連到當前網址 Profile 視圖的 URL
  const baseUrl = window.location.origin + window.location.pathname;
  const profileUrl = `${baseUrl}#profile-view?data=${encodeURIComponent(JSON.stringify(payload))}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(profileUrl)}&color=00ff88&bgcolor=08080a`;
  qrContainer.innerHTML = `
    <img src="${qrApiUrl}" alt="Profile Pass QR" style="width:170px; height:170px; border-radius:4px; display:block; margin:0 auto;" />
    <div style="font-size:0.7rem; color:var(--accent-cyan); margin-top:6px; word-break:break-all;">
      <a href="${profileUrl}" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">🔗 點擊複製／開啟個人特工卡連結 ↗</a>
    </div>
  `;
}

// 解析 URL 帶入的 Profile 資料（例如掃碼打開）
function checkUrlProfileImport() {
  if (window.location.hash.includes('#profile-view')) {
    const rawParam = window.location.hash.split('?data=')[1];
    if (rawParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(rawParam));
        showExternalProfileModal(decoded);
      } catch (e) {
        console.warn("無法解析特工名片資料");
      }
    }
  }
}

function showExternalProfileModal(data) {
  const modalHtml = `
    <div class="auth-modal active" id="extProfileModal" style="display:flex;">
      <div class="auth-box" style="text-align:center;">
        <button class="auth-close" onclick="document.getElementById('extProfileModal').remove()">✕</button>
        <img src="${data.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}" style="width:70px; height:70px; border-radius:50%; border:2px solid var(--accent-cyan); margin:0 auto 10px; display:block;" />
        <h3 style="color:#fff; font-size:1.2rem;">${data.name}</h3>
        <span class="partner-role-badge">${data.role}</span>
        
        <div style="margin:14px 0; text-align:left; background:#000; padding:12px; border-radius:4px; font-size:0.8rem; line-height:1.6;">
          ${data.twitter ? `<div><strong>𝕏 推特：</strong><a href="${data.twitter}" target="_blank" style="color:#1DA1F2;">${data.twitter} ↗</a></div>` : ''}
          ${data.customUrl ? `<div><strong>${data.customTitle || '連結'}：</strong><a href="${data.customUrl}" target="_blank" style="color:var(--accent-cyan);">${data.customUrl} ↗</a></div>` : ''}
          <div style="margin-top:6px;"><strong>✦ 實踐偏好：</strong><br><span style="color:var(--accent-cyan);">${(data.tags || []).join('、 ') || '無'}</span></div>
          <div style="margin-top:6px;"><strong>✦ 絕對雷點：</strong><br><span style="color:var(--danger-red);">${(data.limits || []).join('、 ') || '無'}</span></div>
          ${data.safeword ? `<div style="margin-top:6px;"><strong>⚠️ 安全詞：</strong>${data.safeword}</div>` : ''}
        </div>

        <button class="btn-submit" onclick="importScannedPartner(${JSON.stringify(data).replace(/"/g, '&quot;')})" style="padding:12px;">＋ 一鍵加為互動對象 (CONNECT)</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function importScannedPartner(data) {
  const exists = trackerState.partners.some(p => p.name === data.name);
  if (exists) {
    alert(`特工 [${data.name}] 已在您的互動清單中！`);
  } else {
    trackerState.partners.unshift({
      id: "partner-" + Date.now().toString().slice(-6),
      avatar: data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + data.name,
      name: data.name,
      role: data.role || "服從者 (Sub)",
      twitter: data.twitter || "",
      isPinned: true,
      spCount: 0,
      whipCount: 0,
      notes: `【偏好】${(data.tags || []).join(', ')}\n【雷點】${(data.limits || []).join(', ')}`,
      history: []
    });
    saveTrackerState();
    renderTrackerApp();
    alert(`✔ 成功連線！已將特工 [${data.name}] 存入互動對象清單！`);
  }
  const m = document.getElementById('extProfileModal');
  if (m) m.remove();
}

// --------------------------------------------------------------------------
// 3. 計數器與對象管理
// --------------------------------------------------------------------------
function switchTrackerMode(mode) {
  trackerState.currentMode = mode;
  document.getElementById('btnModeDom').classList.toggle('active', mode === 'dom');
  document.getElementById('btnModeSub').classList.toggle('active', mode === 'sub');
  saveTrackerState();
  renderTrackerApp();
}

function getActivePartner() {
  return trackerState.partners.find(p => p.id === trackerState.activePartnerId) || trackerState.partners[0];
}

function adjustCounter(type, delta) {
  const partner = getActivePartner();
  if (!partner) {
    alert("請先於下方新增或選取對象！");
    return;
  }
  if (navigator.vibrate) navigator.vibrate(40);

  if (type === "SP") partner.spCount = Math.max(0, (partner.spCount || 0) + delta);
  if (type === "WHIP") partner.whipCount = Math.max(0, (partner.whipCount || 0) + delta);

  saveTrackerState();
  renderCounterDisplay();
}

function resetCounter(type) {
  const partner = getActivePartner();
  if (!partner) return;
  if (confirm(`確定要歸零特工 [${partner.name}] 的計數嗎？`)) {
    if (type === "SP") partner.spCount = 0;
    if (type === "WHIP") partner.whipCount = 0;
    saveTrackerState();
    renderCounterDisplay();
  }
}

function togglePinPartner(partnerId, e) {
  e.stopPropagation();
  const partner = trackerState.partners.find(p => p.id === partnerId);
  if (partner) {
    partner.isPinned = !partner.isPinned;
    trackerState.partners.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    saveTrackerState();
    renderPartnerList();
  }
}

function selectActivePartner(partnerId) {
  trackerState.activePartnerId = partnerId;
  saveTrackerState();
  renderTrackerApp();
}

function addNewPartnerPrompt() {
  const name = prompt("請輸入互動對象特工代號／稱呼：");
  if (!name || !name.trim()) return;
  const role = prompt("請設定陣營屬性（Dom / Switch / Sub）：", "服從者 (Sub)");
  const twitter = prompt("請輸入對方的 𝕏 (Twitter) 連結（選填）：", "https://x.com/");

  const newPartner = {
    id: "partner-" + Date.now().toString().slice(-6),
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(name),
    name: name.trim(),
    role: role ? role.trim() : "服從者 (Sub)",
    twitter: twitter ? twitter.trim() : "",
    isPinned: false,
    spCount: 0,
    whipCount: 0,
    notes: "",
    history: []
  };

  trackerState.partners.push(newPartner);
  trackerState.activePartnerId = newPartner.id;
  saveTrackerState();
  renderTrackerApp();
}

// --------------------------------------------------------------------------
// 4. 渲染函式
// --------------------------------------------------------------------------
function renderTrackerApp() {
  const prof = trackerState.profile;

  // 填寫編輯表單
  const editName = document.getElementById('profEditName');
  if (editName) {
    editName.value = prof.name || '';
    document.getElementById('profEditRole').value = prof.role || '支配者 (Dom)';
    document.getElementById('profEditAvatar').value = prof.avatar || '';
    document.getElementById('avatarPreviewImg').src = prof.avatar || '';
    document.getElementById('profEditTwitter').value = prof.twitter || '';
    document.getElementById('profEditLinkTitle').value = prof.customLinkTitle || '';
    document.getElementById('profEditLinkUrl').value = prof.customLinkUrl || '';
    document.getElementById('profEditSafeword').value = prof.safeword || '';
    document.getElementById('profEditBio').value = prof.bio || '';
  }

  renderPartnerList();
  renderCounterDisplay();
  renderProfileTags();
  generateMyQrCode();
}

function renderPartnerList() {
  const listEl = document.getElementById("trackerPartnerList");
  if (!listEl) return;

  listEl.innerHTML = trackerState.partners.map(p => {
    const isActive = p.id === trackerState.activePartnerId;
    return `
      <div class="partner-card ${isActive ? 'active' : ''}" onclick="selectActivePartner('${p.id}')">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${p.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + p.name}" style="width:36px; height:36px; border-radius:50%; border:1px solid var(--accent-cyan);" />
            <div>
              <strong style="font-size:0.95rem; color:#fff;">${p.name}</strong>
              <span class="partner-role-badge">${p.role}</span>
            </div>
          </div>
          <button class="pin-btn ${p.isPinned ? 'pinned' : ''}" onclick="togglePinPartner('${p.id}', event)" title="置頂對象">
            ${p.isPinned ? '📌 已置頂' : '📌 置頂'}
          </button>
        </div>
        ${p.twitter ? `<a href="${p.twitter}" target="_blank" onclick="event.stopPropagation();" class="twitter-badge">𝕏 ${p.twitter.replace('https://x.com/', '@')} ↗</a>` : ''}
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">
          累計 SP: <span style="color:var(--accent-cyan); font-weight:bold;">${p.spCount || 0}</span> 下 ｜ 鞭刑: <span style="color:var(--accent-purple); font-weight:bold;">${p.whipCount || 0}</span> 擊
        </div>
      </div>
    `;
  }).join('');
}

function renderCounterDisplay() {
  const partner = getActivePartner();
  const nameEl = document.getElementById("activePartnerNameDisplay");
  const spValEl = document.getElementById("spCountVal");
  const whipValEl = document.getElementById("whipCountVal");

  if (nameEl) nameEl.textContent = partner ? `[ 當前對象：${partner.name} (${partner.role}) ]` : "[ 尚未選定對象 ]";
  if (spValEl) spValEl.textContent = partner ? (partner.spCount || 0) : 0;
  if (whipValEl) whipValEl.textContent = partner ? (partner.whipCount || 0) : 0;
}

function renderProfileTags() {
  const prefBox = document.getElementById("myPrefTagsBox");
  const limitBox = document.getElementById("myLimitTagsBox");
  if (!prefBox || !limitBox) return;

  const prof = trackerState.profile;

  prefBox.innerHTML = prof.allPreferences.map(tag => {
    const isSelected = prof.selectedTags.includes(tag);
    return `<button type="button" class="matrix-tag-btn ${isSelected ? 'active' : ''}" onclick="toggleTag('pref', '${tag}')">${tag}</button>`;
  }).join('');

  limitBox.innerHTML = prof.allLimits.map(tag => {
    const isSelected = prof.limits.includes(tag);
    return `<button type="button" class="matrix-tag-btn limit ${isSelected ? 'active' : ''}" onclick="toggleTag('limit', '${tag}')">${tag}</button>`;
  }).join('');
}

// 頁面載入時檢查是否為掃碼進入
window.addEventListener('load', checkUrlProfileImport);
