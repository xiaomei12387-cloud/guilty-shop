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
  const agentId = (memberProfile && memberProfile.agentId) ? memberProfile.agentId : "AGENT-001";
  const agentRole = (memberProfile && memberProfile.role) ? memberProfile.role : "支配者 (Dom)";
  
  return {
    currentMode: "dom",
    profile: {
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(agentName),
      name: agentName,
      agentId: agentId,
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
      if (!trackerState.profile.allPreferences) trackerState.profile.allPreferences = [...DEFAULT_PRESET_TAGS.preferences];
      if (!trackerState.profile.allLimits) trackerState.profile.allLimits = [...DEFAULT_PRESET_TAGS.hardLimits];
      if (!trackerState.partners) trackerState.partners = [];
      if (!trackerState.friends) trackerState.friends = [];
      if (!trackerState.calendarEvents) trackerState.calendarEvents = [];
      trackerState.partners.forEach(p => {
        if (!p.sessions) p.sessions = [];
      });
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
// 2. 視圖存取權限與入口
// --------------------------------------------------------------------------
function checkAgentAuth() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    alert("⚠️ [ 權限拒絕 // ACCESS DENIED ]\n此終端為特工專屬管制區，請先完成神經認證登入！");
    if (typeof toggleAuthModal === "function") toggleAuthModal(true);
    return false;
  }
  return true;
}

function openTrackerAppView() {
  if (!checkAgentAuth()) return;
  if (typeof toggleNav === "function") toggleNav(false);
  if (typeof setActiveView === "function") setActiveView('view-tracker');
  renderTrackerApp();
  history.pushState({ view: 'tracker' }, '', '#tracker');
}

function openProfileDossierView() {
  if (!checkAgentAuth()) return;
  if (typeof toggleNav === "function") toggleNav(false);
  if (typeof setActiveView === "function") setActiveView('view-dossier');
  renderProfileDossier();
  history.pushState({ view: 'dossier' }, '', '#dossier');
}

// --------------------------------------------------------------------------
// 3. 🔊 Web Audio API 音效與觸覺震動回饋引擎
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
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (e) {}
}

// --------------------------------------------------------------------------
// 4. ⚡ 實踐計數終端常態邏輯
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

  const isDom = trackerState.currentMode === "dom";
  const btnDom = document.getElementById("btnModeDom");
  const btnSub = document.getElementById("btnModeSub");
  if (btnDom) btnDom.classList.toggle("active", isDom);
  if (btnSub) btnSub.classList.toggle("active", !isDom);

  if (activePartner) {
    if (nameDisplay) nameDisplay.textContent = `[ 當前實踐對象：${activePartner.name} (ID: ${activePartner.agentId || 'N/A'}) ]`;
    if (spVal) spVal.textContent = activePartner.spCount || 0;
    if (whipVal) whipVal.textContent = activePartner.whipCount || 0;
  } else {
    if (nameDisplay) nameDisplay.textContent = "[ 尚未選定互動對象 ]";
    if (spVal) spVal.textContent = 0;
    if (whipVal) whipVal.textContent = 0;
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
    const fsSpEl = document.getElementById("fsSpVal");
    if (spEl) spEl.textContent = activePartner.spCount;
    if (fsSpEl) fsSpEl.textContent = activePartner.spCount;
  } else if (type === "WHIP") {
    activePartner.whipCount = Math.max(0, (activePartner.whipCount || 0) + delta);
    const whipEl = document.getElementById("whipCountVal");
    const fsWhipEl = document.getElementById("fsWhipVal");
    if (whipEl) whipEl.textContent = activePartner.whipCount;
    if (fsWhipEl) fsWhipEl.textContent = activePartner.whipCount;
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
// 5. ⚡ 極限全螢幕實踐 HUD 與超大盲按急停按鈕
// --------------------------------------------------------------------------
function renderSessionHUD() {
  const container = document.getElementById("sessionHudArea");
  if (!container) return;

  const activePartner = getActivePartner();

  if (isSessionActive) {
    // ✦ 真正滿版覆蓋全螢幕（含計數、碼錶與極大化急停按鈕）
    container.innerHTML = `
      <div id="fullScreenSessionOverlay" style="position:fixed; inset:0; z-index:999999; background:#050507; display:flex; flex-direction:column; justify-content:space-between; padding:16px 14px; box-sizing:border-box; overflow:hidden;">
        
        <!-- 頂部對象與安全詞宣告 -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted);">實踐對象</div>
            <div style="font-size:1.05rem; font-weight:900; color:#fff;">${activePartner ? activePartner.name : '未知'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem; color:var(--text-muted);">雙方安全詞</div>
            <div style="font-size:1.05rem; font-weight:900; color:var(--accent-cyan);">${(activePartner && activePartner.safeword) || 'MAYDAY'}</div>
          </div>
        </div>

        <!-- 中間：巨大時間碼錶 + 雙軌即時計數板 -->
        <div style="text-align:center; margin:auto 0;">
          <div style="font-size:0.8rem; letter-spacing:3px; color:var(--accent-cyan); font-family:monospace;">● SESSION RUNNING</div>
          <div id="sessionTimerDisplay" style="font-size:clamp(4.5rem, 18vw, 7rem); font-weight:900; color:var(--accent-cyan); font-family:monospace; line-height:1; margin:10px 0; text-shadow:0 0 35px var(--glow-cyan);">
            00:00
          </div>

          <!-- 全螢幕內的即時大按鈕計數器 -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px;">
            <div style="background:#101015; border:1px solid var(--accent-cyan); border-radius:6px; padding:14px 10px;" onclick="adjustCounter('SP', 1)">
              <div style="font-size:0.75rem; color:var(--text-muted);">SP 次數 (點擊+1)</div>
              <div id="fsSpVal" style="font-size:2.8rem; font-weight:900; color:var(--accent-cyan); font-family:monospace;">${(activePartner && activePartner.spCount) || 0}</div>
            </div>
            <div style="background:#101015; border:1px solid var(--accent-purple); border-radius:6px; padding:14px 10px;" onclick="adjustCounter('WHIP', 1)">
              <div style="font-size:0.75rem; color:var(--text-muted);">長鞭擊數 (點擊+1)</div>
              <div id="fsWhipVal" style="font-size:2.8rem; font-weight:900; color:var(--accent-purple); font-family:monospace;">${(activePartner && activePartner.whipCount) || 0}</div>
            </div>
          </div>
        </div>

        <!-- 底部：超大盲按急停區（佔據螢幕下半部絕大部分） -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <!-- 🛑 盲按專用巨型急停鈕：高度加厚、紅光頻閃、隨手一拍即停 -->
          <button onclick="triggerEmergencySafeword()" style="width:100%; min-height:100px; background:#e63946; border:3px solid #ff334b; border-radius:8px; color:#fff; font-size:clamp(1.4rem, 5vw, 2rem); font-weight:900; letter-spacing:2px; cursor:pointer; box-shadow:0 0 40px rgba(255, 51, 75, 0.7); display:flex; align-items:center; justify-content:center; gap:10px;">
            🛑 SAFEWORD 急停停止
          </button>
          
          <!-- 結案按鈕 -->
          <button onclick="finishSessionPrompt()" style="width:100%; padding:14px; background:#1c1c24; border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#a1a1aa; font-size:0.9rem; font-weight:bold; cursor:pointer;">
            ■ 正常結束並結案封存
          </button>
        </div>

      </div>
    `;
  } else {
    // 正常未開始狀態：醒目大按鈕
    container.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(20, 20, 26, 0.95), rgba(10, 10, 14, 0.98)); border:1px solid var(--panel-border); border-left:4px solid var(--accent-cyan); padding:16px 18px; border-radius:4px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; box-shadow:0 4px 20px rgba(0,0,0,0.5);">
        <div>
          <div style="font-size:0.85rem; font-weight:bold; color:#fff; letter-spacing:1px;">[ PROTOCOL SESSION // 實踐階段計時 ]</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">啟動後即刻進入全螢幕碼錶計時與雙方數值累計</div>
        </div>
        <button class="btn-submit" onclick="startSession()" style="width:auto; padding:14px 28px; font-size:0.95rem; font-weight:bold; letter-spacing:1px; box-shadow:0 0 20px var(--glow-cyan);">
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

  // 嘗試觸發系統級全螢幕 API
  try {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
    else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen().catch(() => {});
  } catch (e) {}

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

function exitNativeFullscreen() {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
    }
  } catch (e) {}
}

function finishSessionPrompt() {
  if (!isSessionActive) return;
  const activePartner = getActivePartner();
  if (!activePartner) return;

  const note = prompt("請輸入本次實踐結案筆記（如：心理狀態、安全詞觸發反饋、部位反應）：", "實踐順利完成，雙方意識清醒。");
  if (note === null) return;

  clearInterval(currentSessionTimer);
  isSessionActive = false;
  exitNativeFullscreen();

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
// 6. 🚨 安全詞急停防護 (Emergency Safeword Protocol)
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
    exitNativeFullscreen();
    if (activePartner) {
      if (!activePartner.sessions) activePartner.sessions = [];
      activePartner.sessions.unshift({
        sessionId: "EMG-" + Date.now().toString().slice(-6),
        date: new Date().toLocaleString("zh-TW", { hour12: false }),
        duration: "急停中斷",
        spCount: activePartner.spCount || 0,
        whipCount: activePartner.whipCount || 0,
        note: "⚠️ 觸發安全詞急停協議中斷實踐。"
      });
      saveTrackerState();
    }
  }

  modal.classList.add("active");
  renderSessionHUD();
  renderSessionLogs();
}

function dismissEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  if (modal) modal.classList.remove("active");
  if (navigator.vibrate) navigator.vibrate(0);
}

// --------------------------------------------------------------------------
// 7. 互動對象管理 (Partner Management)
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
            ID：<span style="color:#fff;">${p.agentId || 'N/A'}</span> ｜ 安全詞：<span style="color:var(--accent-cyan);">${p.safeword || '未設定'}</span>
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
  const agentId = prompt("請輸入對象的特工 ID (若無可留空)：", "SUB-" + Math.floor(Math.random()*900 + 100));
  const newId = "partner_" + Date.now();

  trackerState.partners.push({
    id: newId,
    name: name.trim(),
    role: (role && role.trim()) || "服從者 (Sub)",
    agentId: (agentId && agentId.trim().toUpperCase()) || "AGENT-X",
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
// 8. 相機掃描 QR Code 串接 (HTML5-QRCode)
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
      agentId: payload.agentId || "AGENT-X",
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
    alert(`✔ 成功同步對象特工名片：${payload.name} (ID: ${payload.agentId || 'N/A'})！`);
  } catch (err) {
    alert("❌ 解析失敗：QR Code 內容格式不相符。");
  }
}

// --------------------------------------------------------------------------
// 9. 👤 特工個人檔案與 QR Code 名片 (Profile & Dossier)
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

function addCustomTag(type) {
  const input = type === "pref" ? document.getElementById("newCustomPrefInput") : document.getElementById("newCustomLimitInput");
  if (!input) return;
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

function handleAvatarUpload(inputEl) {
  if (!inputEl.files || inputEl.files.length === 0) return;
  const file = inputEl.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    trackerState.profile.avatar = e.target.result;
    const avatarPreview = document.getElementById("dossierAvatarPreview");
    if (avatarPreview) avatarPreview.src = e.target.result;
    saveTrackerState();
    renderMyQrCode();
  };
  reader.readAsDataURL(file);
}

// --------------------------------------------------------------------------
// 10. ☁️ TrackerDB 雲端同步機制
// --------------------------------------------------------------------------
function syncTrackerToCloud(silent = false) {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) {
    if (!silent) alert("請先登入特工帳號以啟用雲端備份！");
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
    if (!silent) alert("✔ 終端實踐數據已成功同步至 TrackerDB 雲端！");
  }).catch(() => {
    if (!silent) alert("雲端同步失敗，請檢查網路狀態。");
  });
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
// 11. 📷 特工名片長圖匯出 (html2canvas)
// --------------------------------------------------------------------------
function exportDossierToImage() {
  const target = document.getElementById("dossierExportTarget");
  const btn = document.getElementById("btnExportCard");
  if (!target || typeof html2canvas === "undefined") return;

  if (btn) { btn.disabled = true; btn.textContent = "繪製中..."; }
  target.classList.add("exporting-mode");

  html2canvas(target, { 
    backgroundColor: "#08080a", 
    scale: 2, 
    useCORS: true, 
    allowTaint: false 
  }).then(canvas => {
    target.classList.remove("exporting-mode");
    if (btn) { btn.disabled = false; btn.textContent = "📷 匯出名片圖"; }
    const link = document.createElement("a");
    link.download = `GUILTY_${trackerState.profile.agentId || 'AGENT'}_${Date.now().toString().slice(-4)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }).catch(() => {
    target.classList.remove("exporting-mode");
    if (btn) { btn.disabled = false; btn.textContent = "📷 匯出名片圖"; }
    alert("長圖生成失敗，建議改用上傳本機圖片！");
  });
}

// 系統啟動初始化
loadAgentTrackerState();
