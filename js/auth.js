// ==========================================================================
// 🛡️ GUILTY PROTOCOL // AGENT AUTH & NEURAL ACCESS MODULE (js/auth.js)
// ==========================================================================

// 特工身分全域物件 (由本機快取讀取)
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
      document.getElementById("authGuestView").style.display = "none";
      document.getElementById("authProfileView").style.display = "block";
      populateProfileView();
    } else {
      document.getElementById("authGuestView").style.display = "block";
      document.getElementById("authProfileView").style.display = "none";
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
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    tabLogin.classList.add("active");
    tabReg.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    tabLogin.classList.remove("active");
    tabReg.classList.add("active");
  }
}

function updateMemberUI() {
  const memberBtn = document.getElementById("memberBtn");
  if (!memberBtn) return;

  if (memberProfile && (memberProfile.email || memberProfile.phone)) {
    const roleBadge = memberProfile.role ? memberProfile.role.split(" ")[0] : "特工";
    memberBtn.innerHTML = `[ 🟢 ${memberProfile.name || "特工"}・${roleBadge} ]`;
    memberBtn.style.color = "var(--accent-cyan)";
    memberBtn.style.borderColor = "var(--accent-cyan)";

    // 自動預填結帳表單中的個人基本資訊
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
  document.getElementById("profileAccountBadge").textContent = 
    `[ VERIFIED AGENT // ${memberProfile.email || memberProfile.phone} ]`;
  document.getElementById("profNameInput").value = memberProfile.name || "";
  document.getElementById("profLocationInput").value = memberProfile.defaultLocation || "";
  setProfileRole(memberProfile.role || "服從者 (Sub)");
}

function setProfileRole(role) {
  const domBtn = document.getElementById("roleDom");
  const switchBtn = document.getElementById("roleSwitch");
  const subBtn = document.getElementById("roleSub");

  [domBtn, switchBtn, subBtn].forEach(b => b.classList.remove("active"));

  if (role.includes("Dom")) {
    domBtn.classList.add("active");
  } else if (role.includes("Switch")) {
    switchBtn.classList.add("active");
  } else {
    subBtn.classList.add("active");
  }

  if (memberProfile) memberProfile.role = role;
}

// --------------------------------------------------------------------------
// 2. 發送註冊 OTP 驗證碼
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
  notice.textContent = "正在發送加密協議驗證碼至您的信箱...";

  fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "sendOtp", email: email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.result === "success") {
      alert("✔ 6 位數身份驗證碼已送出！請至信箱查收並於 10 分鐘內輸入。");
      notice.style.color = "var(--accent-cyan)";
      notice.textContent = "✔ 驗證碼已發送，請檢查收件匣或垃圾郵件匣。";

      // 60 秒倒數計時冷卻
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
      notice.textContent = "❌ " + (data.msg || "發送失敗，請稍後重試。");
      alert(data.msg || "發送失敗，請確認信箱是否填寫正確。");
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.textContent = "發送驗證碼";
    notice.style.color = "var(--danger-red)";
    notice.textContent = "連線異常，請檢查網路狀態。";
  });
}

// --------------------------------------------------------------------------
// 3. 特工註冊送出 (含 OTP 驗證)
// --------------------------------------------------------------------------
function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("regNameInput").value.trim();
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

      // 載入該特工專屬隔離資料庫
      if (typeof loadAgentTrackerState === "function") {
        loadAgentTrackerState();
      }

      toggleAuthModal(false);
      alert(`【認罪建檔成功】歡迎加入共犯矩陣，特工 ${memberProfile.name}！`);
    } else {
      alert("❌ 註冊失敗：" + (data.msg || "驗證碼無效或過期。"));
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.textContent = "驗證信箱並建立檔案 (REGISTER)";
    alert("連線協議發送失敗，請檢查網路狀態！");
  });
}

// --------------------------------------------------------------------------
// 4. 特工密碼登入 (支援 Email / 手機 + JSONP 驗證 + 雲端還原)
// --------------------------------------------------------------------------
function handleLoginSubmit(e) {
  e.preventDefault();
  const account = document.getElementById("loginAccountInput").value.trim();
  const password = document.getElementById("loginPasswordInput").value.trim();
  const ndaCheck = document.getElementById("loginNdaCheckbox").checked;
  const btn = document.getElementById("btnLoginSubmit");

  if (!ndaCheck) {
    alert("您必須閱讀並勾選簽署《特工認罪保密協議》方可接入終端！");
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

      // 核心隔離：載入本機資料並自動嘗試雲端同步還原
      if (typeof loadAgentTrackerState === "function") {
        loadAgentTrackerState();
      }
      if (typeof restoreTrackerFromCloud === "function") {
        restoreTrackerFromCloud();
      }

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
    alert("登入連線逾時，請檢查網路狀態。");
  };
  document.body.appendChild(script);
}

// --------------------------------------------------------------------------
// 5. 更新個人檔案 (明確送出 updateProfile，杜絕誤發訂單通知)
// --------------------------------------------------------------------------
function handleProfileUpdate(e) {
  e.preventDefault();
  if (!memberProfile) return;

  const newName = document.getElementById("profNameInput").value.trim();
  const newLoc = document.getElementById("profLocationInput").value.trim();

  memberProfile.name = newName;
  memberProfile.defaultLocation = newLoc;
  localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
  updateMemberUI();

  // 更新 Tracker 內特工的顯示名稱與身分
  if (typeof trackerState !== "undefined" && trackerState.profile) {
    trackerState.profile.name = newName;
    trackerState.profile.role = memberProfile.role || "服從者 (Sub)";
    if (typeof saveTrackerState === "function") {
      saveTrackerState();
    }
  }

  // 背景同步回 UserDB
  fetch(CONFIG.API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "updateProfile",
      email: memberProfile.email || "",
      phone: memberProfile.phone || "",
      name: newName,
      role: memberProfile.role,
      defaultLocation: newLoc
    })
  });

  toggleAuthModal(false);
  alert("✔ 特工檔案數據已成功更新！");
}

// --------------------------------------------------------------------------
// 6. 登出特工身分 (斷開神經連結)
// --------------------------------------------------------------------------
function logoutMember() {
  if (!confirm("確定要斷開與終端的神經連結（退出登入）嗎？")) return;

  memberProfile = null;
  localStorage.removeItem(CONFIG.STORAGE_KEYS.MEMBER);
  updateMemberUI();

  // 切回預設訪客狀態
  if (typeof loadAgentTrackerState === "function") {
    loadAgentTrackerState();
  }

  toggleAuthModal(false);
  showLandingView();
  alert("已中斷特工神經連線，已回復訪客權限。");
}
