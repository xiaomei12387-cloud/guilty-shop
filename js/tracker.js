// ==========================================================================
// 🎮 GUILTY PROTOCOL // TRACKER, FRIENDS, CALENDAR & ANALYTICS (js/tracker.js)
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
let analyticsChartInstance = null;

function getAgentStorageKey() {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) return null;
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
    friends: [
      {
        id: "friend_sample",
        name: "KK",
        agentId: "KK-ROPE",
        role: "支配者 (Dom)",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=KK",
        bio: "束室繩縛主理人，專精日式麻繩工藝與神經支配調教。",
        tags: ["精煉繩縛", "高空懸吊", "感官剝奪"],
        limits: ["❌ 拒絕生繩", "❌ 拒絕穿刺/見血"]
      }
    ],
    calendarEvents: [
      {
        id: "cal_1",
        title: "水湳線下交流聚會",
        date: "2026-09-26",
        startTime: "14:00",
        endTime: "18:00",
        privacy: "friends"
      }
    ]
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
      if (!trackerState.partners) trackerState.partners = [];
      if (!trackerState.friends) trackerState.friends = createDefaultTrackerState().friends;
      if (!trackerState.calendarEvents) trackerState.calendarEvents = createDefaultTrackerState().calendarEvents;
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
// 🔊 音效與震動
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
// ⚡ 實踐終端主介面渲染
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
  }

  renderPartnerList();
  renderSessionHUD();
  renderSessionLogs();
  renderAnalyticsChart();
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
// ⚡ 實踐入口 HUD（跳轉獨立全螢幕終端）
// --------------------------------------------------------------------------
function renderSessionHUD() {
  const container = document.getElementById("sessionHudArea");
  if (!container) return;

  container.innerHTML = `
    <div style="background:linear-gradient(135deg, rgba(20, 20, 26, 0.95), rgba(10, 10, 14, 0.98)); border:1px solid var(--panel-border); border-left:4px solid var(--accent-cyan); padding:16px 18px; border-radius:4px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="font-size:0.85rem; font-weight:bold; color:#fff; letter-spacing:1px;">[ PROTOCOL SESSION // 全螢幕沉浸實踐 ]</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">啟動專屬全螢幕視窗：極大化碼錶、整塊觸控計數與盲按急停</div>
      </div>
      <button class="btn-submit" onclick="startSession()" style="width:auto; padding:14px 28px; font-size:0.95rem; font-weight:bold;">
        ▶ 開啟獨立全螢幕實踐終端
      </button>
    </div>
  `;
}

function startSession() {
  const activePartner = getActivePartner();
  if (!activePartner) {
    alert("請先選擇或新增一個互動對象！");
    return;
  }
  window.location.href = "session.html";
}

function triggerEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  if (!modal) return;

  playTerminalBeep("emergency");
  if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 800]);

  const activePartner = getActivePartner();
  const word = (activePartner && activePartner.safeword) ? activePartner.safeword : "MAYDAY";
  const d = document.getElementById("emergencySafewordDisplay");
  if (d) d.textContent = word.toUpperCase();

  modal.classList.add("active");
  renderSessionHUD();
  renderSessionLogs();
  renderAnalyticsChart();
}

function dismissEmergencySafeword() {
  const modal = document.getElementById("safewordEmergencyModal");
  if (modal) modal.classList.remove("active");
  if (navigator.vibrate) navigator.vibrate(0);
}

// --------------------------------------------------------------------------
// 📊 歷程圖表化分析引擎 (Chart.js)
// --------------------------------------------------------------------------
function renderAnalyticsChart() {
  const canvas = document.getElementById("sessionAnalyticsChart");
  if (!canvas || typeof Chart === "undefined") return;

  const activePartner = getActivePartner();
  const sessions = (activePartner && activePartner.sessions) ? [...activePartner.sessions].reverse().slice(-7) : [];

  const labels = sessions.length > 0 ? sessions.map(s => s.date.slice(5) || s.date) : ["記錄一", "記錄二", "記錄三", "記錄四"];
  const spData = sessions.length > 0 ? sessions.map(s => s.spCount) : [0, 0, 0, 0];
  const whipData = sessions.length > 0 ? sessions.map(s => s.whipCount) : [0, 0, 0, 0];

  if (analyticsChartInstance) analyticsChartInstance.destroy();

  const ctx = canvas.getContext("2d");
  analyticsChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "SP 次數",
          data: spData,
          borderColor: "#00ff88",
          backgroundColor: "rgba(0, 255, 136, 0.15)",
          tension: 0.3,
          fill: true
        },
        {
          label: "長鞭擊數",
          data: whipData,
          borderColor: "#b5179e",
          backgroundColor: "rgba(181, 23, 158, 0.15)",
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#d4d4d8", font: { size: 11 } } }
      },
      scales: {
        x: { ticks: { color: "#71717a" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#71717a" }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    }
  });
}

function renderSessionLogs() {
  const listContainer = document.getElementById("sessionLogsContainer");
  if (!listContainer) return;
  const activePartner = getActivePartner();
  if (!activePartner || !activePartner.sessions || activePartner.sessions.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:15px 0;">[ 尚無實踐歷程 ]</div>`;
    return;
  }
  listContainer.innerHTML = activePartner.sessions.map(s => `
    <div style="background:#0c0c0e; border:1px solid var(--panel-border); border-left:3px solid var(--accent-cyan); padding:10px; margin-bottom:8px; border-radius:2px; font-size:0.75rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="color:var(--accent-cyan); font-weight:bold;">#${s.sessionId} [${s.duration}]</span>
        <button onclick="deleteSessionLog('${s.sessionId}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">✕</button>
      </div>
      <div style="color:var(--text-muted); font-size:0.7rem; margin-bottom:4px;">${s.date} ｜ SP: ${s.spCount} ｜ 鞭: ${s.whipCount}</div>
      <div style="color:#d4d4d8; background:#141416; padding:6px;">💬 ${s.note}</div>
    </div>
  `).join('');
}

function deleteSessionLog(sessionId) {
  const activePartner = getActivePartner();
  if (!activePartner || !activePartner.sessions) return;
  if (!confirm("確定銷毀該紀錄？")) return;
  activePartner.sessions = activePartner.sessions.filter(s => s.sessionId !== sessionId);
  saveTrackerState();
  renderTrackerApp();
}

function renderPartnerList() {
  const container = document.getElementById("trackerPartnerList");
  if (!container) return;
  if (trackerState.partners.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:16px 0;">尚無對象，請新增</div>`;
    return;
  }
  container.innerHTML = trackerState.partners.map(p => `
    <div class="partner-card ${p.id === trackerState.activePartnerId ? 'active' : ''}" onclick="selectActivePartner('${p.id}')">
      <img src="${p.avatar}" class="partner-avatar" />
      <div style="flex:1;">
        <strong style="color:#fff; font-size:0.85rem;">${p.name}</strong>
        <span class="partner-role-badge">${p.role}</span>
        <div style="font-size:0.7rem; color:var(--text-muted);">ID: ${p.agentId || 'N/A'} ｜ 安全詞: ${p.safeword}</div>
      </div>
      <button onclick="deletePartner('${p.id}'); event.stopPropagation();" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">✕</button>
    </div>
  `).join('');
}

function selectActivePartner(id) {
  trackerState.activePartnerId = id;
  saveTrackerState();
  renderTrackerApp();
}

function deletePartner(id) {
  if (!confirm("移除此互動對象？")) return;
  trackerState.partners = trackerState.partners.filter(p => p.id !== id);
  if (trackerState.activePartnerId === id) trackerState.activePartnerId = trackerState.partners[0] ? trackerState.partners[0].id : null;
  saveTrackerState();
  renderTrackerApp();
}

function addNewPartnerPrompt() {
  const name = prompt("對象代號：");
  if (!name) return;
  const role = prompt("陣營屬性：", "服從者 (Sub)");
  const agentId = prompt("特工 ID：", "SUB-" + Math.floor(Math.random()*900 + 100));
  const newId = "partner_" + Date.now();
  trackerState.partners.push({
    id: newId,
    name: name.trim(),
    role: role || "服從者 (Sub)",
    agentId: (agentId && agentId.toUpperCase()) || "SUB-X",
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    spCount: 0,
    whipCount: 0,
    safeword: "MAYDAY",
    sessions: []
  });
  trackerState.activePartnerId = newId;
  saveTrackerState();
  renderTrackerApp();
}

// --------------------------------------------------------------------------
// 👥 好友名冊與查看對方檔案 (不能聊天)
// --------------------------------------------------------------------------
function renderFriendsList() {
  const container = document.getElementById("friendsListContainer");
  if (!container) return;

  if (!trackerState.friends || trackerState.friends.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:20px 0;">尚無好友，點擊右上角輸入 ID 新增</div>`;
    return;
  }

  container.innerHTML = trackerState.friends.map(f => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#101015; border:1px solid var(--panel-border); padding:10px 14px; border-radius:4px; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="viewFriendProfile('${f.id}')">
        <img src="${f.avatar}" style="width:38px; height:38px; border-radius:50%; border:1px solid var(--accent-cyan);" />
        <div>
          <strong style="color:#fff; font-size:0.85rem;">${f.name}</strong>
          <span class="partner-role-badge">${f.role}</span>
          <div style="font-size:0.7rem; color:var(--text-muted);">ID: ${f.agentId} (點擊檢視檔案)</div>
        </div>
      </div>
      <div style="display:flex; gap:6px;">
        <button onclick="viewFriendProfile('${f.id}')" style="background:transparent; border:1px solid var(--accent-cyan); color:var(--accent-cyan); font-size:0.7rem; padding:4px 8px; cursor:pointer;">查看檔案</button>
        <button onclick="removeFriend('${f.id}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">✕</button>
      </div>
    </div>
  `).join('');
}

function addFriendByIdPrompt() {
  const friendId = prompt("請輸入對方的專屬特工 ID (例如：AGENT-001 或 KK-ROPE)：");
  if (!friendId || !friendId.trim()) return;

  const cleanId = friendId.trim().toUpperCase();
  const existing = trackerState.friends.find(f => f.agentId === cleanId);
  if (existing) {
    alert("該特工已在您的好友名冊中！");
    return;
  }

  const newFriend = {
    id: "friend_" + Date.now(),
    name: "特工・" + cleanId.slice(-4),
    agentId: cleanId,
    role: "未知屬性",
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanId}`,
    bio: "此特工透過專屬 ID 建立神經連結。",
    tags: ["實踐調教", "繩藝拘束"],
    limits: ["❌ 拒絕穿刺/見血"]
  };

  trackerState.friends.push(newFriend);
  saveTrackerState();
  renderFriendsList();
  alert(`✔ 成功將特工 (ID: ${cleanId}) 加入好友名冊！`);
}

function viewFriendProfile(friendId) {
  const friend = trackerState.friends.find(f => f.id === friendId);
  if (!friend) return;

  document.getElementById("fpAvatar").src = friend.avatar;
  document.getElementById("fpName").textContent = friend.name;
  document.getElementById("fpRole").textContent = friend.role;
  document.getElementById("fpId").textContent = `ID: ${friend.agentId}`;
  document.getElementById("fpBio").textContent = friend.bio || "尚未填寫宣言。";

  document.getElementById("fpPrefs").innerHTML = (friend.tags || []).map(t => `<div class="tag-pill active">${t}</div>`).join('');
  document.getElementById("fpLimits").innerHTML = (friend.limits || []).map(l => `<div class="tag-pill active-limit">${l}</div>`).join('');

  document.getElementById("friendProfileModal").classList.add("active");
}

function closeFriendProfileModal() {
  document.getElementById("friendProfileModal").classList.remove("active");
}

function removeFriend(friendId) {
  if (!confirm("確定要從好友名冊中移除此特工？")) return;
  trackerState.friends = trackerState.friends.filter(f => f.id !== friendId);
  saveTrackerState();
  renderFriendsList();
}

// --------------------------------------------------------------------------
// 📅 個人行事曆排程系統
// --------------------------------------------------------------------------
function toggleCalendarForm(show) {
  const box = document.getElementById("calendarAddBox");
  if (box) box.style.display = show ? "block" : "none";
}

function saveCalendarEvent() {
  const title = document.getElementById("calEventTitle").value.trim();
  const date = document.getElementById("calEventDate").value;
  const start = document.getElementById("calEventStart").value;
  const end = document.getElementById("calEventEnd").value;
  const privacy = document.getElementById("calEventPrivacy").value;

  if (!title || !date) {
    alert("請完整輸入活動名稱與日期！");
    return;
  }

  trackerState.calendarEvents.push({
    id: "cal_" + Date.now(),
    title,
    date,
    startTime: start,
    endTime: end,
    privacy
  });

  saveTrackerState();
  toggleCalendarForm(false);
  renderCalendarEvents();
  alert("✔ 日程已成功排定並同步！");
}

function renderCalendarEvents() {
  const container = document.getElementById("calendarEventsListContainer");
  if (!container) return;

  if (!trackerState.calendarEvents || trackerState.calendarEvents.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:20px 0;">尚無排定日程，點擊右上角發布活動</div>`;
    return;
  }

  container.innerHTML = trackerState.calendarEvents.map(e => `
    <div style="background:#0a0a0d; border:1px solid var(--panel-border); border-left:3px solid var(--accent-cyan); padding:10px 14px; border-radius:3px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="color:#fff; font-size:0.88rem; font-weight:bold;">${e.title}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
          📅 ${e.date} (${e.startTime} - ${e.endTime}) ｜ <span style="color:var(--accent-cyan);">[ ${e.privacy === 'friends' ? '好友可見' : '私密'} ]</span>
        </div>
      </div>
      <button onclick="deleteCalendarEvent('${e.id}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">✕</button>
    </div>
  `).join('');
}

function deleteCalendarEvent(id) {
  if (!confirm("確定刪除此日程？")) return;
  trackerState.calendarEvents = trackerState.calendarEvents.filter(e => e.id !== id);
  saveTrackerState();
  renderCalendarEvents();
}

// --------------------------------------------------------------------------
// ⚙️ 創作者後台自動免密綁定與商品自主修改
// --------------------------------------------------------------------------
function initCreatorPortal() {
  const statusBox = document.getElementById("creatorAuthStatusBox");
  const dashBox = document.getElementById("creatorDashboardBox");
  const myProductsBox = document.getElementById("creatorProductsListContainer");
  if (!statusBox) return;

  if (memberProfile && (memberProfile.email || memberProfile.phone)) {
    statusBox.innerHTML = `
      <div style="color:var(--accent-cyan); font-weight:bold;">🟢 特工帳號已神經連線：${memberProfile.name} [ID: ${memberProfile.agentId || 'CREATOR'}]</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">已直接解鎖創作者後台，免重複輸入推廣碼與電話。</div>
    `;
    if (dashBox) dashBox.style.display = "block";
    document.getElementById("creatorNameText").textContent = `${memberProfile.name} (創作者)`;
    document.getElementById("creatorOrderCount").textContent = "3 件";
    document.getElementById("creatorRewardTotal").textContent = "NT$ 720";
  } else {
    statusBox.innerHTML = `<span style="color:var(--danger-red);">⚠️ 尚未登入特工帳號，請先登入以檢索創作者分潤與商品管理。</span>`;
    if (dashBox) dashBox.style.display = "none";
  }

  if (myProductsBox && typeof PRODUCTS !== "undefined") {
    myProductsBox.innerHTML = PRODUCTS.map(p => `
      <div style="background:#0e0e12; border:1px solid var(--panel-border); padding:10px 14px; border-radius:4px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:#fff; font-size:0.85rem;">${p.title}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">當前售價：NT$ <span id="disp_price_${p.id}">${p.price}</span></div>
        </div>
        <div style="display:flex; gap:6px;">
          <button onclick="editProductPricePrompt('${p.id}')" style="background:#141416; border:1px solid var(--accent-purple); color:var(--accent-purple); font-size:0.75rem; padding:4px 8px; cursor:pointer;">修改價格</button>
        </div>
      </div>
    `).join('');
  }
}

function editProductPricePrompt(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  const newPrice = prompt(`請輸入「${p.title}」的新調用售價 (NT$)：`, p.price);
  if (!newPrice || isNaN(newPrice)) return;

  p.price = parseInt(newPrice);
  const disp = document.getElementById(`disp_price_${productId}`);
  if (disp) disp.textContent = p.price;
  alert(`✔ 商品「${p.title}」售價已更新為 NT$ ${p.price.toLocaleString()}！`);
}

// --------------------------------------------------------------------------
// 👤 特工名片渲染 (Dossier)
// --------------------------------------------------------------------------
function renderProfileDossier() {
  const prof = trackerState.profile;
  const ap = document.getElementById("dossierAvatarPreview");
  const nd = document.getElementById("dossierNameDisplay");
  const rb = document.getElementById("dossierRoleBadge");
  const bd = document.getElementById("dossierBioDisplay");
  if (ap) ap.src = prof.avatar;
  if (nd) nd.textContent = `${prof.name} [ID: ${prof.agentId || 'N/A'}]`;
  if (rb) rb.textContent = prof.role;
  if (bd) bd.textContent = prof.bio || "尚未填寫特工簡介。";

  renderDossierTags();
  renderMyQrCode();
}

function renderDossierTags() {
  const prof = trackerState.profile;
  const prefBox = document.getElementById("myPrefTagsBox");
  const limitBox = document.getElementById("myLimitTagsBox");
  if (prefBox) {
    prefBox.innerHTML = prof.allPreferences.map(t => `<div class="tag-pill ${prof.selectedTags.includes(t)?'active':''}" onclick="toggleTagSelection('pref','${t}')">${t}</div>`).join('');
  }
  if (limitBox) {
    limitBox.innerHTML = prof.allLimits.map(l => `<div class="tag-pill ${prof.limits.includes(l)?'active-limit':''}" onclick="toggleTagSelection('limit','${l}')">${l}</div>`).join('');
  }
}

function toggleTagSelection(type, tag) {
  const prof = trackerState.profile;
  if (type === "pref") {
    prof.selectedTags = prof.selectedTags.includes(tag) ? prof.selectedTags.filter(t => t !== tag) : [...prof.selectedTags, tag];
  } else {
    prof.limits = prof.limits.includes(tag) ? prof.limits.filter(t => t !== tag) : [...prof.limits, tag];
  }
  saveTrackerState();
  renderDossierTags();
  renderMyQrCode();
}

function renderMyQrCode() {
  const qrContainer = document.getElementById("myQrCodeBox");
  if (!qrContainer) return;
  const prof = trackerState.profile;
  const payload = {
    name: prof.name,
    agentId: prof.agentId,
    role: prof.role,
    avatar: prof.avatar,
    safeword: prof.safeword,
    tags: prof.selectedTags,
    limits: prof.limits
  };
  const str = "GUILTY:" + encodeURIComponent(JSON.stringify(payload));
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(str)}&bgcolor=08080a&color=00ff88&margin=4`;
  qrContainer.innerHTML = `<img src="${url}" crossorigin="anonymous" style="width:160px; height:160px; border:1px solid var(--accent-cyan); padding:4px; background:#000;" />`;
}

function exportDossierToImage() {
  const target = document.getElementById("dossierExportTarget");
  const btn = document.getElementById("btnExportCard");
  if (!target || typeof html2canvas === "undefined") return;

  if (btn) { btn.disabled = true; btn.textContent = "繪製中..."; }
  target.classList.add("exporting-mode");

  html2canvas(target, { backgroundColor: "#08080a", scale: 2, useCORS: true }).then(canvas => {
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

function syncTrackerToCloud(silent = false) {
  if (!memberProfile || (!memberProfile.email && !memberProfile.phone)) return;
  fetch(CONFIG.API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "syncTrackerState",
      email: memberProfile.email || "",
      phone: memberProfile.phone || "",
      trackerState: trackerState
    })
  }).then(() => {
    if (!silent) alert("✔ 數據已成功同步至雲端！");
  });
}

loadAgentTrackerState();
