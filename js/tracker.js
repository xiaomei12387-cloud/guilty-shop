// ==========================================================================
// 🎮 GUILTY PROTOCOL // TRACKER & DOSSIER ENGINE (js/tracker.js)
// ==========================================================================

const DEFAULT_PRESET_TAGS = {
  preferences: [
    "重度SP", "輕度訓誡", "神經突觸長鞭", "散鞭/九尾", 
    "精煉繩縛", "高空懸吊", "感官剝奪", "低溫滴蠟", 
    "外骨骼拘束", "項圈烙印", "罰跪限制", "任務調教", "放置/拘禁"
  ],
  hardLimits: [
    "❌ 拒絕穿刺/見血", "❌ 拒絕言語羞辱", "❌ 拒絕永久烙印", 
    "❌ 拒絕窒息/壓喉", "❌ 拒絕打擊臉部", "❌ 拒絕生繩", "❌ 拒絕公開場所"
  ]
};

// 取得當前登入特工的專屬隔離 Key
function getAgentStorageKey() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    return null;
  }
  const uid = (memberProfile.email || memberProfile.phone).replace(/[^a-zA-Z0-9]/g, '_');
  return `guilty_tracker_${uid}`;
}

// 產生新特工的預設空白狀態
function createDefaultTrackerState() {
  const agentName = (memberProfile && memberProfile.name) ? memberProfile.name : "特工";
  const agentRole = (memberProfile && memberProfile.role) ? memberProfile.role : "支配者 (Dom)";
  
  return {
    currentMode: "dom",
    profile: {
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(agentName),
      name: agentName,
      role: agentRole,
      twitter: "",
      safeword: "MAYDAY (紅色停止 / 黃色減速)",
      bio: "",
      allPreferences: [...DEFAULT_PRESET_TAGS.preferences],
      allLimits: [...DEFAULT_PRESET_TAGS.hardLimits],
      selectedTags: ["重度SP", "神經突觸長鞭"],
      limits: ["❌ 拒絕穿刺/見血", "❌ 拒絕窒息/壓喉"]
    },
    partners: [],
    activePartnerId: null
  };
}

// 當前動態載入的狀態庫
let trackerState = createDefaultTrackerState();

// 載入當前特工的專屬資料庫
function loadAgentTrackerState() {
  const key = getAgentStorageKey();
  if (!key) {
    trackerState = createDefaultTrackerState();
    return;
  }

  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      trackerState = JSON.parse(saved);
      // 確保陣列相容
      if (!trackerState.profile.allPreferences) trackerState.profile.allPreferences = [...DEFAULT_PRESET_TAGS.preferences];
      if (!trackerState.profile.allLimits) trackerState.profile.allLimits = [...DEFAULT_PRESET_TAGS.hardLimits];
    } catch (e) {
      trackerState = createDefaultTrackerState();
    }
  } else {
    // 首次登入該帳號，生成預設檔並存入
    trackerState = createDefaultTrackerState();
    saveTrackerState();
  }
}

// 儲存資料至當前特工名下
function saveTrackerState() {
  const key = getAgentStorageKey();
  if (key && trackerState) {
    localStorage.setItem(key, JSON.stringify(trackerState));
  }
}

// --------------------------------------------------------------------------
// 1. 視圖導覽控制
// --------------------------------------------------------------------------
function checkAgentAuth() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    alert("⚠️ [ 權限拒絕 // ACCESS DENIED ]\n此終端為特工專屬管制區，請先完成神經認證登入！");
    toggleAuthModal(true);
    return false;
  }
  return true;
}

function openTrackerAppView() {
  if (!checkAgentAuth()) return; // 未登入直接攔截
  toggleNav(false);
  setActiveView('view-tracker');
  renderTrackerApp();
  history.pushState({ view: 'tracker' }, '', '#tracker');
}

function openProfileDossierView() {
  if (!checkAgentAuth()) return; // 未登入直接攔截
  toggleNav(false);
  setActiveView('view-dossier');
  renderProfileDossier();
  history.pushState({ view: 'dossier' }, '', '#dossier');
}

// --------------------------------------------------------------------------
// 2. 實踐計數器與對象管理（主動/被動切換、計數、置頂、刪除）
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

function deletePartner(partnerId, e) {
  e.stopPropagation();
  const partner = trackerState.partners.find(p => p.id === partnerId);
  if (!partner) return;

  if (confirm(`⚠️ 確定要刪除互動對象 [${partner.name}] 及其所有紀錄嗎？`)) {
    trackerState.partners = trackerState.partners.filter(p => p.id !== partnerId);
    if (trackerState.activePartnerId === partnerId) {
      trackerState.activePartnerId = trackerState.partners.length > 0 ? trackerState.partners[0].id : null;
    }
    saveTrackerState();
    renderTrackerApp();
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
  const twitter = prompt("請輸入對方的 𝕏 (Twitter) 連結（選填）：", "");

  const newPartner = {
    id: "partner-" + Date.now().toString().slice(-6),
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(name),
    name: name.trim(),
    role: role ? role.trim() : "服從者 (Sub)",
    twitter: twitter ? twitter.trim() : "",
    isPinned: false,
    spCount: 0,
    whipCount: 0
  };

  trackerState.partners.push(newPartner);
  trackerState.activePartnerId = newPartner.id;
  saveTrackerState();
  renderTrackerApp();
}

function renderTrackerApp() {
  renderPartnerList();
  renderCounterDisplay();
}

function renderPartnerList() {
  const listEl = document.getElementById("trackerPartnerList");
  if (!listEl) return;

  if (trackerState.partners.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:20px 0;">目前無互動對象，請點擊上方按鈕新增。</div>`;
    return;
  }

  listEl.innerHTML = trackerState.partners.map(p => {
    const isActive = p.id === trackerState.activePartnerId;
    return `
      <div class="partner-card ${isActive ? 'active' : ''}" onclick="selectActivePartner('${p.id}')">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${p.avatar}" style="width:34px; height:34px; border-radius:50%; border:1px solid var(--accent-cyan);" />
          <div>
            <strong style="font-size:0.9rem; color:#fff;">${p.name}</strong>
            <span class="partner-role-badge">${p.role}</span>
            ${p.twitter ? `<br><a href="${p.twitter}" target="_blank" onclick="event.stopPropagation();" style="font-size:0.7rem; color:#1DA1F2; text-decoration:none;">𝕏 ${p.twitter.replace('https://x.com/', '@')} ↗</a>` : ''}
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-pin ${p.isPinned ? 'pinned' : ''}" onclick="togglePinPartner('${p.id}', event)">
            ${p.isPinned ? '📌' : '置頂'}
          </button>
          <button class="btn-del-partner" onclick="deletePartner('${p.id}', event)">刪除</button>
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

// --------------------------------------------------------------------------
// 3. 📷 相機即時掃碼與相簿解碼引擎
// --------------------------------------------------------------------------
let html5QrScannerInstance = null;

function openQrScanner() {
  const modal = document.getElementById('scannerModal');
  if (!modal) return;
  modal.classList.add('active');

  html5QrScannerInstance = new Html5Qrcode("qrReaderBox");
  const config = { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 };

  html5QrScannerInstance.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      closeQrScanner();
      handleScannedData(decodedText);
    },
    () => {}
  ).catch(err => {
    console.warn("無法啟動相機:", err);
    document.getElementById('qrReaderBox').innerHTML = `
      <div style="padding: 40px 14px; color: var(--text-muted); font-size: 0.8rem;">
        ⚠️ 相機權限未開啟或設備不支援。<br>請改用下方「選取 QR 截圖」或「手動輸入」。
      </div>
    `;
  });
}

function closeQrScanner() {
  const modal = document.getElementById('scannerModal');
  if (modal) modal.classList.remove('active');

  if (html5QrScannerInstance) {
    html5QrScannerInstance.stop().then(() => {
      html5QrScannerInstance.clear();
      html5QrScannerInstance = null;
    }).catch(() => {
      html5QrScannerInstance = null;
    });
  }
}

function scanQrFromImageFile(input) {
  const file = input.files[0];
  if (!file) return;

  const html5QrCode = new Html5Qrcode("qrReaderBox");
  html5QrCode.scanFile(file, true)
    .then(decodedText => {
      closeQrScanner();
      handleScannedData(decodedText);
    })
    .catch(() => {
      alert("❌ 圖片中未偵測到清晰的特工 QR Code，請重新嘗試！");
    });
}

function handleScannedData(rawText) {
  try {
    let payload = null;
    if (rawText.includes('data=')) {
      const splitStr = rawText.split('data=')[1];
      const cleanJson = decodeURIComponent(splitStr.split('&')[0]);
      payload = JSON.parse(cleanJson);
    } else {
      payload = JSON.parse(rawText);
    }

    if (!payload || !payload.name) {
      alert("❌ 無效的特工身分名片代碼！");
      return;
    }

    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    importScannedPartner(payload);

  } catch (e) {
    alert("❌ 解析代碼失敗，非本系統之特工 QR Code。");
  }
}

function importScannedPartner(data) {
  const exists = trackerState.partners.some(p => p.name === data.name);
  if (exists) {
    alert(`特工 [${data.name}] 已在您的互動清單中！`);
  } else {
    trackerState.partners.unshift({
      id: "partner-" + Date.now().toString().slice(-6),
      avatar: data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(data.name),
      name: data.name,
      role: data.role || "服從者 (Sub)",
      twitter: data.twitter || "",
      isPinned: true,
      spCount: 0,
      whipCount: 0
    });
    saveTrackerState();
    renderTrackerApp();
    alert(`✔ 成功同步！已將特工 [${data.name}] 存入互動對象清單！`);
  }
}

// --------------------------------------------------------------------------
// 4. 特工個人主頁 (Profile / Dossier View)
// --------------------------------------------------------------------------
function renderProfileDossier() {
  const prof = trackerState.profile;

  document.getElementById('dossierAvatarPreview').src = prof.avatar;
  document.getElementById('dossierNameDisplay').textContent = prof.name;
  document.getElementById('dossierRoleBadge').textContent = prof.role;
  document.getElementById('dossierBioDisplay').textContent = prof.bio || '尚未填寫簡介。';

  const twitterEl = document.getElementById('dossierTwitterLink');
  if (prof.twitter) {
    twitterEl.href = prof.twitter;
    twitterEl.textContent = `𝕏 ${prof.twitter.replace('https://x.com/', '@')} ↗`;
    twitterEl.style.display = 'inline-block';
  } else {
    twitterEl.style.display = 'none';
  }

  document.getElementById('profEditName').value = prof.name || '';
  document.getElementById('profEditRole').value = prof.role || '支配者 (Dom)';
  document.getElementById('profEditAvatar').value = prof.avatar || '';
  document.getElementById('profEditTwitter').value = prof.twitter || '';
  document.getElementById('profEditSafeword').value = prof.safeword || '';
  document.getElementById('profEditBio').value = prof.bio || '';

  renderProfileTags();
  generateMyQrCode();
}

function handleSaveProfileForm(e) {
  e.preventDefault();
  const p = trackerState.profile;
  p.name = document.getElementById('profEditName').value.trim() || p.name;
  p.role = document.getElementById('profEditRole').value;
  p.avatar = document.getElementById('profEditAvatar').value.trim() || p.avatar;
  p.twitter = document.getElementById('profEditTwitter').value.trim();
  p.safeword = document.getElementById('profEditSafeword').value.trim();
  p.bio = document.getElementById('profEditBio').value.trim();

  saveTrackerState();
  renderProfileDossier();
  alert("✔ 特工檔案與通行證已儲存更新！");
}

function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    document.getElementById('profEditAvatar').value = base64;
    trackerState.profile.avatar = base64;
    saveTrackerState();
    renderProfileDossier();
  };
  reader.readAsDataURL(file);
}

function addCustomTag(type) {
  const input = document.getElementById(type === 'pref' ? 'newCustomPrefInput' : 'newCustomLimitInput');
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
  const list = tagType === "pref" ? trackerState.profile.selectedTags : trackerState.profile.limits;
  const index = list.indexOf(tagText);
  if (index > -1) list.splice(index, 1);
  else list.push(tagText);

  saveTrackerState();
  renderProfileTags();
  generateMyQrCode();
}

function renderProfileTags() {
  const prefBox = document.getElementById("myPrefTagsBox");
  const limitBox = document.getElementById("myLimitTagsBox");
  if (!prefBox || !limitBox) return;

  const prof = trackerState.profile;
  prefBox.innerHTML = prof.allPreferences.map(tag => `
    <button type="button" class="matrix-tag-btn ${prof.selectedTags.includes(tag) ? 'active' : ''}" onclick="toggleTag('pref', '${tag}')">${tag}</button>
  `).join('');

  limitBox.innerHTML = prof.allLimits.map(tag => `
    <button type="button" class="matrix-tag-btn limit ${prof.limits.includes(tag) ? 'active' : ''}" onclick="toggleTag('limit', '${tag}')">${tag}</button>
  `).join('');
}

function generateMyQrCode() {
  const qrContainer = document.getElementById("myQrCodeBox");
  if (!qrContainer) return;

  const prof = trackerState.profile;
  const payload = {
    name: prof.name,
    role: prof.role,
    avatar: prof.avatar.startsWith('data:') ? '' : prof.avatar,
    twitter: prof.twitter,
    tags: prof.selectedTags,
    limits: prof.limits
  };

  const baseUrl = window.location.origin + window.location.pathname;
  const targetUrl = `${baseUrl}#import?data=${encodeURIComponent(JSON.stringify(payload))}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(targetUrl)}&color=00ff88&bgcolor=08080a`;

  qrContainer.innerHTML = `
    <img src="${qrApiUrl}" alt="Pass QR" style="width:170px; height:170px; border-radius:4px;" />
  `;
}

// 監聽 URL 外部名片帶入
window.addEventListener('load', () => {
  if (window.location.hash.includes('#import')) {
    const rawParam = window.location.hash.split('data=')[1];
    if (rawParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(rawParam));
        handleScannedData(JSON.stringify(decoded));
      } catch (e) {}
    }
  }
});
