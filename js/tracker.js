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

// 即時工作階段（Session）計時狀態
let currentSessionTimer = null;
let sessionSecondsElapsed = 0;
let isSessionActive = false;

// HTML5 相機掃描器實例
let html5QrScannerInstance = null;

// 雲端自動同步防抖計時器
let syncDebounceTimer = null;

// --------------------------------------------------------------------------
// 1. 本地特工資料庫隔離核心 (Storage Segregation)
// --------------------------------------------------------------------------
function getAgentStorageKey() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    return null;
  }
  const uid = (memberProfile.email || memberProfile.phone).replace(/[^a-zA-Z0-9]/g, '_');
  return `guilty_tracker_${uid}`;
}

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
      bio: "尚未填寫特工宣言與實踐簡介。",
      allPreferences: [...DEFAULT_PRESET_TAGS.preferences],
      allLimits: [...DEFAULT_PRESET_TAGS.hardLimits],
      selectedTags: ["重度SP", "神經突觸長鞭"],
      limits: ["❌ 拒絕穿刺/見血", "❌ 拒絕窒息/壓喉"]
    },
    partners: [
      {
        id: "partner_default_sub",
        name: "範例對象・01",
        role: "服從者 (Sub)",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sub01",
        spCount: 0,
        whipCount: 0,
        safeword: "MAYDAY",
        tags: ["輕度訓誡", "精煉繩縛"],
        limits: ["❌ 拒絕穿刺/見血"],
        sessions: []
      }
    ],
    activePartnerId: "partner_default_sub"
  };
}

let trackerState = createDefaultTrackerState();

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
      if (!trackerState.profile.allPreferences) trackerState.profile.allPreferences = [...DEFAULT_PRESET_TAGS.preferences];
      if (!trackerState.profile.allLimits) trackerState.profile.allLimits = [...DEFAULT_PRESET_TAGS.hardLimits];
      if (trackerState.partners) {
        trackerState.partners.forEach(p => {
          if (!p.sessions) p.sessions = [];
        });
      }
    } catch (e) {
      trackerState = createDefaultTrackerState();
    }
  } else {
    trackerState = createDefaultTrackerState();
    saveTrackerState(true);
  }
}

// 儲存狀態（支援本機儲存與非同步雲端自動備份）
function saveTrackerState(skipCloud = false) {
  const key = getAgentStorageKey();
  if (key && trackerState) {
    localStorage.setItem(key, JSON.stringify(trackerState));
  }

  // 自動非同步雲端備份（防抖 2 秒避免頻繁請求）
  if (!skipCloud && memberProfile && (memberProfile.email || memberProfile.phone)) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      syncTrackerToCloud(true);
    }, 2000);
  }
}

// --------------------------------------------------------------------------
// 2. 視圖存取權限攔截
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
  if (!checkAgentAuth()) return;
  toggleNav(false);
  setActiveView('view-tracker');
  renderTrackerApp();
  history.pushState({ view: 'tracker' }, '', '#tracker');
}

function openProfileDossierView() {
  if (!checkAgentAuth()) return;
  toggleNav(false);
  setActiveView('view-dossier');
  renderProfileDossier();
  history.pushState({ view: 'dossier' }, '', '#dossier');
}

// --------------------------------------------------------------------------
// 3. 計數終端業務邏輯 (Tracker Engine)
// --------------------------------------------------------------------------
function getActivePartner() {
  if (!trackerState.partners || trackerState.partners.length === 0) return null;
  return trackerState.partners.find(p => p.id === trackerState.activePartnerId) || trackerState.partners[0];
}

function renderTrackerApp() {
  const activePartner = getActivePartner();
  const nameDisplay = document.getElementById("activePartnerNameDisplay");
  const spVal = document.getElementById("spCountVal");
  const whipVal = document.getElementById("whipCountVal");

  // 模式切換按鈕高亮
  const isDom = trackerState.currentMode === "dom";
  document.getElementById("btnModeDom").classList.toggle("active", isDom);
  document.getElementById("btnModeSub").classList.toggle("active", !isDom);

  if (activePartner) {
    nameDisplay.textContent = `[ 當前實踐對象：${activePartner.name} (${activePartner.role}) ]`;
    spVal.textContent = activePartner.spCount || 0;
    whipVal.textContent = activePartner.whipCount || 0;
  } else {
    nameDisplay.textContent = "[ 尚未選定互動對象 ]";
    spVal.textContent = 0;
    whipVal.textContent = 0;
  }

  renderPartnerList();
  renderSessionHUD();
  renderSessionLogs();
}

function switchTrackerMode(mode) {
  trackerState.currentMode = mode;
  saveTrackerState();
  renderTrackerApp();
}

function adjustCounter(type, delta) {
  const activePartner = getActivePartner();
  if (!activePartner) {
    alert("請先選定或新增互動對象！");
    return;
  }

  // 震動回饋 (Haptic Feedback)
  if (navigator.vibrate) {
    delta > 0 ? navigator.vibrate(40) : navigator.vibrate([20, 50, 20]);
  }

  if (type === "SP") {
    activePartner.spCount = Math.max(0, (activePartner.spCount || 0) + delta);
    document.getElementById("spCountVal").textContent = activePartner.spCount;
  } else if (type === "WHIP") {
    activePartner.whipCount = Math.max(0, (activePartner.whipCount || 0) + delta);
    document.getElementById("whipCountVal").textContent = activePartner.whipCount;
  }

  saveTrackerState();
}

function resetCounter(type) {
  const activePartner = getActivePartner();
  if (!activePartner) return;

  if (confirm(`確定要將 ${activePartner.name} 的 ${type} 計數歸零嗎？`)) {
    if (type === "SP") activePartner.spCount = 0;
    if (type === "WHIP") activePartner.whipCount = 0;
    saveTrackerState();
    renderTrackerApp();
  }
}

// --------------------------------------------------------------------------
// 4. 實踐工作階段邏輯 (Session Logs)
// --------------------------------------------------------------------------
function renderSessionHUD() {
  const container = document.getElementById("sessionHudArea");
  if (!container) return;

  if (isSessionActive) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#141416; border:1px solid var(--accent-cyan); padding:10px 14px; border-radius:4px; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--accent-cyan); box-shadow:0 0 8px var(--accent-cyan); animation:blink 1s infinite;"></span>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted);">實踐階段進行中</div>
            <div id="sessionTimerDisplay" style="font-size:1.4rem; font-weight:bold; color:var(--accent-cyan); font-family:monospace;">00:00</div>
          </div>
        </div>
        <button class="btn-submit" onclick="finishSessionPrompt()" style="width:auto; padding:8px 16px; font-size:0.8rem; background:var(--accent-purple); border-color:var(--accent-purple);">
          ■ 結束實踐並結案
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#000; border:1px dashed var(--panel-border); padding:10px 14px; border-radius:4px; margin-bottom:14px;">
        <div>
          <div style="font-size:0.8rem; font-weight:bold; color:#fff;">[ PROTOCOL SESSION // 實踐階段計時 ]</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">點擊啟動進入計時與當次累計模式</div>
        </div>
        <button class="btn-submit" onclick="startSession()" style="width:auto; padding:8px 16px; font-size:0.8rem;">
          ▶ 開始本次實踐
        </button>
      </div>
    `;
  }
}

function startSession() {
  const activePartner = getActivePartner();
  if (!activePartner) {
    alert("請先選擇或新增一個互動對象！");
    return;
  }

  isSessionActive = true;
  sessionSecondsElapsed = 0;

  activePartner.spCount = 0;
  activePartner.whipCount = 0;
  saveTrackerState();
  renderTrackerApp();

  clearInterval(currentSessionTimer);
  currentSessionTimer = setInterval(() => {
    sessionSecondsElapsed++;
    const timerDisplay = document.getElementById("sessionTimerDisplay");
    if (timerDisplay) {
      const mins = String(Math.floor(sessionSecondsElapsed / 60)).padStart(2, '0');
      const secs = String(sessionSecondsElapsed % 60).padStart(2, '0');
      timerDisplay.textContent = `${mins}:${secs}`;
    }
  }, 1000);

  renderSessionHUD();
}

function finishSessionPrompt() {
  if (!isSessionActive) return;

  const activePartner = getActivePartner();
  if (!activePartner) return;

  const note = prompt("請輸入本次實踐結案筆記（如：心理狀態、安全詞觸發反饋、部位反應）：", "實踐順利完成，雙方意識清醒。");
  if (note === null) return;

  clearInterval(currentSessionTimer);
  isSessionActive = false;

  const mins = Math.floor(sessionSecondsElapsed / 60);
  const secs = sessionSecondsElapsed % 60;
  const durationText = `${mins} 分 ${secs} 秒`;

  if (!activePartner.sessions) activePartner.sessions = [];

  activePartner.sessions.unshift({
    sessionId: "SES-" + Date.now().toString().slice(-6),
    date: new Date().toLocaleString("zh-TW", { hour12: false }),
    duration: durationText,
    spCount: activePartner.spCount || 0,
    whipCount: activePartner.whipCount || 0,
    note: note.trim() || "未填寫筆記"
  });

  saveTrackerState();
  renderSessionHUD();
  renderSessionLogs();
  alert(`✔ 本次實踐已封存！\n總時長：${durationText}\nSP 次數：${activePartner.spCount}\n長鞭擊數：${activePartner.whipCount}`);
}

function renderSessionLogs() {
  const listContainer = document.getElementById("sessionLogsContainer");
  if (!listContainer) return;

  const activePartner = getActivePartner();
  if (!activePartner) {
    listContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:15px 0;">[ 請先選取對象 ]</div>`;
    return;
  }

  if (!activePartner.sessions || activePartner.sessions.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:15px 0;">
        [ 尚無實踐歷程 ]<br>點擊「開始本次實踐」開啟調教計時
      </div>
    `;
    return;
  }

  listContainer.innerHTML = activePartner.sessions.map(s => `
    <div style="background:#0c0c0e; border:1px solid var(--panel-border); border-left:3px solid var(--accent-cyan); padding:10px; margin-bottom:8px; border-radius:2px; font-size:0.75rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="color:var(--accent-cyan); font-weight:bold; font-family:monospace;">#${s.sessionId} [${s.duration}]</span>
        <button onclick="deleteSessionLog('${s.sessionId}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.8rem;">✕</button>
      </div>
      <div style="color:var(--text-muted); font-size:0.7rem; margin-bottom:4px;">${s.date}</div>
      <div style="display:flex; gap:12px; margin-bottom:6px; color:#fff;">
        <span>SP：<strong style="color:var(--accent-cyan);">${s.spCount}</strong> 下</span>
        <span>長鞭：<strong style="color:var(--accent-purple);">${s.whipCount}</strong> 下</span>
      </div>
      <div style="color:#d4d4d8; background:#141416; padding:6px; border-radius:2px; border:1px dashed var(--panel-border);">
        💬 ${s.note}
      </div>
    </div>
  `).join('');
}

function deleteSessionLog(sessionId) {
  if (!confirm("確定要銷毀這筆實踐歷程紀錄嗎？")) return;
  const activePartner = getActivePartner();
  if (!activePartner || !activePartner.sessions) return;

  activePartner.sessions = activePartner.sessions.filter(s => s.sessionId !== sessionId);
  saveTrackerState();
  renderSessionLogs();
}

// --------------------------------------------------------------------------
// 5. 互動對象管理 (Partner Management)
// --------------------------------------------------------------------------
function renderPartnerList() {
  const container = document.getElementById("trackerPartnerList");
  if (!container) return;

  if (trackerState.partners.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:16px 0;">尚無對象，請點擊上方新增</div>`;
    return;
  }

  container.innerHTML = trackerState.partners.map(p => {
    const isActive = p.id === trackerState.activePartnerId;
    return `
      <div class="partner-card ${isActive ? 'active' : ''}" onclick="selectActivePartner('${p.id}')">
        <img src="${p.avatar}" class="partner-avatar" />
        <div style="flex:1; overflow:hidden;">
          <div style="display:flex; align-items:center; gap:6px;">
            <strong style="color:#fff; font-size:0.85rem;">${p.name}</strong>
            <span class="partner-role-badge">${p.role}</span>
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
            安全詞：<span style="color:var(--accent-cyan);">${p.safeword || '未設定'}</span>
          </div>
        </div>
        <div style="display:flex; gap:4px;" onclick="event.stopPropagation();">
          <button onclick="deletePartner('${p.id}')" style="background:transparent; border:none; color:var(--text-muted); font-size:1rem; cursor:pointer;">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function selectActivePartner(partnerId) {
  trackerState.activePartnerId = partnerId;
  saveTrackerState();
  renderTrackerApp();
}

function deletePartner(partnerId) {
  if (!confirm("確定要移除此互動對象檔案嗎？")) return;
  trackerState.partners = trackerState.partners.filter(p => p.id !== partnerId);
  if (trackerState.activePartnerId === partnerId) {
    trackerState.activePartnerId = trackerState.partners.length > 0 ? trackerState.partners[0].id : null;
  }
  saveTrackerState();
  renderTrackerApp();
}

function addNewPartnerPrompt() {
  const name = prompt("請輸入互動對象特工代號：");
  if (!name || !name.trim()) return;

  const role = prompt("請輸入陣營屬性 (例如：服從者 (Sub) 或 支配者 (Dom))：", "服從者 (Sub)");
  const newId = "partner_" + Date.now();

  trackerState.partners.push({
    id: newId,
    name: name.trim(),
    role: role.trim(),
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(name),
    spCount: 0,
    whipCount: 0,
    safeword: "MAYDAY",
    tags: [],
    limits: [],
    sessions: []
  });

  trackerState.activePartnerId = newId;
  saveTrackerState();
  renderTrackerApp();
}

// --------------------------------------------------------------------------
// 6. 相機掃描 QR Code 串接 (HTML5-QRCode)
// --------------------------------------------------------------------------
function openQrScanner() {
  const modal = document.getElementById("scannerModal");
  if (modal) modal.classList.add("active");

  if (typeof Html5Qrcode === "undefined") {
    alert("掃碼組件載入異常，請重新整理頁面。");
    return;
  }

  html5QrScannerInstance = new Html5Qrcode("qrReaderBox");
  html5QrScannerInstance.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (decodedText) => {
      handleScannedData(decodedText);
      closeQrScanner();
    },
    (errorMessage) => {}
  ).catch(err => {
    console.warn("相機啟動異常，可改用圖片上傳或手動輸入。", err);
  });
}

function closeQrScanner() {
  const modal = document.getElementById("scannerModal");
  if (modal) modal.classList.remove("active");

  if (html5QrScannerInstance) {
    html5QrScannerInstance.stop().then(() => {
      html5QrScannerInstance.clear();
      html5QrScannerInstance = null;
    }).catch(() => {
      html5QrScannerInstance = null;
    });
  }
}

function scanQrFromImageFile(inputEl) {
  if (!inputEl.files || inputEl.files.length === 0) return;
  const file = inputEl.files[0];

  const html5QrCode = new Html5Qrcode("qrReaderBox");
  html5QrCode.scanFile(file, true)
    .then(decodedText => {
      handleScannedData(decodedText);
      closeQrScanner();
    })
    .catch(err => {
      alert("無法在此圖片中辨識特工 QR Code，請確認圖片清晰度。");
    });
}

function handleScannedData(dataString) {
  try {
    let payload = null;
    if (dataString.startsWith("GUILTY:")) {
      payload = JSON.parse(decodeURIComponent(dataString.replace("GUILTY:", "")));
    } else {
      payload = JSON.parse(dataString);
    }

    if (!payload || !payload.name) {
      alert("❌ 掃描無效：此 QR 碼非 GUILTY 特工專屬數據。");
      return;
    }

    const newId = "partner_" + Date.now();
    trackerState.partners.push({
      id: newId,
      name: payload.name,
      role: payload.role || "服從者 (Sub)",
      avatar: payload.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payload.name)}`,
      spCount: 0,
      whipCount: 0,
      safeword: payload.safeword || "MAYDAY",
      tags: payload.tags || [],
      limits: payload.limits || [],
      sessions: []
    });

    trackerState.activePartnerId = newId;
    saveTrackerState();
    renderTrackerApp();
    alert(`✔ 成功同步對象特工名片：${payload.name}！`);
  } catch (err) {
    alert("❌ 解析失敗：QR Code 內容格式不相符。");
  }
}

// --------------------------------------------------------------------------
// 7. 特工個人主頁與偏好矩陣 (Profile & Dossier)
// --------------------------------------------------------------------------
function renderProfileDossier() {
  const prof = trackerState.profile;

  document.getElementById("dossierAvatarPreview").src = prof.avatar;
  document.getElementById("dossierNameDisplay").textContent = prof.name;
  document.getElementById("dossierRoleBadge").textContent = prof.role;
  document.getElementById("dossierBioDisplay").textContent = prof.bio || "尚未填寫特工簡介。";

  const twLink = document.getElementById("dossierTwitterLink");
  if (prof.twitter) {
    twLink.href = prof.twitter;
    twLink.style.display = "inline-block";
  } else {
    twLink.style.display = "none";
  }

  // 填入編輯表單預設值
  document.getElementById("profEditName").value = prof.name;
  document.getElementById("profEditRole").value = prof.role;
  document.getElementById("profEditTwitter").value = prof.twitter || "";
  document.getElementById("profEditSafeword").value = prof.safeword || "";
  document.getElementById("profEditBio").value = prof.bio || "";
  document.getElementById("profEditAvatar").value = prof.avatar || "";

  renderDossierTags();
  renderMyQrCode();
}

function renderDossierTags() {
  const prof = trackerState.profile;
  const prefBox = document.getElementById("myPrefTagsBox");
  const limitBox = document.getElementById("myLimitTagsBox");

  if (prefBox) {
    prefBox.innerHTML = prof.allPreferences.map(tag => {
      const isSelected = prof.selectedTags.includes(tag);
      return `<div class="tag-pill ${isSelected ? 'active' : ''}" onclick="toggleTagSelection('pref', '${tag}')">${tag}</div>`;
    }).join('');
  }

  if (limitBox) {
    limitBox.innerHTML = prof.allLimits.map(tag => {
      const isSelected = prof.limits.includes(tag);
      return `<div class="tag-pill ${isSelected ? 'active-limit' : ''}" onclick="toggleTagSelection('limit', '${tag}')">${tag}</div>`;
    }).join('');
  }
}

function toggleTagSelection(type, tag) {
  const prof = trackerState.profile;
  if (type === "pref") {
    if (prof.selectedTags.includes(tag)) {
      prof.selectedTags = prof.selectedTags.filter(t => t !== tag);
    } else {
      prof.selectedTags.push(tag);
    }
  } else {
    if (prof.limits.includes(tag)) {
      prof.limits = prof.limits.filter(t => t !== tag);
    } else {
      prof.limits.push(tag);
    }
  }
  saveTrackerState();
  renderDossierTags();
  renderMyQrCode();
}

function addCustomTag(type) {
  const input = type === "pref" ? document.getElementById("newCustomPrefInput") : document.getElementById("newCustomLimitInput");
  const val = input.value.trim();
  if (!val) return;

  const prof = trackerState.profile;
  if (type === "pref") {
    if (!prof.allPreferences.includes(val)) prof.allPreferences.push(val);
    if (!prof.selectedTags.includes(val)) prof.selectedTags.push(val);
  } else {
    if (!prof.allLimits.includes(val)) prof.allLimits.push(val);
    if (!prof.limits.includes(val)) prof.limits.push(val);
  }

  input.value = "";
  saveTrackerState();
  renderDossierTags();
  renderMyQrCode();
}

function renderMyQrCode() {
  const qrContainer = document.getElementById("myQrCodeBox");
  if (!qrContainer) return;

  const prof = trackerState.profile;
  const qrPayload = {
    name: prof.name,
    role: prof.role,
    avatar: prof.avatar,
    safeword: prof.safeword,
    tags: prof.selectedTags,
    limits: prof.limits
  };

  const encodedStr = "GUILTY:" + encodeURIComponent(JSON.stringify(qrPayload));
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(encodedStr)}&bgcolor=08080a&color=00ff88&margin=4`;

  // 加上 crossorigin="anonymous"
  qrContainer.innerHTML = `<img src="${qrApiUrl}" crossorigin="anonymous" style="width:160px; height:160px; border:1px solid var(--accent-cyan); padding:4px; background:#000;" />`;
}

function handleSaveProfileForm(e) {
  e.preventDefault();
  const prof = trackerState.profile;

  prof.name = document.getElementById("profEditName").value.trim();
  prof.role = document.getElementById("profEditRole").value;
  prof.twitter = document.getElementById("profEditTwitter").value.trim();
  prof.safeword = document.getElementById("profEditSafeword").value.trim();
  prof.bio = document.getElementById("profEditBio").value.trim();

  const customAvatarUrl = document.getElementById("profEditAvatar").value.trim();
  if (customAvatarUrl) {
    prof.avatar = customAvatarUrl;
  }

  saveTrackerState();
  renderProfileDossier();
  alert("✔ 特工檔案已成功更新！");
}

function handleAvatarUpload(inputEl) {
  if (!inputEl.files || inputEl.files.length === 0) return;
  const file = inputEl.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    trackerState.profile.avatar = e.target.result;
    document.getElementById("dossierAvatarPreview").src = e.target.result;
    saveTrackerState();
    renderMyQrCode();
  };
  reader.readAsDataURL(file);
}

// --------------------------------------------------------------------------
// 8. 實踐防護：安全詞急停協議 (EMERGENCY SAFEWORD PROTOCOL)
// --------------------------------------------------------------------------
function triggerEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  const displayWord = document.getElementById("emergencySafewordDisplay");
  if (!modal) return;

  const activePartner = getActivePartner();
  const word = (activePartner && activePartner.safeword) 
    ? activePartner.safeword 
    : (trackerState.profile.safeword || "MAYDAY");

  if (displayWord) {
    displayWord.textContent = word.toUpperCase();
  }

  // 觸發長震動警報
  if (navigator.vibrate) {
    navigator.vibrate([400, 100, 400, 100, 800]);
  }

  // 強制終止進行中的 Session
  if (isSessionActive) {
    clearInterval(currentSessionTimer);
    isSessionActive = false;

    const mins = Math.floor(sessionSecondsElapsed / 60);
    const secs = sessionSecondsElapsed % 60;
    const durationText = `${mins} 分 ${secs} 秒`;

    if (activePartner) {
      if (!activePartner.sessions) activePartner.sessions = [];
      activePartner.sessions.unshift({
        sessionId: "EMG-" + Date.now().toString().slice(-6),
        date: new Date().toLocaleString("zh-TW", { hour12: false }),
        duration: durationText,
        spCount: activePartner.spCount || 0,
        whipCount: activePartner.whipCount || 0,
        note: "⚠️ 觸發安全詞急停協議中斷實踐。"
      });
      saveTrackerState();
      renderSessionHUD();
      renderSessionLogs();
    }
  }

  modal.classList.add("active");
}

function dismissEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  if (modal) modal.classList.remove("active");
  if (navigator.vibrate) navigator.vibrate(0);
}

// --------------------------------------------------------------------------
// 9. TrackerDB 雲端非同步同步機制
// --------------------------------------------------------------------------

// 上傳本機狀態至 Google 試算表 (TrackerDB)
function syncTrackerToCloud(silent = false) {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    if (!silent) alert("請先登入特工帳號以啟用雲端資料庫備份！");
    return;
  }

  const payload = {
    action: "syncTrackerState",
    email: memberProfile.email || "",
    phone: memberProfile.phone || "",
    trackerState: trackerState
  };

  fetch(CONFIG.API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(() => {
    if (!silent) alert("✔ 終端實踐數據已成功加密備份至 TrackerDB 雲端！");
  }).catch(err => {
    if (!silent) alert("雲端同步失敗，請確認網路狀態。");
  });
}

// 自 Google 試算表 (TrackerDB) 下載並還原特工數據
function restoreTrackerFromCloud() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    alert("請先登入特工帳號！");
    return;
  }

  const account = memberProfile.email || memberProfile.phone;
  const cbName = "trackerCb_" + Date.now();

  window[cbName] = function(res) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    if (res && res.result === "success" && res.data) {
      try {
        const cloudState = JSON.parse(res.data);
        trackerState = cloudState;
        saveTrackerState(true); // 存入本機，避免迴圈上傳
        renderTrackerApp();
        alert("✔ 成功自 TrackerDB 雲端同步特工實踐歷程與對象檔案！");
      } catch (e) {
        alert("雲端數據解析異常。");
      }
    } else {
      alert("雲端目前尚無備份檔案，目前以本機資料為主。");
    }
  };

  const script = document.createElement("script");
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getTrackerState&account=${encodeURIComponent(account)}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

// --------------------------------------------------------------------------
// 10. 特工名片長圖匯出 (html2canvas)
// --------------------------------------------------------------------------
function exportDossierToImage() {
  const target = document.getElementById("dossierExportTarget");
  const btn = document.getElementById("btnExportCard");

  if (!target) return;
  if (typeof html2canvas === "undefined") {
    alert("長圖繪製組件尚未就緒，請重新整理頁面。");
    return;
  }

  btn.disabled = true;
  btn.textContent = "繪製中...";

  // 暫時移除卡片的雷射動畫光條，避免截圖出現奇怪光斑
  target.classList.add("exporting-mode");

  html2canvas(target, {
    backgroundColor: "#08080a",
    scale: 2, // 2 倍清晰度（Retina 畫質）
    useCORS: true, // 支援跨域圖片
    allowTaint: false,
    logging: false
  }).then(canvas => {
    target.classList.remove("exporting-mode");
    btn.disabled = false;
    btn.textContent = "📷 匯出名片圖";

    // 建立自動下載連結
    const link = document.createElement("a");
    const agentName = trackerState.profile.name || "特工";
    link.download = `GUILTY_DOSSIER_${agentName}_${Date.now().toString().slice(-4)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }).catch(err => {
    target.classList.remove("exporting-mode");
    btn.disabled = false;
    btn.textContent = "📷 匯出名片圖";
    console.error(err);
    alert("長圖生成失敗，若使用外部頭像網址可能受到跨域限制，建議改用「上傳本機圖檔」！");
  });
}

// --------------------------------------------------------------------------
// 11. 系統啟動初始化
// --------------------------------------------------------------------------
loadAgentTrackerState();
