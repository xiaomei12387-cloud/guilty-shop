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

let trackerState = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TRACKER)) || {
  currentMode: "dom",
  profile: {
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=agent18x",
    name: "特工 18X",
    role: "支配者 (Dom)",
    twitter: "https://x.com/18X_inthc",
    customLinkTitle: "個人社群",
    customLinkUrl: "",
    bio: "工業義體外骨骼研發者。專注於精確神經回饋與參數化拘束。",
    safeword: "MAYDAY (紅色停止 / 黃色減速)",
    allPreferences: [...DEFAULT_PRESET_TAGS.preferences],
    allLimits: [...DEFAULT_PRESET_TAGS.hardLimits],
    selectedTags: ["重度SP", "神經突觸長鞭", "外骨骼拘束", "精煉繩縛"],
    limits: ["❌ 拒絕穿刺/見血", "❌ 拒絕窒息/壓喉"]
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
      whipCount: 12
    }
  ],
  activePartnerId: "partner-001"
};

if (!trackerState.profile.allPreferences) trackerState.profile.allPreferences = [...DEFAULT_PRESET_TAGS.preferences];
if (!trackerState.profile.allLimits) trackerState.profile.allLimits = [...DEFAULT_PRESET_TAGS.hardLimits];

function saveTrackerState() {
  localStorage.setItem(CONFIG.STORAGE_KEYS.TRACKER, JSON.stringify(trackerState));
}

// --------------------------------------------------------------------------
// 1. 視圖開啟控制
// --------------------------------------------------------------------------
function openTrackerAppView() {
  toggleNav(false);
  setActiveView('view-tracker');
  renderTrackerApp();
  history.pushState({ view: 'tracker' }, '', '#tracker');
}

function openProfileDossierView() {
  toggleNav(false);
  setActiveView('view-dossier');
  renderProfileDossier();
  history.pushState({ view: 'dossier' }, '', '#dossier');
}

// --------------------------------------------------------------------------
// 2. 實踐計數器與互動對象管理（新增 / 置頂 / 刪除）
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
    listEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:20px 0;">目前無互動對象，點擊上方按鈕新增。</div>`;
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
// 3. 個人特工主頁 (Profile / Dossier View)
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

  // 填寫編輯表單
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
