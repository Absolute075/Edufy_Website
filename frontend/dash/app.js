// Edufy App Controller - SPA and global interactions

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar elements (will be populated via partial)
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  function rebindSidebarControls() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    [sidebarToggle, mobileMenuBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        sidebar?.classList.toggle('active');
        sidebar?.classList.toggle('collapsed');
        mainContent?.classList.toggle('expanded');
      });
    });
  }

  function setActiveSidebarLink() {
    const page = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(a => {
      const dataPage = (a.getAttribute('data-page') || a.getAttribute('href') || '').toLowerCase();
      if (dataPage.endsWith(page)) a.classList.add('active');
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
      e.preventDefault();
      navigateTo(href, true);
    });

    window.addEventListener('popstate', () => {
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
      e.preventDefault();
      navigateTo(href, true);
    });
  }

  async function navigateTo(url, push) {
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
      setActiveSidebarLink();
      rebindSidebarControls();
      bindSidebarActions();
      try { window.dispatchEvent(new Event('edufy:rehydrate')); } catch {}
    } catch (_) {
      window.location.href = url;
    }
  }

  // Expose SPA navigate helper for scripts within pages
  window.spaNavigate = (u) => navigateTo(u, true);

  async function loadSidebarPartial() {
    try {
      const res = await fetch('sidebar-ultra.html', { cache: 'no-store' });
      if (res.ok) {
        const html = await res.text();
        if (sidebar) sidebar.innerHTML = html;
        setActiveSidebarLink();
        rebindSidebarControls();
        bindSidebarActions();
        initSpaNavigation();
        initContentLinkRouting();
        try { window.dispatchEvent(new Event('edufy:rehydrate')); } catch {}
      }
    } catch (_) {
      // Fallback: keep existing markup
      rebindSidebarControls();
      bindSidebarActions();
      initSpaNavigation();
      initContentLinkRouting();
      try { window.dispatchEvent(new Event('edufy:rehydrate')); } catch {}
    }
  }

  loadSidebarPartial();

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
    personalInputs.forEach(inp => inp.removeAttribute('readonly'));
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
    personalInputs?.forEach(inp => inp.setAttribute('readonly', true));
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
          setTimeout(() => { window.location.href = '../access/login.html'; }, 1000);
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

  // Initialize - Check if mobile
  function checkMobile() {
    if (window.innerWidth <= 1024) {
      sidebar?.classList.add('collapsed');
      mainContent?.classList.add('expanded');
    }
  }

  checkMobile();
  window.addEventListener('resize', checkMobile);
});
