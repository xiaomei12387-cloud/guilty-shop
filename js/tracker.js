// ==========================================================================
// 🎮 GUILTY PROTOCOL // TRACKER & DOSSIER ENGINE (js/tracker.js)
// ==========================================================================

const PRESET_TAGS = {
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
    name: "特工 18X",
    role: "支配者 (Dom)",
    twitter: "https://x.com/18X_inthc",
    safeword: "MAYDAY (紅色停止 / 黃色減速)",
    selectedTags: ["重度SP", "神經突觸長鞭", "外骨骼拘束", "精煉繩縛"],
    limits: ["❌ 拒絕見血/穿刺", "❌ 拒絕窒息/壓迫前喉"]
  },
  partners: [
    {
      id: "partner-001",
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
  calendar: [
    {
      id: "cal-001",
      date: "2026-09-12",
      time: "20:00",
      partnerName: "服從者 No.07",
      location: "shushi束室 繩教室 / 私人實踐室",
      plan: "貓痕項圈調用測試 ＋ 10M 精煉麻繩五點懸吊"
    }
  ]
};

function saveTrackerState() {
  localStorage.setItem(CONFIG.STORAGE_KEYS.TRACKER, JSON.stringify(trackerState));
}

function switchTrackerMode(mode) {
  trackerState.currentMode = mode;
  saveTrackerState();
  renderTrackerApp();
}

function getActivePartner() {
  return trackerState.partners.find(p => p.id === trackerState.activePartnerId) || trackerState.partners[0];
}

function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(40);
  }
}

function adjustCounter(type, delta) {
  const partner = getActivePartner();
  if (!partner) {
    alert("請先於下方新增或選擇互動對象！");
    return;
  }

  triggerHaptic();

  if (type === "SP") {
    partner.spCount = Math.max(0, (partner.spCount || 0) + delta);
  } else if (type === "WHIP") {
    partner.whipCount = Math.max(0, (partner.whipCount || 0) + delta);
  }

  saveTrackerState();
  renderCounterDisplay();
}

function resetCounter(type) {
  const partner = getActivePartner();
  if (!partner) return;

  if (confirm(`確定要歸零特工 [${partner.name}] 的 ${type === "SP" ? "SP" : "鞭刑"} 計數嗎？`)) {
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
    name: name.trim(),
    role: role ? role.trim() : "服從者 (Sub)",
    twitter: twitter ? twitter.trim() : "",
    isPinned: false,
    spCount: 0,
    whipCount: 0,
    spTarget: 50,
    whipTarget: 20,
    notes: "",
    history: []
  };

  trackerState.partners.push(newPartner);
  trackerState.activePartnerId = newPartner.id;
  saveTrackerState();
  renderTrackerApp();
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

function generateMyQrCode() {
  const qrContainer = document.getElementById("myQrCodeBox");
  if (!qrContainer) return;

  const exportPayload = {
    app: "GUILTY_PROTOCOL",
    ver: "1.0",
    name: trackerState.profile.name,
    role: trackerState.profile.role,
    twitter: trackerState.profile.twitter,
    safeword: trackerState.profile.safeword,
    tags: trackerState.profile.selectedTags,
    limits: trackerState.profile.limits
  };

  const rawJson = JSON.stringify(exportPayload);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(rawJson)}&color=00ff88&bgcolor=08080a`;
  qrContainer.innerHTML = `<img src="${qrUrl}" alt="Agent Pass QR" style="width:170px; height:170px; border-radius:4px;" />`;
}

function importPartnerFromPayload(rawString) {
  try {
    const data = JSON.parse(rawString);
    if (!data.name || !data.app) {
      alert("❌ 無效的特工身份識別碼格式！");
      return;
    }

    const exists = trackerState.partners.some(p => p.name === data.name);
    if (exists) {
      alert(`特工 [${data.name}] 已存在於您的互動對象清單中！`);
      return;
    }

    const newPartner = {
      id: "partner-" + Date.now().toString().slice(-6),
      name: data.name,
      role: data.role || "服從者 (Sub)",
      twitter: data.twitter || "",
      isPinned: true,
      spCount: 0,
      whipCount: 0,
      spTarget: 50,
      whipTarget: 20,
      notes: `【安全詞】${data.safeword || "未設定"}\n【偏好】${(data.tags || []).join(", ")}\n【雷點】${(data.limits || []).join(", ")}`,
      history: []
    };

    trackerState.partners.unshift(newPartner);
    trackerState.activePartnerId = newPartner.id;
    saveTrackerState();
    renderTrackerApp();

    alert(`✔ 成功連線！已將特工 [${data.name}] (${data.role}) 匯入並置頂至您的互動清單！`);
  } catch (err) {
    alert("❌ 解析失敗，請確認代碼無誤！");
  }
}

function promptScanOrPaste() {
  const input = prompt("請貼上對方的【特工神經代碼 / 掃碼字串】：");
  if (input && input.trim()) {
    importPartnerFromPayload(input.trim());
  }
}

function addCalendarEventPrompt() {
  const date = prompt("請選擇預約實踐日期（格式：YYYY-MM-DD）：", new Date().toISOString().split('T')[0]);
  if (!date) return;
  const time = prompt("請輸入預計時間（例如：20:00）：", "20:00");
  const loc = prompt("請輸入接頭地點／實踐空間：", "shushi束室 繩教室 / 私人實踐空間");
  const plan = prompt("請輸入本次實踐預計調用裝備／實踐項目：", "貓痕項圈調用 ＋ 戰術長鞭神經校準");

  const newEvent = {
    id: "cal-" + Date.now().toString().slice(-6),
    date: date,
    time: time || "20:00",
    partnerName: getActivePartner() ? getActivePartner().name : "指定特工",
    location: loc || "地下拘束實驗室",
    plan: plan || "常規實踐"
  };

  trackerState.calendar.unshift(newEvent);
  saveTrackerState();
  renderCalendarList();
}

function removeCalendarEvent(eventId) {
  trackerState.calendar = trackerState.calendar.filter(c => c.id !== eventId);
  saveTrackerState();
  renderCalendarList();
}

function renderTrackerApp() {
  renderPartnerList();
  renderCounterDisplay();
  renderProfileTags();
  renderCalendarList();
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
          <div>
            <strong style="font-size:0.95rem; color:#fff;">${p.name}</strong>
            <span class="partner-role-badge">${p.role}</span>
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

  prefBox.innerHTML = PRESET_TAGS.preferences.map(tag => {
    const isSelected = prof.selectedTags.includes(tag);
    return `<button class="matrix-tag-btn ${isSelected ? 'active' : ''}" onclick="toggleTag('pref', '${tag}')">${tag}</button>`;
  }).join('');

  limitBox.innerHTML = PRESET_TAGS.hardLimits.map(tag => {
    const isSelected = prof.limits.includes(tag);
    return `<button class="matrix-tag-btn limit ${isSelected ? 'active' : ''}" onclick="toggleTag('limit', '${tag}')">${tag}</button>`;
  }).join('');
}

function renderCalendarList() {
  const calEl = document.getElementById("calendarEventsList");
  if (!calEl) return;

  if (trackerState.calendar.length === 0) {
    calEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:20px 0;">尚無約定實踐行程，點擊上方按鈕即可排程。</div>`;
    return;
  }

  calEl.innerHTML = trackerState.calendar.map(c => `
    <div class="calendar-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span style="color:var(--accent-cyan); font-weight:bold; font-size:0.95rem;">📅 ${c.date} ｜ ${c.time}</span>
          <div style="color:#fff; font-size:0.85rem; margin-top:2px;">對象：<strong>${c.partnerName}</strong></div>
        </div>
        <button onclick="removeCalendarEvent('${c.id}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.8rem;">✕ 刪除</button>
      </div>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">📍 地點：${c.location}</div>
      <div style="font-size:0.8rem; color:#d4d4d8; margin-top:4px; background:rgba(0,0,0,0.4); padding:6px 8px; border-radius:3px;">
        📝 實踐內容：${c.plan}
      </div>
    </div>
  `).join('');
}