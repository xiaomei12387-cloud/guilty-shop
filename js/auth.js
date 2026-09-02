// ==========================================
// 🛡️ GUILTY AUTHENTICATION MODULE (js/auth.js)
// ==========================================

let memberProfile = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MEMBER)) || null;
let currentProfileRole = '服從者 (Sub)';
let regOtpTimer = null;

// 切換認證彈窗
function toggleAuthModal(isOpen) {
  const modal = document.getElementById('authModal');
  if (isOpen) {
    if (memberProfile && (memberProfile.email || memberProfile.phone)) {
      document.getElementById('authGuestView').style.display = 'none';
      document.getElementById('authProfileView').style.display = 'block';
      document.getElementById('profileAccountBadge').textContent = `[ VERIFIED: ${memberProfile.email || memberProfile.phone} ]`;
      document.getElementById('profNameInput').value = memberProfile.name || '';
      document.getElementById('profLocationInput').value = memberProfile.defaultLocation || '';
      setProfileRole(memberProfile.role || '服從者 (Sub)');
    } else {
      document.getElementById('authGuestView').style.display = 'block';
      document.getElementById('authProfileView').style.display = 'none';
      switchAuthTab('login');
    }
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
}

// 登入/註冊頁籤切換
function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabReg = document.getElementById('tabBtnRegister');
  const formLogin = document.getElementById('loginForm');
  const formReg = document.getElementById('registerForm');

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.style.display = 'block';
    formReg.style.display = 'none';
  } else {
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
    formLogin.style.display = 'none';
    formReg.style.display = 'block';
  }
}

// 設定陣營屬性
function setProfileRole(role) {
  currentProfileRole = role;
  document.getElementById('roleDom').classList.toggle('active', role.includes('Dom'));
  document.getElementById('roleSwitch').classList.toggle('active', role.includes('Switch'));
  document.getElementById('roleSub').classList.toggle('active', role.includes('Sub'));
}

// 帳密登入
function handleLoginSubmit(e) {
  e.preventDefault();
  const account = document.getElementById('loginAccountInput').value.trim();
  const password = document.getElementById('loginPasswordInput').value.trim();
  const ndaCheck = document.getElementById('loginNdaCheckbox').checked;
  const btn = document.getElementById('btnLoginSubmit');

  if (!ndaCheck) {
    alert('請先詳閱並勾選同意《特工認罪保密協議》！');
    return;
  }

  btn.disabled = true;
  btn.textContent = '神經密鑰驗證中...';

  const cbName = 'loginCb_' + Date.now();
  window[cbName] = function(res) {
    const s = document.getElementById(cbName);
    if (s) s.remove();
    delete window[cbName];
    btn.disabled = false;
    btn.textContent = '驗證密鑰並登入 (ACCESS)';

    if (res && res.result === 'success') {
      memberProfile = res.user;
      localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
      updateMemberUI();

      // 核心隔離：切換載入該特工專屬的 Tracker 資料庫
      if (typeof loadAgentTrackerState === 'function') {
        loadAgentTrackerState();
      }

      toggleAuthModal(false);
      alert(`【認證成功】歡迎接入終端，特工 ${memberProfile.name}！`);
    } else {
      alert(`❌ 登入失敗：${res.msg || '帳號或密碼錯誤'}`);
    }
  };

  const script = document.createElement('script');
  script.id = cbName;
  script.src = `${CONFIG.API_URL}?action=login&account=${encodeURIComponent(account)}&password=${encodeURIComponent(password)}&callback=${cbName}&_t=${Date.now()}`;
  script.onerror = () => {
    btn.disabled = false;
    btn.textContent = '驗證密鑰並登入 (ACCESS)';
    alert('連線逾時，請檢查網路狀態。');
  };
  document.body.appendChild(script);
}

// 發送信箱 OTP 驗證碼
function sendRegisterOtp() {
  const email = document.getElementById('regEmailInput').value.trim();
  const btn = document.getElementById('btnSendRegOtp');
  const notice = document.getElementById('regOtpNotice');

  if (!email || email.indexOf('@') === -1) {
    alert('請輸入有效的電子信箱！');
    return;
  }

  btn.disabled = true;
  btn.textContent = '發送中...';

  fetch(CONFIG.API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'sendOtp', email: email })
  }).then(() => {
    alert(`✔ 驗證碼已發送至 ${email}，請至信箱收取 6 位數代碼！`);
    let count = 60;
    notice.textContent = `重新發送冷卻中 (${count}s)...`;
    clearInterval(regOtpTimer);
    regOtpTimer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(regOtpTimer);
        btn.disabled = false;
        btn.textContent = '發送驗證碼';
        notice.textContent = '';
      } else {
        notice.textContent = `重新發送冷卻中 (${count}s)...`;
      }
    }, 1000);
  }).catch(() => {
    btn.disabled = false;
    btn.textContent = '發送驗證碼';
    alert('發送失敗，請稍後再試。');
  });
}

// 註冊提交 (含 OTP 驗證)
function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regNameInput').value.trim();
  const email = document.getElementById('regEmailInput').value.trim();
  const otp = document.getElementById('regOtpInput').value.trim();
  const phone = document.getElementById('regPhoneInput').value.trim();
  const password = document.getElementById('regPasswordInput').value.trim();
  const btn = document.getElementById('btnRegSubmit');

  if (!otp || otp.length !== 6) {
    alert('請輸入信箱收到的 6 位數驗證碼！');
    return;
  }

  btn.disabled = true;
  btn.textContent = '驗證建立檔案中...';

  const regPayload = {
    action: 'registerWithOtp',
    name: name,
    email: email,
    otp: otp,
    phone: phone,
    password: password
  };

  fetch(CONFIG.API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(regPayload)
  }).then(() => {
    btn.disabled = false;
    btn.textContent = '驗證信箱並建立檔案 (REGISTER)';
    memberProfile = {
      email: email,
      phone: phone,
      name: name,
      role: '服從者 (Sub)',
      defaultLocation: ''
    };
    localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
    updateMemberUI();

    // 核心隔離：為新特工建立並載入獨立 Tracker 庫
    if (typeof loadAgentTrackerState === 'function') {
      loadAgentTrackerState();
    }

    toggleAuthModal(false);
    alert(`✔ 特工檔案已成功建立！歡迎加入 GUILTY 終端庫，${name}。`);
  }).catch(() => {
    btn.disabled = false;
    btn.textContent = '驗證信箱並建立檔案 (REGISTER)';
    alert('註冊連線異常，請確認驗證碼是否正確。');
  });
}

// 更新個人檔案
function handleProfileUpdate(e) {
  e.preventDefault();
  if (!memberProfile) return;

  const updateData = {
    action: 'updateProfile',
    email: memberProfile.email || '',
    phone: memberProfile.phone || '',
    name: document.getElementById('profNameInput').value.trim(),
    role: currentProfileRole,
    defaultLocation: document.getElementById('profLocationInput').value.trim()
  };

  fetch(CONFIG.API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(updateData)
  }).then(() => {
    memberProfile = { ...memberProfile, ...updateData };
    localStorage.setItem(CONFIG.STORAGE_KEYS.MEMBER, JSON.stringify(memberProfile));
    updateMemberUI();

    // 若更改稱號或屬性，同步更新當前 Tracker 中的名片
    if (typeof trackerState !== 'undefined' && trackerState.profile) {
      trackerState.profile.name = memberProfile.name;
      trackerState.profile.role = memberProfile.role;
      if (typeof saveTrackerState === 'function') saveTrackerState();
      if (typeof renderTrackerApp === 'function') renderTrackerApp();
    }

    toggleAuthModal(false);
    alert('✔ 特工檔案已成功同步至 UserDB！');
  });
}

// 更新導覽列會員按鈕 UI
function updateMemberUI() {
  const btn = document.getElementById('memberBtn');
  if (!btn) return;

  if (memberProfile && (memberProfile.email || memberProfile.phone)) {
    const shortRole = memberProfile.role ? memberProfile.role.split(' ')[0] : '特工';
    btn.textContent = `[ ${shortRole}：${memberProfile.name || '特工'} ]`;
    btn.style.borderColor = 'var(--accent-cyan)';
    btn.style.color = 'var(--accent-cyan)';

    const nameInput = document.getElementById('custName');
    const emailInput = document.getElementById('custEmail');
    const phoneInput = document.getElementById('custPhone');
    if (nameInput && !nameInput.value) nameInput.value = memberProfile.name || '';
    if (emailInput && !emailInput.value) emailInput.value = memberProfile.email || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = memberProfile.phone || '';
  } else {
    btn.textContent = `[ 訪客 ]`;
    btn.style.borderColor = 'var(--panel-border)';
    btn.style.color = 'var(--text-muted)';
  }
}

// 退出特工登入（斷開連結）
function logoutMember() {
  if (confirm('確定要斷開此終端的神經連結並退出嗎？')) {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.MEMBER);
    memberProfile = null;

    // 核心隔離：清空當前畫面數據為空白狀態
    if (typeof createDefaultTrackerState === 'function') {
      trackerState = createDefaultTrackerState();
    }

    updateMemberUI();
    toggleAuthModal(false);

    // 登出時退回展廳首頁，避免訪客停留在管制終端
    if (typeof showLandingView === 'function') {
      showLandingView();
    }

    alert('【已斷開】目前已切換為訪客模式，終端權限已鎖定。');
  }
}
