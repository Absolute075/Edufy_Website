// Edufy App Controller - SPA and global interactions

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar elements (will be populated via partial)
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  // Force full reload navigation (disable SPA)
  const DISABLE_SPA = true;

  function rebindSidebarControls() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    function onToggle() {
      if (!sidebar || !mainContent) return;
      const isMobile = window.innerWidth <= 1024;
      if (isMobile) {
        // Mobile: use 'active' to show/hide
        if (sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
          mainContent.classList.remove('expanded');
        } else {
          sidebar.classList.add('active');
          mainContent.classList.add('expanded');
        }
        sidebar.classList.remove('collapsed');
        sidebar.classList.remove('open');
      } else {
        // Desktop: collapse/expand
        sidebar.classList.toggle('collapsed');
        sidebar.classList.remove('active');
        sidebar.classList.remove('open');
        mainContent.classList.toggle('expanded');
      }
    }
    [sidebarToggle, mobileMenuBtn].forEach(btn => { btn?.addEventListener('click', onToggle); });
  }

  function setActiveSidebarLink() {
    const raw = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
    const page = raw.replace(/\.html?$/, '');
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(a => {
      const dp = (a.getAttribute('data-page') || a.getAttribute('href') || '').toLowerCase();
      const dataPage = dp.replace(/\.html?$/, '').replace(/\/$/, '');
      if (dataPage === page) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  // SPA Navigation: keep sidebar, swap main content
  function initSpaNavigation() {
    const sb = document.querySelector('.sidebar');
    if (!sb) return;
    sb.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-item');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (DISABLE_SPA) return; // allow default full reload
      e.preventDefault();
      navigateTo(href, true);
    });

    window.addEventListener('popstate', () => {
      if (DISABLE_SPA) return;
      const current = (location.pathname.split('/').pop() || 'dashboard.html');
      navigateTo(current, false);
    });
  }

  // Intercept internal links in main content (e.g., Report button) for SPA routing
  function initContentLinkRouting() {
    document.body.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      const target = a.getAttribute('target');
      if (!href) return;
      // Skip external/special links
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('#')) return;
      if (target === '_blank') return;
      if (!/\.html?(?:$|[?#])/.test(href)) return;
      if (DISABLE_SPA) return; // let browser do full reload
      e.preventDefault();
      navigateTo(href, true);
    });
  }

  async function navigateTo(url, push) {
    if (DISABLE_SPA) { window.location.href = url; return; }
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return (window.location.href = url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // Swap page-specific inline styles
      // Remove previous SPA-injected styles
      document.head.querySelectorAll('style[data-spa-style="true"]').forEach(el => el.remove());
      // Inject inline styles from fetched document head
      doc.querySelectorAll('head style').forEach(s => {
        const st = document.createElement('style');
        st.setAttribute('data-spa-style', 'true');
        if (s.media) st.media = s.media;
        st.textContent = s.textContent || '';
        document.head.appendChild(st);
      });
      const newMain = doc.querySelector('.main-content');
      const currentMain = document.querySelector('.main-content');
      if (!newMain || !currentMain) return (window.location.href = url);

      currentMain.replaceWith(newMain);

      // Replace page-level auxiliaries (modals, toasts) to avoid leftover overlays blocking clicks
      try {
        // Remove existing modals/toasts that are outside main-content
        document.querySelectorAll('.modal').forEach(el => el.remove());
        const existingToast = document.getElementById('toast');
        if (existingToast) existingToast.remove();
        // Append modals from fetched document
        doc.querySelectorAll('.modal').forEach(m => {
          document.body.appendChild(m);
        });
        const newToast = doc.getElementById('toast');
        if (newToast) document.body.appendChild(newToast);
      } catch {}

      // Execute scripts from the fetched page
      // 1) Skip external scripts already present to avoid duplicates
      // 2) Always run inline scripts for page-specific logic
      const scripts = Array.from(doc.querySelectorAll('script'));
      for (const s of scripts) {
        const isExternal = !!s.src;
        if (isExternal) {
          const exists = !!document.querySelector(`script[src="${s.src}"]`);
          if (exists) continue;
        }
        const sc = document.createElement('script');
        if (isExternal) sc.src = s.src; else sc.textContent = s.textContent || '';
        if (s.type) sc.type = s.type;
        if (s.defer) sc.defer = true;
        document.body.appendChild(sc);
      }

      if (push) history.pushState({}, '', url);
      // Reload sidebar on every navigation to keep it fresh and correctly bound
      try { await loadSidebarPartial(); } catch {}
    } catch (_) {
      window.location.href = url;
    }
  }

  // Expose SPA navigate helper for scripts within pages
  window.spaNavigate = (u) => navigateTo(u, true);

  async function loadSidebarPartial() {
    const candidates = [
      'sidebar-ultra.html',        // relative to current
      '/sidebar-ultra.html',       // absolute at site root (server root already points to /dash)
      '../sidebar-ultra.html',     // one level up (for subpages)
      '/dash/sidebar-ultra.html'   // legacy absolute under /dash
    ];

    let loaded = false;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const html = await res.text();
        // Validate that we really fetched the partial, not a full page fallback
        const isFullDoc = /<html[\s\S]*<\/html>/i.test(html);
        const looksLikeSidebar = /<nav[^>]*class=["'][^"']*sidebar-nav/i.test(html);
        if (isFullDoc || !looksLikeSidebar) continue;
        if (sidebar) sidebar.innerHTML = html;
        setActiveSidebarLink();
        rebindSidebarControls();
        bindSidebarActions();
        initSpaNavigation();
        initContentLinkRouting();
        try { window.dispatchEvent(new Event('app:rehydrate')); } catch {}
        loaded = true;
        break;
      } catch {}
    }
    if (!loaded) {
      // Fallback: inject a minimal working sidebar to avoid blank UI
      if (sidebar && !sidebar.innerHTML.trim()) {
        sidebar.innerHTML = `
          <div class="sidebar-header">
            <div class="brand">
              <img src="https://resources.edufyuzbekistan.com/storage/images/favicon.png" alt="Edufy" class="brand-logo">
              <span class="brand-name">Edufy</span>
            </div>
            <button class="sidebar-toggle" id="sidebarToggle"><span class="toggle-icon"></span></button>
          </div>
          <nav class="sidebar-nav">
            <a href="dashboard" class="nav-item" data-page="dashboard"><span class="nav-text">Dashboard</span></a>
            <a href="profile" class="nav-item" data-page="profile"><span class="nav-text">Profile</span></a>
            <a href="courses" class="nav-item" data-page="courses"><span class="nav-text">Resources</span></a>
            <a href="mentor" class="nav-item" data-page="mentor"><span class="nav-text">Mentor AI</span></a>
            <a href="billing-free" class="nav-item" data-page="billing-free"><span class="nav-text">Billing</span></a>
            <a href="settings" class="nav-item" data-page="settings"><span class="nav-text">Settings</span></a>
          </nav>`;
      }
      // Bind controls even if we used the fallback
      rebindSidebarControls();
      bindSidebarActions();
      initSpaNavigation();
      initContentLinkRouting();
      try { window.dispatchEvent(new Event('app:rehydrate')); } catch {}
    }
  }

  loadSidebarPartial();

  // Rebind page-specific UI after SPA swaps content
  function rebindPageUi() {
    // Rebind notification bell
    try {
      const notificationBtn = document.getElementById('notificationBtn');
      notificationBtn?.addEventListener('click', () => { window.location.href = 'notifications.html'; });
    } catch {}
    // Profile: avatar change button and file input
    try {
      const avatarChangeBtn = document.getElementById('avatarChangeBtn');
      const avatarInput = document.getElementById('avatarInput');
      const profileAvatar = document.getElementById('profileAvatar');
      const headerAvatar = document.querySelector('.header-avatar');
      avatarChangeBtn?.addEventListener('click', () => { avatarInput?.click(); });
      avatarInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file && file.type?.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (profileAvatar) profileAvatar.src = ev.target.result;
            if (headerAvatar) headerAvatar.src = ev.target.result;
            showToast('Profile picture updated successfully!');
          };
          reader.readAsDataURL(file);
        }
      });
    } catch {}
    // Profile: Edit/Save personal info
    try {
      const personalCard = document.getElementById('editPersonalBtn')?.closest('.profile-card');
      const savePersonalBtn = document.getElementById('savePersonalBtn');
      const personalInputs = personalCard?.querySelectorAll('.form-input');
      const personalEditBtn = document.getElementById('editPersonalBtn');
      let originals = null;
      function snapshotOriginals(){ originals = {}; personalInputs?.forEach(inp => { originals[inp.id] = inp.value; }); }
      function checkDirty(){
        if (!originals) return false;
        let dirty = false;
        personalInputs?.forEach(inp => { if (originals[inp.id] !== inp.value) dirty = true; });
        if (savePersonalBtn) savePersonalBtn.style.display = dirty ? 'inline-flex' : 'none';
        return dirty;
      }
      personalEditBtn?.addEventListener('click', () => {
        if (!personalInputs) return;
        personalInputs.forEach(inp => { inp.removeAttribute('readonly'); inp.removeAttribute('disabled'); });
        snapshotOriginals();
        checkDirty();
        personalInputs.forEach(inp => {
          inp.addEventListener('input', checkDirty, { once: false });
          inp.addEventListener('change', checkDirty, { once: false });
        });
      });
      savePersonalBtn?.addEventListener('click', () => {
        const fullName = document.getElementById('Username')?.value;
        const email = document.getElementById('email')?.value;
        if (!fullName || !email) { showToast('Please fill in all required fields', 'error'); return; }
        const headerUsername = document.querySelector('.header-username');
        const avatarName = document.querySelector('.avatar-name');
        if (headerUsername) headerUsername.textContent = fullName;
        if (avatarName) avatarName.textContent = fullName;
        personalInputs?.forEach(inp => { inp.setAttribute('readonly', true); if (inp.tagName === 'SELECT') inp.setAttribute('disabled', true); });
        // Save merged Learning Preferences as part of personal save
        try { window.__saveLearningPrefs?.(); } catch {}
        if (savePersonalBtn) savePersonalBtn.style.display = 'none';
        originals = null;
        showToast('Personal information saved successfully!');
      });
    } catch {}
    // Settings: change password modal
    try {
      const changePasswordBtn = document.getElementById('changePasswordBtn');
      const passwordModal = document.getElementById('passwordModal');
      const closePasswordModal = document.getElementById('closePasswordModal');
      const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
      const submitPasswordBtn = document.getElementById('submitPasswordBtn');
      const modalOverlay = document.getElementById('modalOverlay');
      changePasswordBtn?.addEventListener('click', () => { passwordModal?.classList.add('active'); });
      [closePasswordModal, cancelPasswordBtn, modalOverlay].forEach(elem => { elem?.addEventListener('click', () => { passwordModal?.classList.remove('active'); }); });
      submitPasswordBtn?.addEventListener('click', () => { showToast('Password updated successfully!'); passwordModal?.classList.remove('active'); });
    } catch {}
    // Settings: 2FA toggle
    try {
      const twoFactorToggle = document.getElementById('twoFactorToggle');
      twoFactorToggle?.addEventListener('change', (e) => { showToast(e.target.checked ? 'Two-factor authentication enabled!' : 'Two-factor authentication disabled'); });
    } catch {}
    // Connected Accounts buttons
    try {
      const accountBtns = document.querySelectorAll('.account-btn');
      accountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const accountItem = btn.closest('.account-item');
          const accountName = accountItem.querySelector('.account-name')?.textContent || 'Account';
          const accountStatus = accountItem.querySelector('.account-status');
          if (btn.classList.contains('disconnect')) {
            if (accountStatus) { accountStatus.textContent = 'Not Connected'; accountStatus.classList.remove('connected'); accountStatus.classList.add('not-connected'); }
            btn.textContent = 'Connect'; btn.classList.remove('disconnect'); btn.classList.add('connect');
            showToast(`${accountName} account disconnected`);
          } else {
            if (accountStatus) { accountStatus.textContent = 'Connected'; accountStatus.classList.remove('not-connected'); accountStatus.classList.add('connected'); }
            btn.textContent = 'Disconnect'; btn.classList.remove('connect'); btn.classList.add('disconnect');
            showToast(`${accountName} account connected successfully!`);
          }
        });
      });
    } catch {}
    // Badge clicks
    try {
      const badges = document.querySelectorAll('.badge-item:not(.locked)');
      badges.forEach(badge => {
        badge.addEventListener('click', () => {
          const badgeName = badge.querySelector('.badge-name')?.textContent || 'Badge';
          showToast(`🏆 ${badgeName} - Keep up the great work!`);
        });
      });
    } catch {}
    // Smooth scroll for in-page anchors
    try {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    } catch {}
    // Close any open modal on Escape
    try {
      // no duplicate leaks: handler is idempotent
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const activeModal = document.querySelector('.modal.active');
          activeModal?.classList.remove('active');
        }
      });
    } catch {}
  }

  // Global app-level rehydrate: called after SPA navigation
  window.addEventListener('app:rehydrate', () => {
    setActiveSidebarLink();
    rebindSidebarControls();
    bindSidebarActions();
    rebindPageUi();
    // Cascade to components.js for profile/avatar/profile-form logic
    try { window.dispatchEvent(new Event('edufy:rehydrate')); } catch {}
  });

  // Avatar Upload
  const avatarChangeBtn = document.getElementById('avatarChangeBtn');
  const avatarInput = document.getElementById('avatarInput');
  const profileAvatar = document.getElementById('profileAvatar');
  const headerAvatar = document.querySelector('.header-avatar');

  avatarChangeBtn?.addEventListener('click', () => {
    avatarInput?.click();
  });

  avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (profileAvatar) profileAvatar.src = event.target.result;
        if (headerAvatar) headerAvatar.src = event.target.result;
        showToast('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  });

  // Personal Info Edit Mode + Save button visibility on change
  const personalCard = document.getElementById('editPersonalBtn')?.closest('.profile-card');
  const savePersonalBtn = document.getElementById('savePersonalBtn');
  const personalInputs = personalCard?.querySelectorAll('.form-input');
  const personalEditBtn = document.getElementById('editPersonalBtn');

  let originals = null;

  function snapshotOriginals() {
    originals = {};
    personalInputs?.forEach(inp => { originals[inp.id] = inp.value; });
  }

  function checkDirty() {
    if (!originals) return false;
    let dirty = false;
    personalInputs?.forEach(inp => { if (originals[inp.id] !== inp.value) dirty = true; });
    if (savePersonalBtn) savePersonalBtn.style.display = dirty ? 'inline-flex' : 'none';
    return dirty;
  }

  personalEditBtn?.addEventListener('click', () => {
    if (!personalInputs) return;
    // Enable edit mode
    personalInputs.forEach(inp => { inp.removeAttribute('readonly'); inp.removeAttribute('disabled'); });
    snapshotOriginals();
    checkDirty();
    // Watch changes
    personalInputs.forEach(inp => {
      inp.addEventListener('input', checkDirty, { once: false });
      inp.addEventListener('change', checkDirty, { once: false });
    });
  });

  savePersonalBtn?.addEventListener('click', () => {
    const fullName = document.getElementById('Username')?.value;
    const email = document.getElementById('email')?.value;
    // Validation
    if (!fullName || !email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    // Persist (placeholder for API)
    const headerUsername = document.querySelector('.header-username');
    const avatarName = document.querySelector('.avatar-name');
    if (headerUsername) headerUsername.textContent = fullName;
    if (avatarName) avatarName.textContent = fullName;

    // Exit edit mode
    personalInputs?.forEach(inp => { inp.setAttribute('readonly', true); if (inp.tagName === 'SELECT') inp.setAttribute('disabled', true); });
    // Save merged Learning Preferences as part of personal save
    try { window.__saveLearningPrefs?.(); } catch {}
    if (savePersonalBtn) savePersonalBtn.style.display = 'none';
    originals = null;
    showToast('Personal information saved successfully!');
  });

  // Change Password Modal
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const passwordModal = document.getElementById('passwordModal');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const submitPasswordBtn = document.getElementById('submitPasswordBtn');
  const modalOverlay = document.getElementById('modalOverlay');

  changePasswordBtn?.addEventListener('click', () => {
    passwordModal?.classList.add('active');
  });

  [closePasswordModal, cancelPasswordBtn, modalOverlay].forEach(elem => {
    elem?.addEventListener('click', () => {
      passwordModal?.classList.remove('active');
    });
  });

  submitPasswordBtn?.addEventListener('click', () => {
    // Add password validation logic here
    showToast('Password updated successfully!');
    passwordModal?.classList.remove('active');
  });

  // Two-Factor Authentication Toggle
  const twoFactorToggle = document.getElementById('twoFactorToggle');
  twoFactorToggle?.addEventListener('change', (e) => {
    if (e.target.checked) {
      showToast('Two-factor authentication enabled!');
    } else {
      showToast('Two-factor authentication disabled');
    }
  });

  // Connected Accounts
  const accountBtns = document.querySelectorAll('.account-btn');
  accountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const accountItem = btn.closest('.account-item');
      const accountName = accountItem.querySelector('.account-name').textContent;
      const accountStatus = accountItem.querySelector('.account-status');
      
      if (btn.classList.contains('disconnect')) {
        accountStatus.textContent = 'Not Connected';
        accountStatus.classList.remove('connected');
        accountStatus.classList.add('not-connected');
        btn.textContent = 'Connect';
        btn.classList.remove('disconnect');
        btn.classList.add('connect');
        showToast(`${accountName} account disconnected`);
      } else {
        accountStatus.textContent = 'Connected';
        accountStatus.classList.remove('not-connected');
        accountStatus.classList.add('connected');
        btn.textContent = 'Disconnect';
        btn.classList.remove('connect');
        btn.classList.add('disconnect');
        showToast(`${accountName} account connected successfully!`);
      }
    });
  });

  // Badge Click - Show Details
  const badges = document.querySelectorAll('.badge-item:not(.locked)');
  badges.forEach(badge => {
    badge.addEventListener('click', () => {
      const badgeName = badge.querySelector('.badge-name').textContent;
      showToast(`🏆 ${badgeName} - Keep up the great work!`);
    });
  });

  // Logout (bind after sidebar injection)
  function bindSidebarActions() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (confirm('Are you sure you want to logout?')) {
          showToast('Logging out...');
          setTimeout(() => { window.location.href = 'https://access.edufyuzbekistan.com/login'; }, 1000);
        }
      };
    }
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast?.querySelector('.toast-message');
    const toastIcon = toast?.querySelector('.toast-icon');
    
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    // Update border color based on type
    if (type === 'error') {
      toast.style.borderColor = 'var(--danger)';
      toast.style.boxShadow = 'var(--shadow-lg), 0 0 20px rgba(239, 68, 68, 0.3)';
    } else {
      toast.style.borderColor = 'var(--success)';
      toast.style.boxShadow = 'var(--shadow-lg), 0 0 20px rgba(16, 185, 129, 0.3)';
    }

    toast.classList.add('active');

    setTimeout(() => {
      toast.classList.remove('active');
    }, 3000);
  }

  // Edit Button Toggle (skip personal info which has custom flow)
  const editButtons = document.querySelectorAll('.edit-btn');
  editButtons.forEach(btn => {
    if (btn.id === 'editPersonalBtn') return; // handled above
    btn.addEventListener('click', () => {
      const cardBody = btn.closest('.profile-card').querySelector('.card-body');
      const inputs = cardBody?.querySelectorAll('.form-input');
      inputs?.forEach(input => {
        if (input.hasAttribute('readonly')) {
          input.removeAttribute('readonly');
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Save
          `;
        } else {
          input.setAttribute('readonly', true);
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit
          `;
          showToast('Changes saved!');
        }
      });
    });
  });

  // Notification Bell -> Navigate to Notifications page
  const notificationBtn = document.getElementById('notificationBtn');
  notificationBtn?.addEventListener('click', () => {
    window.location.href = 'notifications.html';
  });

  // Smooth Scroll for In-page Navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      target?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      activeModal?.classList.remove('active');
    }
  });

  // Search functionality
  const searchInput = document.querySelector('.search-input');
  searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length > 2) {
      console.log('Searching for:', searchTerm);
      // Add search logic here
    }
  });

  // Progress bar animation on load
  const progressFills = document.querySelectorAll('.progress-fill');
  progressFills.forEach(fill => {
    const targetWidth = fill.style.width;
    fill.style.width = '0%';
    setTimeout(() => {
      fill.style.width = targetWidth;
    }, 300);
  });

  // Auto-save form data
  const formInputs = document.querySelectorAll('.form-input');
  formInputs.forEach(input => {
    input.addEventListener('blur', () => {
      // Add auto-save logic here
      console.log('Auto-saving:', input.id, input.value);
    });
  });

  // Profile: Learning Preferences (load/save)
  (function initLearningPreferences(){
    const certEl = document.getElementById('qCertificate');
    const subjEl = document.getElementById('qSubject');
    const hoursEl = document.getElementById('qDailyHours');
    const saveBtn = document.getElementById('savePreferencesBtn');
    if (!certEl && !subjEl && !hoursEl && !saveBtn) return; // not on profile

    // Load from localStorage into UI
    try {
      const s = (k, el) => { const v = localStorage.getItem(k); if (v !== null && el) el.value = v; };
      // Normalize old certificate formats like 'IELTS 6.5' -> '6.5', 'TOEFL 95-109' -> '95-109'
      (function(){
        const raw = localStorage.getItem('pref.certificate');
        if (raw && certEl) {
          let norm = raw.trim();
          // Extract numeric value/range like 6.5, 95-109, 110-117, <41, <1000
          const m = norm.match(/(\d+\.\d+|\d+-\d+|<\d+|\d+)/);
          if (m) {
            norm = m[1];
            // If this value exists among options, apply it
            const has = Array.from(certEl.querySelectorAll('option')).some(o => o.value === norm);
            if (has) certEl.value = norm;
          }
        }
      })();
      // Subject load stays as-is
      s('pref.subject', subjEl);
      // Hours: prefer new key, fallback to old minutes and map to range
      (function(){
        const v = localStorage.getItem('pref.daily_hours');
        if (v && hoursEl) { hoursEl.value = v; return; }
        const oldMin = localStorage.getItem('pref.daily_minutes');
        if (oldMin && hoursEl) {
          const m = parseInt(oldMin, 10);
          if (!isNaN(m)) {
            let bucket = '';
            if (m <= 60) bucket = '0-1';
            else if (m <= 180) bucket = '2-3';
            else if (m <= 300) bucket = '4-5';
            else if (m <= 420) bucket = '6-7';
            else if (m <= 540) bucket = '8-9';
            else bucket = '10+';
            hoursEl.value = bucket;
          }
        }
      })();
    } catch {}

    function showToast(msg) {
      const t = document.getElementById('toast');
      if (!t) return;
      const span = t.querySelector('.toast-message');
      if (span) span.textContent = msg;
      t.classList.add('active');
      setTimeout(()=> t.classList.remove('active'), 2000);
    }

    async function savePrefs() {
      // Prepare certificate formatting for backend
      let certificateForBackend = '';
      if (certEl) {
        const raw = (certEl.value || '').trim();
        const opt = certEl.selectedOptions && certEl.selectedOptions[0];
        const group = opt ? (opt.getAttribute('data-group') || '').toUpperCase() : '';
        if (raw === 'none') {
          certificateForBackend = 'none';
        } else if (group === 'IELTS') {
          // Include selected band, e.g., 'IELTS: 6.5'
          certificateForBackend = raw ? `IELTS: ${raw}` : 'IELTS';
        } else if (group === 'TOEFL') {
          if (/^\d+-\d+$/.test(raw)) {
            certificateForBackend = `TOEFL: ${raw.split('-')[0]}`;
          } else {
            certificateForBackend = `TOEFL: ${raw}`; // handles single number and <41
          }
        } else if (group === 'SAT') {
          if (/^\d+-\d+$/.test(raw)) {
            certificateForBackend = `SAT: ${raw.split('-')[0]}`;
          } else {
            certificateForBackend = `SAT: ${raw}`; // handles single number and <1000
          }
        } else if (group === 'AP') {
          certificateForBackend = `AP: ${raw}`; // AP is a single score 1-5
        } else if (group === 'ACT') {
          if (/^\d+-\d+$/.test(raw)) {
            certificateForBackend = `ACT: ${raw.split('-')[0]}`;
          } else {
            certificateForBackend = `ACT: ${raw}`; // handles single number and <20
          }
        } else {
          // default: keep raw
          certificateForBackend = raw;
        }
      }

      // Map hour range to approximate minutes for backend
      function hoursRangeToMinutes(range){
        switch(range){
          case '0-1': return 30;
          case '2-3': return 150;
          case '4-5': return 270;
          case '6-7': return 390;
          case '8-9': return 510;
          case '10+': return 600;
          default: return null;
        }
      }

      const selectedHours = hoursEl ? (hoursEl.value || '') : '';
      const payload = {
        certificate: certificateForBackend,
        favorite_subject: subjEl ? subjEl.value : '',
        daily_hours: selectedHours || null,
      };

      // Persist locally for instant UX
      try {
        // Store raw select value for proper UI restore
        localStorage.setItem('pref.certificate', certEl ? (certEl.value || '') : '');
        localStorage.setItem('pref.subject', payload.favorite_subject || '');
        localStorage.setItem('pref.daily_hours', selectedHours || '');
      } catch {}

      // Send to backend (adjust endpoint as needed on server)
      try {
        const res = await fetch('/user/profile/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('failed');
        showToast('Preferences saved');
      } catch (e) {
        showToast('Saved locally. Sync pending');
      }
    }

    // Expose for Personal Information save button
    try { window.__saveLearningPrefs = savePrefs; } catch {}
    saveBtn?.addEventListener('click', (e)=>{ e.preventDefault(); savePrefs(); });
  })();

  // Initialize - Check if mobile (align with CSS breakpoint 820px)
  function checkMobile() {
    if (!sidebar || !mainContent) return;
    if (window.innerWidth <= 1024) {
      // Mobile default: hidden (no 'active')
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('open');
      sidebar.classList.remove('active');
      mainContent.classList.remove('expanded');
    } else {
      // Desktop default: visible (not collapsed)
      sidebar.classList.remove('active');
      sidebar.classList.remove('open');
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('expanded');
    }
  }

  checkMobile();
  window.addEventListener('resize', checkMobile);
});
