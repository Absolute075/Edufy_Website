// Edufy App Controller - SPA and global interactions

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar elements (will be populated via partial)
  // Note: always re-query inside handlers in case DOM changes
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  // Force full reload navigation (disable SPA)
  const DISABLE_SPA = true;

  let sidebarOverlay = null;

  function closeSidebar() {
    const sb = document.querySelector('.sidebar');
    const mc = document.querySelector('.main-content');
    sb?.classList.remove('active', 'open');
    mc?.classList.remove('expanded');
    syncSidebarState();
  }

  function ensureSidebarOverlay() {
    if (sidebarOverlay && document.body.contains(sidebarOverlay)) return sidebarOverlay;
    sidebarOverlay = document.getElementById('sidebarOverlay');
    const created = !sidebarOverlay;
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.id = 'sidebarOverlay';
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
    }
    if (created || !sidebarOverlay.dataset.bound) {
      sidebarOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeSidebar();
      });
      sidebarOverlay.dataset.bound = 'true';
    }
    return sidebarOverlay;
  }

  function syncSidebarState() {
    const sb = document.querySelector('.sidebar');
    const overlay = ensureSidebarOverlay();
    const mc = document.querySelector('.main-content');
    const isMobile = window.innerWidth <= 1024;
    const isOpen = isMobile && sb && (sb.classList.contains('active') || sb.classList.contains('open'));

    if (overlay) overlay.classList.toggle('visible', !!isOpen);
    document.body.classList.toggle('sidebar-open', !!isOpen);

    if (!isMobile && sb) {
      sb.classList.remove('active');
      sb.classList.remove('open');
    }
    if (!isOpen) mc?.classList.remove('expanded');
  }

  function rebindSidebarControls() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    let lastToggleTs = 0;
    let lastTouchEndTs = 0;
    const TOGGLE_DEBOUNCE_MS = 350;

    function performToggle() {
      const sb = document.querySelector('.sidebar');
      const mc = document.querySelector('.main-content');
      if (!sb || !mc) return;
      // Always toggle 'active' so mobile slide-in works regardless of viewport quirks
      const nowActive = !sb.classList.contains('active');
      sb.classList.toggle('active', nowActive);
      if (!nowActive) sb.classList.remove('open');
      sb.classList.remove('collapsed');
      mc.classList.toggle('expanded', nowActive);
      syncSidebarState();
    }
    function onTouchEnd() {
      const now = Date.now();
      if (now - lastToggleTs < TOGGLE_DEBOUNCE_MS) return;
      lastTouchEndTs = now;
      lastToggleTs = now;
      performToggle();
    }

    function onPointerUp() {
      const now = Date.now();
      if (now - lastToggleTs < TOGGLE_DEBOUNCE_MS) return;
      lastToggleTs = now;
      performToggle();
    }

    function onClick() {
      const now = Date.now();
      if (now - lastTouchEndTs < TOGGLE_DEBOUNCE_MS) return; // suppress click right after touch
      if (now - lastToggleTs < TOGGLE_DEBOUNCE_MS) return;
      lastToggleTs = now;
      performToggle();
    }

    function attachTrigger(el) {
      if (!el) return;
      el.removeEventListener('click', onClick);
      el.addEventListener('click', onClick);
      el.removeEventListener('touchend', onTouchEnd);
      el.addEventListener('touchend', onTouchEnd, { passive: true });
      el.removeEventListener('pointerup', onPointerUp);
      el.addEventListener('pointerup', onPointerUp);
    }

    [sidebarToggle, mobileMenuBtn].forEach(attachTrigger);
    // Also bind to any element that uses the mobile-menu-btn class (fallback for pages that lack the id)
    try {
      document.querySelectorAll('.mobile-menu-btn').forEach(attachTrigger);
    } catch {}

    // Remove any previously installed global delegates
    try {
      (window.__edufySidebarDelegates || []).forEach(({ type, listener }) => {
        document.removeEventListener(type, listener, true);
      });
    } catch {}
    // Install delegated fallback for dynamically added or replaced triggers
    try {
      const delegatedToggle = (ev) => {
        const t = ev.target && (ev.target.closest ? ev.target.closest('#mobileMenuBtn, .mobile-menu-btn, #sidebarToggle') : null);
        if (!t) return;
        const now = Date.now();
        if (now - lastToggleTs < TOGGLE_DEBOUNCE_MS) return;
        lastToggleTs = now;
        performToggle();
      };
      document.addEventListener('pointerup', delegatedToggle, true);
      document.addEventListener('click', delegatedToggle, true);
      window.__edufySidebarDelegates = [
        { type: 'pointerup', listener: delegatedToggle },
        { type: 'click', listener: delegatedToggle }
      ];
    } catch {}

    ensureSidebarOverlay();
    syncSidebarState();
  }

  window.addEventListener('resize', () => {
    syncSidebarState();
  });

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
            <a href="resources/resources" class="nav-item" data-page="resources"><span class="nav-text">Resources</span></a>
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
      // Load certificates (supports multi). If JSON array -> select multiple. Else normalize single legacy value.
      (function(){
        const raw = localStorage.getItem('pref.certificate');
        if (!raw || !certEl) return;
        try {
          if (raw.trim().startsWith('[')) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const list = arr.map(v => String(v));
              // If 'none' is present with others, keep only 'none'
              const only = (list.includes('none') && list.length > 1) ? ['none'] : list;
              const set = new Set(only);
              Array.from(certEl.options).forEach(o => { o.selected = set.has(o.value); });
              return;
            }
          }
        } catch {}
        // Legacy single string like 'IELTS 6.5' -> select one
        let norm = raw.trim();
        const m = norm.match(/(\d+\.\d+|\d+-\d+|<\d+|\d+)/);
        if (m) {
          norm = m[1];
          Array.from(certEl.options).forEach(o => { o.selected = (o.value === norm); });
        }
      })();
      // Custom dropdown for multi-select certificates: hidden select, button trigger, checkbox list
      if (certEl) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '100%';
        const trigger = document.createElement('div');
        trigger.className = 'form-input';
        trigger.style.display = 'flex';
        trigger.style.alignItems = 'center';
        trigger.style.justifyContent = 'space-between';
        trigger.style.width = '100%';
        // No hover reaction
        trigger.style.cursor = 'default';
        trigger.style.transition = 'none';
        // No focus/active visual reaction
        trigger.style.outline = 'none';
        trigger.style.boxShadow = 'none';
        trigger.style.userSelect = 'none';
        // Use default background from .form-input CSS to match palette
        trigger.style.background = '';
        // No native focus/active since it's a div
        const labelSpan = document.createElement('span');
        labelSpan.textContent = 'Choose';
        labelSpan.style.color = 'inherit';
        trigger.appendChild(labelSpan);
        const caret = document.createElement('span');
        caret.textContent = '▾';
        trigger.appendChild(caret);
        const menu = document.createElement('div');
        menu.style.position = 'absolute';
        menu.style.zIndex = '20';
        // Open upwards above the trigger
        menu.style.bottom = 'calc(100% + 4px)';
        menu.style.left = '0';
        menu.style.right = '0';
        menu.style.maxHeight = '240px';
        menu.style.overflow = 'auto';
        // Palette will be matched to trigger after insertion
        menu.style.borderRadius = '6px';
        menu.style.padding = '6px';
        menu.style.display = 'none';
        const list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gap = '4px';
        menu.appendChild(list);

        function addItem(opt) {
          const val = (opt.value || '').trim();
          if (val === '') return; // skip placeholder
          const group = (opt.getAttribute('data-group') || '').toUpperCase();
          const row = document.createElement('label');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '8px';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = opt.value;
          cb.checked = opt.selected;
          cb.disabled = certEl.disabled;
          if (group) cb.setAttribute('data-group', group);
          row.appendChild(cb);
          const txt = document.createElement('span');
          txt.textContent = opt.textContent;
          row.appendChild(txt);
          cb.addEventListener('change', () => {
            if (cb.value === 'none' && cb.checked) {
              Array.from(certEl.options).forEach(o => { if (o.value !== 'none') o.selected = false; });
              Array.from(list.querySelectorAll('input[type="checkbox"]')).forEach(x => { if (x.value !== 'none') x.checked = false; });
            } else if (cb.checked) {
              const noneOpt = Array.from(certEl.options).find(o => o.value === 'none');
              if (noneOpt && noneOpt.selected) {
                noneOpt.selected = false;
                const noneCb = list.querySelector('input[type="checkbox"][value="none"]');
                if (noneCb) noneCb.checked = false;
              }
              // Enforce single score per group
              if (group) {
                // Unselect other options in same group in select
                Array.from(certEl.options).forEach(o => {
                  const g = (o.getAttribute && o.getAttribute('data-group') || '').toUpperCase();
                  if (g === group && o.value !== cb.value) o.selected = false;
                });
                // Uncheck other checkboxes in same group
                Array.from(list.querySelectorAll('input[type="checkbox"][data-group="' + group + '"]')).forEach(x => {
                  if (x.value !== cb.value) x.checked = false;
                });
              }
            }
            const targetOpt = Array.from(certEl.options).find(o => o.value === cb.value);
            if (targetOpt) targetOpt.selected = cb.checked;
            certEl.dispatchEvent(new Event('change', { bubbles: true }));
            updateTriggerLabel();
          });
          list.appendChild(row);
        }
        function rebuildList() {
          list.innerHTML = '';
          const groups = Array.from(certEl.children);
          for (const node of groups) {
            if (node.tagName === 'OPTGROUP') {
              const title = document.createElement('div');
              title.textContent = node.getAttribute('label') || '';
              title.style.fontWeight = '600';
              title.style.margin = '4px 0 2px';
              list.appendChild(title);
              Array.from(node.children).forEach(opt => addItem(opt));
            } else if (node.tagName === 'OPTION') {
              addItem(node);
            }
          }
        }
        function updateTriggerLabel(){
          const sel = Array.from(certEl.selectedOptions || []);
          if (!sel.length) {
            labelSpan.textContent = 'Choose';
            return;
          }
          // keep same color as other fields
          if (sel.length === 1) { labelSpan.textContent = sel[0].value === 'none' ? 'No certificate' : sel[0].textContent; return; }
          labelSpan.textContent = `${sel.length} selected`;
        }
        function syncDisabled(){
          const isDisabled = certEl.hasAttribute('disabled');
          // Do not set native disabled on trigger to avoid red barred cursor
          if (isDisabled) trigger.setAttribute('aria-disabled', 'true'); else trigger.removeAttribute('aria-disabled');
          list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.disabled = isDisabled; });
          // Keep default cursor always (no hover reaction)
          trigger.style.cursor = 'default';
          trigger.style.opacity = isDisabled ? '0.7' : '1';
        }
        trigger.addEventListener('click', () => {
          if (certEl.disabled) return;
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', (e) => {
          if (!container.contains(e.target)) menu.style.display = 'none';
        });
        certEl.parentElement.insertBefore(container, certEl);
        container.appendChild(trigger);
        container.appendChild(menu);
        rebuildList();
        updateTriggerLabel();
        certEl.style.display = 'none';
        // After in DOM, align palette with trigger/form-input
        (function alignPalette(){
          const cs = window.getComputedStyle(trigger);
          menu.style.backgroundColor = cs.backgroundColor;
          // Border color fallback handling
          const borderColor = cs.borderColor && cs.borderColor !== 'rgba(0, 0, 0, 0)' ? cs.borderColor : cs.outlineColor;
          menu.style.border = `1px solid ${borderColor || '#ccc'}`;
          menu.style.color = cs.color;
          menu.style.fontSize = cs.fontSize;
          menu.style.lineHeight = cs.lineHeight;
        })();
        const mo = new MutationObserver(syncDisabled);
        mo.observe(certEl, { attributes: true, attributeFilter: ['disabled'] });
        syncDisabled();
      }
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
      // Prepare certificates formatting for backend (multi-select)
      let certificatesForBackend = [];
      let rawSelectedValues = [];
      if (certEl) {
        const selected = Array.from(certEl.selectedOptions || []).filter(o => (o.value || '').trim() !== '');
        // If 'none' is selected along with others, keep only 'none'
        const hasNone = selected.some(o => (o.value || '').trim() === 'none');
        const effective = hasNone ? selected.filter(o => (o.value || '').trim() === 'none') : selected;
        rawSelectedValues = effective.map(o => (o.value || '').trim());
        certificatesForBackend = effective.map(opt => {
          const raw = (opt.value || '').trim();
          const group = (opt.getAttribute('data-group') || '').toUpperCase();
          if (raw === 'none') return 'none';
          if (group === 'IELTS') {
            return raw ? `IELTS: ${raw}` : 'IELTS';
          } else if (group === 'TOEFL') {
            if (/^\d+-\d+$/.test(raw)) return `TOEFL: ${raw}`;
            return `TOEFL: ${raw}`;
          } else if (group === 'SAT') {
            if (/^\d+-\d+$/.test(raw)) return `SAT: ${raw}`;
            return `SAT: ${raw}`;
          } else if (group === 'AP') {
            return `AP: ${raw}`;
          } else if (group === 'ACT') {
            if (/^\d+-\d+$/.test(raw)) return `ACT: ${raw.split('-')[0]}`;
            return `ACT: ${raw}`;
          }
          return raw;
        });
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
        // Backward compatibility: keep single 'certificate' as joined string
        certificate: certificatesForBackend.length ? certificatesForBackend.join(', ') : '',
        // New field: send full list as array
        certificates: certificatesForBackend,
        favorite_subject: subjEl ? subjEl.value : '',
        daily_hours: selectedHours || null,
      };

      // Persist locally for instant UX
      try {
        // Store raw selected values as JSON array for proper UI restore (multi)
        localStorage.setItem('pref.certificate', JSON.stringify(rawSelectedValues));
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
