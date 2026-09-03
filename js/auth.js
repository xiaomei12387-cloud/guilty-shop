// ==========================================================================
// 🛡️ GUILTY PROTOCOL // AGENT AUTH & NEURAL ACCESS MODULE (js/auth.js)
// ==========================================================================

let memberProfile = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MEMBER)) || null;

// --------------------------------------------------------------------------
// 1. 彈窗切換與介面更新 (UI Controls)
// --------------------------------------------------------------------------
function toggleAuthModal(isOpen) {
  const modal = document.getElementById("authModal");
  if (!modal) return;

  if (isOpen) {
    modal.classList.add("active");
    if (memberProfile) {
      const guestView = document.getElementById("authGuestView");
      const profView = document.getElementById("authProfileView");
      if (guestView) guestView.style.display = "none";
      if (profView) profView.style.display = "block";
      populateProfileView();
    } else {
      const guestView = document.getElementById("authGuestView");
      const profView = document.getElementById("authProfileView");
      if (guestView) guestView.style.display = "block";
      if (profView) profView.style.display = "none";
      switchAuthTab("login");
    }
  } else {
    modal.classList.remove("active");
  }
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabBtnLogin");
  const tabReg = document.getElementById("tabBtnRegister");

  if (tab === "login") {
    if (loginForm) loginForm.style.display = "block";
    if (registerForm) registerForm.style.display = "none";
    if (tabLogin) tabLogin.classList.add("active");
    if (tabReg) tabReg.classList.remove("active");
  } else {
    if (loginForm) loginForm.style.display = "none";
    if (registerForm) registerForm.style.display = "block";
    if (tabLogin) tabLogin.classList.remove("active");
    if (tabReg) tabReg.classList.add("active");
  }
}

function updateMemberUI() {
  const memberBtn = document.getElementById("memberBtn");
  if (!memberBtn) return;

  if (memberProfile && (memberProfile.email || memberProfile.phone)) {
    const roleBadge = memberProfile.role ? memberProfile.role.split(" ")[0] : "特工";
    const displayId = memberProfile.agentId ? ` [ID: ${memberProfile.agentId}]` : "";
    memberBtn.innerHTML = `[ 🟢 ${memberProfile.name || "特工"}${displayId}・${roleBadge} ]`;
    memberBtn.style.color = "var(--accent-cyan)";
    memberBtn.style.borderColor = "var(--accent-cyan)";

    const custName = document.getElementById("custName");
    const custEmail = document.getElementById("custEmail");
    const custPhone = document.getElementById("custPhone");
    const manualLoc = document.getElementById("manualShippingLocation");

    if (custName && !custName.value) custName.value = memberProfile.name || "";
    if (custEmail && !custEmail.value) custEmail.value = memberProfile.email || "";
    if (custPhone && !custPhone.value) custPhone.value = memberProfile.phone || "";
    if (manualLoc && !manualLoc.value && memberProfile.defaultLocation) {
      manualLoc.value = memberProfile.defaultLocation;
    }
  } else {
    memberBtn.innerHTML = "[ 訪客 ACCESS ]";
    memberBtn.style.color = "var(--text-muted)";
    memberBtn.style.borderColor = "var(--panel-border)";
  }
}

function populateProfileView() {
  if (!memberProfile) return;
  const badge = document.getElementById("profileAccountBadge");
  const nameInp = document.getElementById("profNameInput");
  const agentIdInp = document.getElementById("profAgentIdInput");
  const locInp = document.getElementById("profLocationInput");

  if (badge) badge.textContent = `[ VERIFIED AGENT // ${memberProfile.email || memberProfile.phone} ]`;
  if (nameInp) nameInp.value = memberProfile.name || "";
  if (agentIdInp) agentIdInp.value = memberProfile.agentId || "";
  if (locInp) locInp.value = memberProfile.defaultLocation || "";
  setProfileRole(memberProfile.role || "服從者 (Sub)");
}

function setProfileRole(role) {
  const domBtn = document.getElementById("roleDom");
  const switchBtn = document.getElementById("roleSwitch");
  const subBtn = document.getElementById("roleSub");

  [domBtn, switchBtn, subBtn].forEach(b => {
    if (b) b.classList.remove("active");
  });

  if (role.includes("Dom") && domBtn) domBtn.classList.add("active");
  else if (role.includes("Switch") && switchBtn) switchBtn.classList.add("active");
  else if (subBtn) subBtn.classList.add("active");

  if (memberProfile) memberProfile.role = role;
}

// --------------------------------------------------------------------------
// 2. 發送與註冊
// --------------------------------------------------------------------------
function sendRegisterOtp() {
  const emailInput = document.getElementById("regEmailInput");
  const btn = document.getElementById("btnSendRegOtp");
  const notice = document.getElementById("regOtpNotice");
  const email = emailInput.value.trim().toLowerCase();

  if (!email || email.indexOf("@") === -1) {
    alert("請先輸入合法的安全特工信箱 (Email)！");
    return;
  }

  btn.disabled = true;
  btn.textContent = "發送中...";
  notice.textContent = "正在發送加密協議驗證碼...";

  fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "sendOtp", email: email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.result === "success") {
      alert("✔ 驗證碼已送出，請至信箱查收！");
      notice.style.color = "var(--accent-cyan)";
      notice.textContent = "✔ 驗證碼已發送。";

      let cooldown = 60;
      const timer = setInterval(() => {
        cooldown--;
        btn.textContent = `重新發送 (${cooldown}s)`;
        if (cooldown <= 0) {
          clearInterval(timer);
          btn.disabled = false;
          btn.textContent = "發送驗證碼";
          notice.textContent = "";
        }
      }, 1000);
    } else {
      btn.disabled = false;
      btn.textContent = "發送驗證碼";
      notice.style.color = "var(--danger-red)";
      notice.textContent = "❌ " + (data.msg || "發送失敗。");
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.textContent = "發送驗證碼";
    notice.style.color = "var(--danger-red)";
    notice.textContent = "連線異常。";
  });
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("regNameInput").value.trim();
  const agentId = document.getElementById("regAgentIdInput").value.trim().toUpperCase() || "AGENT-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  const email = document.getElementById("regEmailInput").value.trim().toLowerCase();
  const otp = document.getElementById("regOtpInput").value.trim();
  const phone = document.getElementById("regPhoneInput").value.trim();
  const password = document.getElementById("regPasswordInput").value.trim();
  const btn = document.getElementById("btnRegSubmit");

  if (!otp || otp.length !== 6) {
    alert("請輸入完整的 6 位數信箱驗證碼！");
    return;
  }

  btn.disabled = true;
  btn.textContent = "神經協議建立中...";

  const payload = {
    action: "registerWithOtp",
    name,
    agentId,
    email,
    otp,
    phone,
    password
  };

  fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    btn.disabled = false;
    btn.textContent = "驗證信箱並建立檔案 (REGISTER)";

    if (data.result === "success") {
      memberProfile = data.user;
      localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
      updateMemberUI();

      if (typeof loadAgentTrackerState === "function") loadAgentTrackerState();

      toggleAuthModal(false);
      alert(`【認罪建檔成功】歡迎加入共犯矩陣，特工 ${memberProfile.name} (ID: ${memberProfile.agentId})！`);
    } else {
      alert("❌ 註冊失敗：" + (data.msg || "驗證碼無效或過期。"));
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.textContent = "驗證信箱並建立檔案 (REGISTER)";
    alert("連線協議發送失敗！");
  });
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const account = document.getElementById("loginAccountInput").value.trim();
  const password = document.getElementById("loginPasswordInput").value.trim();
  const ndaCheck = document.getElementById("loginNdaCheckbox").checked;
  const btn = document.getElementById("btnLoginSubmit");

  if (!ndaCheck) {
    alert("您必須勾選簽署《特工認罪保密協議》方可接入終端！");
    return;
  }

  btn.disabled = true;
  btn.textContent = "密鑰核銷檢索中...";

  const cbName = "loginCb_" + Date.now();
  window[cbName] = function(res) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];

    btn.disabled = false;
    btn.textContent = "驗證密鑰並登入 (ACCESS)";

    if (res && res.result === "success") {
      memberProfile = res.user;
      localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
      updateMemberUI();

      if (typeof loadAgentTrackerState === "function") loadAgentTrackerState();
      if (typeof restoreTrackerFromCloud === "function") restoreTrackerFromCloud();

      toggleAuthModal(false);
      alert(`【神經接入成功】歡迎回到終端，特工 ${memberProfile.name}！`);
    } else {
      alert("❌ 接入失敗：" + (res.msg || "帳號或通行密碼錯誤。"));
    }
  };

  const script = document.createElement("script");
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=login&account=${encodeURIComponent(account)}&password=${encodeURIComponent(password)}&callback=${cbName}&_t=${Date.now()}`;
  script.onerror = () => {
    btn.disabled = false;
    btn.textContent = "驗證密鑰並登入 (ACCESS)";
    alert("登入連線逾時。");
  };
  document.body.appendChild(script);
}

function handleProfileUpdate(e) {
  e.preventDefault();
  if (!memberProfile) return;

  const newName = document.getElementById("profNameInput").value.trim();
  const newAgentId = document.getElementById("profAgentIdInput").value.trim().toUpperCase();
  const newLoc = document.getElementById("profLocationInput").value.trim();

  memberProfile.name = newName;
  memberProfile.agentId = newAgentId;
  memberProfile.defaultLocation = newLoc;
  localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
  updateMemberUI();

  if (typeof trackerState !== "undefined" && trackerState.profile) {
    trackerState.profile.name = newName;
    trackerState.profile.role = memberProfile.role || "服從者 (Sub)";
    if (typeof saveTrackerState === "function") saveTrackerState();
  }

  fetch(CONFIG.API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "updateProfile",
      email: memberProfile.email || "",
      phone: memberProfile.phone || "",
      name: newName,
      agentId: newAgentId,
      role: memberProfile.role,
      defaultLocation: newLoc
    })
  });

  toggleAuthModal(false);
  alert("✔ 特工檔案數據已成功更新！");
}

function logoutMember() {
  if (!confirm("確定要斷開與終端的神經連結嗎？")) return;

  memberProfile = null;
  localStorage.removeItem(CONFIG.STORAGE_KEYS.MEMBER);
  updateMemberUI();

  if (typeof loadAgentTrackerState === "function") loadAgentTrackerState();

  toggleAuthModal(false);
  showLandingView();
  alert("已中斷特工神經連線。");
}
