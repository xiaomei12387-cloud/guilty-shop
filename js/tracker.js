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

let currentSessionTimer = null;
let sessionSecondsElapsed = 0;
let isSessionActive = false;
let html5QrScannerInstance = null;
let syncDebounceTimer = null;

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
      agentId: (memberProfile && memberProfile.agentId) ? memberProfile.agentId : "AGENT-001",
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
        agentId: "SUB-01",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sub01",
        spCount: 0,
        whipCount: 0,
        safeword: "MAYDAY",
        tags: ["輕度訓誡", "精煉繩縛"],
        limits: ["❌ 拒絕穿刺/見血"],
        sessions: []
      }
    ],
    activePartnerId: "partner_default_sub",
    friends: [],
    calendarEvents: []
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
      if (!trackerState.profile) trackerState.profile = createDefaultTrackerState().profile;
      if (!trackerState.friends) trackerState.friends = [];
      if (!trackerState.calendarEvents) trackerState.calendarEvents = [];
    } catch (e) {
      trackerState = createDefaultTrackerState();
    }
  } else {
    trackerState = createDefaultTrackerState();
    saveTrackerState(true);
  }
}

function saveTrackerState(skipCloud = false) {
  const key = getAgentStorageKey();
  if (key && trackerState) {
    localStorage.setItem(key, JSON.stringify(trackerState));
  }

  if (!skipCloud && memberProfile && (memberProfile.email || memberProfile.phone)) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      syncTrackerToCloud(true);
    }, 2000);
  }
}

// --------------------------------------------------------------------------
// 🔊 Web Audio API 音效與觸覺震動回饋引擎
// --------------------------------------------------------------------------
function playTerminalBeep(type = "click") {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "emergency") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (e) {}
}

// --------------------------------------------------------------------------
// ⚡ 全螢幕實踐計數終端
// --------------------------------------------------------------------------
function renderTrackerApp() {
  const activePartner = getActivePartner();
  const nameDisplay = document.getElementById("activePartnerNameDisplay");
  const spVal = document.getElementById("spCountVal");
  const whipVal = document.getElementById("whipCountVal");

  const isDom = trackerState.currentMode === "dom";
  const btnDom = document.getElementById("btnModeDom");
  const btnSub = document.getElementById("btnModeSub");
  if (btnDom) btnDom.classList.toggle("active", isDom);
  if (btnSub) btnSub.classList.toggle("active", !isDom);

  if (activePartner) {
    if (nameDisplay) nameDisplay.textContent = `[ 當前對象：${activePartner.name} (ID: ${activePartner.agentId || 'N/A'}) ]`;
    if (spVal) spVal.textContent = activePartner.spCount || 0;
    if (whipVal) whipVal.textContent = activePartner.whipCount || 0;
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

  playTerminalBeep("click");
  if (navigator.vibrate) {
    delta > 0 ? navigator.vibrate(40) : navigator.vibrate([20, 50, 20]);
  }

  if (type === "SP") {
    activePartner.spCount = Math.max(0, (activePartner.spCount || 0) + delta);
    const spEl = document.getElementById("spCountVal");
    if (spEl) spEl.textContent = activePartner.spCount;
  } else if (type === "WHIP") {
    activePartner.whipCount = Math.max(0, (activePartner.whipCount || 0) + delta);
    const whipEl = document.getElementById("whipCountVal");
    if (whipEl) whipEl.textContent = activePartner.whipCount;
  }

  saveTrackerState();
}

function renderSessionHUD() {
  const container = document.getElementById("sessionHudArea");
  if (!container) return;

  if (isSessionActive) {
    container.innerHTML = `
      <div style="background:#141416; border:2px solid var(--accent-cyan); padding:20px; border-radius:6px; text-align:center; position:fixed; inset:0; z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(8,8,10,0.98);">
        <div style="font-size:0.9rem; color:var(--accent-cyan); letter-spacing:2px; margin-bottom:10px;">⚡ [ PROTOCOL // 實踐階段全螢幕進行中 ] ⚡</div>
        <div id="sessionTimerDisplay" style="font-size:4rem; font-weight:900; color:var(--accent-cyan); font-family:monospace; margin:20px 0;">00:00</div>
        
        <div style="display:flex; gap:16px; width:100%; max-width:400px; margin-top:20px;">
          <button class="btn-submit" onclick="finishSessionPrompt()" style="flex:1; padding:18px; font-size:1rem; background:var(--accent-purple);">
            ■ 結束並結案
          </button>
          <button class="safeword-panic-btn" onclick="triggerEmergencySafeword()" style="flex:1; padding:18px; font-size:1rem; justify-content:center;">
            🛑 終極急停
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#000; border:1px dashed var(--panel-border); padding:12px 16px; border-radius:4px; margin-bottom:14px;">
        <div>
          <div style="font-size:0.8rem; font-weight:bold; color:#fff;">[ PROTOCOL SESSION // 實踐階段計時 ]</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">點擊啟動進入全螢幕沉浸式計時模式</div>
        </div>
        <button class="btn-submit" onclick="startSession()" style="width:auto; padding:10px 20px; font-size:0.85rem;">
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
  playTerminalBeep("click");

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

  const note = prompt("請輸入本次實踐結案筆記：", "實踐順利完成，雙方意識清醒。");
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
  renderTrackerApp();
  alert(`✔ 本次實踐已封存！\n總時長：${durationText}`);
}

// --------------------------------------------------------------------------
// 🚨 安全詞急停防護
// --------------------------------------------------------------------------
function triggerEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  const displayWord = document.getElementById("emergencySafewordDisplay");
  if (!modal) return;

  playTerminalBeep("emergency");
  if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 800]);

  const activePartner = getActivePartner();
  const word = (activePartner && activePartner.safeword) ? activePartner.safeword : "MAYDAY";
  if (displayWord) displayWord.textContent = word.toUpperCase();

  if (isSessionActive) {
    clearInterval(currentSessionTimer);
    isSessionActive = false;
    if (activePartner) {
      if (!activePartner.sessions) activePartner.sessions = [];
      activePartner.sessions.unshift({
        sessionId: "EMG-" + Date.now().toString().slice(-6),
        date: new Date().toLocaleString("zh-TW", { hour12: false }),
        duration: "中斷",
        spCount: activePartner.spCount || 0,
        whipCount: activePartner.whipCount || 0,
        note: "⚠️ 觸發安全詞急停協議中斷實踐。"
      });
      saveTrackerState();
    }
  }

  modal.classList.add("active");
  renderTrackerApp();
}

function dismissEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  if (modal) modal.classList.remove("active");
  if (navigator.vibrate) navigator.vibrate(0);
}

// --------------------------------------------------------------------------
// 👤 特工個人檔案與 QR Code 名片
// --------------------------------------------------------------------------
function renderProfileDossier() {
  const prof = trackerState.profile;

  const avatarPreview = document.getElementById("dossierAvatarPreview");
  const nameDisplay = document.getElementById("dossierNameDisplay");
  const roleBadge = document.getElementById("dossierRoleBadge");
  const bioDisplay = document.getElementById("dossierBioDisplay");
  const twLink = document.getElementById("dossierTwitterLink");

  if (avatarPreview) avatarPreview.src = prof.avatar;
  if (nameDisplay) nameDisplay.textContent = `${prof.name} [ID: ${prof.agentId || 'N/A'}]`;
  if (roleBadge) roleBadge.textContent = prof.role;
  if (bioDisplay) bioDisplay.textContent = prof.bio || "尚未填寫特工簡介。";

  if (twLink) {
    if (prof.twitter) {
      twLink.href = prof.twitter;
      twLink.style.display = "inline-block";
    } else {
      twLink.style.display = "none";
    }
  }

  const editName = document.getElementById("profEditName");
  const editAgentId = document.getElementById("profEditAgentId");
  const editRole = document.getElementById("profEditRole");
  const editTw = document.getElementById("profEditTwitter");
  const editSafe = document.getElementById("profEditSafeword");
  const editBio = document.getElementById("profEditBio");
  const editAvatar = document.getElementById("profEditAvatar");

  if (editName) editName.value = prof.name;
  if (editAgentId) editAgentId.value = prof.agentId || "";
  if (editRole) editRole.value = prof.role;
  if (editTw) editTw.value = prof.twitter || "";
  if (editSafe) editSafe.value = prof.safeword || "";
  if (editBio) editBio.value = prof.bio || "";
  if (editAvatar) editAvatar.value = prof.avatar || "";

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
    if (prof.selectedTags.includes(tag)) prof.selectedTags = prof.selectedTags.filter(t => t !== tag);
    else prof.selectedTags.push(tag);
  } else {
    if (prof.limits.includes(tag)) prof.limits = prof.limits.filter(t => t !== tag);
    else prof.limits.push(tag);
  }
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
    agentId: prof.agentId,
    role: prof.role,
    avatar: prof.avatar,
    safeword: prof.safeword,
    tags: prof.selectedTags,
    limits: prof.limits
  };

  const encodedStr = "GUILTY:" + encodeURIComponent(JSON.stringify(qrPayload));
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(encodedStr)}&bgcolor=08080a&color=00ff88&margin=4`;

  qrContainer.innerHTML = `<img src="${qrApiUrl}" crossorigin="anonymous" style="width:160px; height:160px; border:1px solid var(--accent-cyan); padding:4px; background:#000;" />`;
}

function handleSaveProfileForm(e) {
  e.preventDefault();
  const prof = trackerState.profile;

  prof.name = document.getElementById("profEditName").value.trim();
  const agentIdInput = document.getElementById("profEditAgentId");
  if (agentIdInput) prof.agentId = agentIdInput.value.trim().toUpperCase();
  prof.role = document.getElementById("profEditRole").value;
  prof.twitter = document.getElementById("profEditTwitter").value.trim();
  prof.safeword = document.getElementById("profEditSafeword").value.trim();
  prof.bio = document.getElementById("profEditBio").value.trim();

  const customAvatarUrl = document.getElementById("profEditAvatar").value.trim();
  if (customAvatarUrl) prof.avatar = customAvatarUrl;

  saveTrackerState();
  renderProfileDossier();
  alert("✔ 特工檔案已成功更新！");
}

// --------------------------------------------------------------------------
// ☁️ 雲端同步機制
// --------------------------------------------------------------------------
function syncTrackerToCloud(silent = false) {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) return;

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
    if (!silent) alert("✔ 終端實踐數據已成功同步至 TrackerDB 雲端！");
  }).catch(() => {});
}

function restoreTrackerFromCloud() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) return;

  const account = memberProfile.email || memberProfile.phone;
  const cbName = "trackerCb_" + Date.now();

  window[cbName] = function(res) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    if (res && res.result === "success" && res.data) {
      try {
        const cloudState = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        if (cloudState && cloudState.profile) {
          trackerState = cloudState;
          saveTrackerState(true);
          renderTrackerApp();
        }
      } catch (e) {}
    }
  };

  const script = document.createElement("script");
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=getTrackerState&account=${encodeURIComponent(account)}&callback=${cbName}&_t=${Date.now()}`;
  document.body.appendChild(script);
}

// --------------------------------------------------------------------------
// 📷 長圖匯出
// --------------------------------------------------------------------------
function exportDossierToImage() {
  const target = document.getElementById("dossierExportTarget");
  const btn = document.getElementById("btnExportCard");
  if (!target || typeof html2canvas === "undefined") return;

  if (btn) { btn.disabled = true; btn.textContent = "繪製中..."; }
  target.classList.add("exporting-mode");

  html2canvas(target, { backgroundColor: "#08080a", scale: 2, useCORS: true, allowTaint: false }).then(canvas => {
    target.classList.remove("exporting-mode");
    if (btn) { btn.disabled = false; btn.textContent = "📷 匯出名片圖"; }
    const link = document.createElement("a");
    link.download = `GUILTY_${trackerState.profile.agentId || 'AGENT'}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }).catch(() => {
    target.classList.remove("exporting-mode");
    if (btn) { btn.disabled = false; btn.textContent = "📷 匯出名片圖"; }
    alert("長圖生成失敗！");
  });
}

loadAgentTrackerState();
