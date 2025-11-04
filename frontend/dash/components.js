(function(){
  if (window.__edufyInit) {
    try { window.dispatchEvent(new Event('edufy:rehydrate')); } catch(e) {}
    return;
  }
  window.__edufyInit = true;
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  sidebarToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
  });

  // Optional: set active menu item based on hash or route
  (function() {
    const links = document.querySelectorAll(".menu-item");
    links.forEach(link => {
      link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 820) sidebar?.classList.remove("open");
      });
    });
  })();

// ----- Dashboard enhancements (mock data, role switching, charts) -----
const roleSelect = document.getElementById("roleSelect");

const mockData = {
  student: {
    kpis: { progress: 72, time: "5h 20m", thirdLabel: "Upcoming Tests", third: 3, thirdSub: "Next 7 days" },
    weeklyTime: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], data: [40,60,30,80,75,20,35] },
    scores: { labels: ["Listening","Reading","Writing","Speaking"], data: [82, 70, 66, 74] },
    courses: [
      { title: "IELTS Academic", subtitle: "Listening, Reading, Writing", cta: "Continue", primary: true },
      { title: "SAT Math", subtitle: "Algebra, Geometry, Data", cta: "Resume" },
      { title: "TOEFL Prep", subtitle: "Speaking drills", cta: "Resume" }
    ],
    activity: [
      { title: "Completed Reading Module 4", sub: "Today · 25m" },
      { title: "Practice Test: SAT Algebra", sub: "Yesterday · 40m" },
      { title: "Listening Quiz #3", sub: "Mon · Score 8/10" }
    ],
    profile: {
      username: "johndoe",
      email: "john@example.com",
      id: "USR-0001",
      bio: "Aspiring student preparing for IELTS and SAT. Loves math and podcasts.",
      dob: "2000-01-15",
      phone: "+1 (234) 567-8900",
      location: "New York, USA",
      certificates: [
        { type: "IELTS", name: "IELTS", issuer: "British Council", score: "Band 7.5", date: "2024-06-15" },
        { type: "SAT", name: "SAT", issuer: "College Board", score: "1450/1600", date: "2024-03-20" },
        { type: "TOEFL", name: "TOEFL", issuer: "ETS", score: "105/120", date: "2023-11-10" }
      ],
      avatar: "../templates/images/caesar.png"
    }
  },
  admin: {
    kpis: { progress: 86, time: "312 users", thirdLabel: "Active Courses", third: 18, thirdSub: "Across programs" },
    weeklyTime: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], data: [220,260,210,300,280,140,160] },
    scores: { labels: ["IELTS","SAT","TOEFL","AP Calc"], data: [78, 69, 74, 81] },
    courses: [
      { title: "Manage Cohorts", subtitle: "3 new enrollments", cta: "Open" },
      { title: "Pending Approvals", subtitle: "2 instructors", cta: "Review" },
      { title: "Reports", subtitle: "Weekly analytics", cta: "View" }
    ],
    activity: [
      { title: "New user registrations", sub: "Today · 12" },
      { title: "Course completion rate", sub: "This week · 74%" },
      { title: "Scheduled maintenance", sub: "Fri · 11:00 PM" }
    ]
  }
};

const els = {
  kpiProgress: document.getElementById("kpiProgress"),
  kpiProgressBar: document.getElementById("kpiProgressBar"),
  kpiTime: document.getElementById("kpiTime"),
  kpiThird: document.getElementById("kpiThird"),
  kpiThirdLabel: document.getElementById("kpiThirdLabel"),
  kpiThirdSub: document.getElementById("kpiThirdSub"),
  coursesList: document.getElementById("coursesList"),
  activityList: document.getElementById("activityList"),
  timeChart: document.getElementById("timeChart"),
  scoresChart: document.getElementById("scoresChart"),
  profileAvatarImg: document.getElementById("profileAvatarImg"),
  profileName: document.getElementById("profileName"),
  profileUsername: document.getElementById("profileUsername"),
  profileEmail: document.getElementById("profileEmail"),
  profileId: document.getElementById("profileId"),
  profileBio: document.getElementById("profileBio"),
};

let charts = { time: null, scores: null };

function renderKPIs(d) {
  if (!d) return;
  const { progress, time, third, thirdLabel, thirdSub } = d.kpis;
  if (els.kpiProgress) els.kpiProgress.textContent = `${progress}%`;
  if (els.kpiProgressBar) els.kpiProgressBar.style.width = `${progress}%`;
  if (els.kpiTime) els.kpiTime.textContent = time;
  if (els.kpiThirdLabel) els.kpiThirdLabel.textContent = thirdLabel;
  if (els.kpiThird) els.kpiThird.textContent = `${third}`;
  if (els.kpiThirdSub) els.kpiThirdSub.textContent = thirdSub || "";
}

function renderCourses(d) {
  if (!els.coursesList) return;
  els.coursesList.innerHTML = "";
  (d.courses || []).forEach(item => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div>
        <div class="title">${item.title}</div>
        <div class="muted">${item.subtitle || ""}</div>
      </div>
      <button class="btn ${item.primary ? "" : "ghost"}">${item.cta || "Open"}</button>
    `;
    els.coursesList.appendChild(div);
  });
}

function renderActivity(d) {
  if (!els.activityList) return;
  els.activityList.innerHTML = "";
  (d.activity || []).forEach(ev => {
    const li = document.createElement("div");
    li.className = "list-item";
    li.innerHTML = `
      <div>
        <div class="title">${ev.title}</div>
        <div class="muted">${ev.sub || ""}</div>
      </div>
    `;
    els.activityList.appendChild(li);
  });
}

function renderCharts(d) {
  // Guard if Chart not loaded yet
  if (typeof Chart === "undefined") return;
  // Destroy previous
  charts.time?.destroy();
  charts.scores?.destroy();

  if (els.timeChart) {
    charts.time = new Chart(els.timeChart.getContext("2d"), {
      type: "line",
      data: {
        labels: d.weeklyTime.labels,
        datasets: [{
          label: "Minutes",
          data: d.weeklyTime.data,
          borderColor: "#6c7afd",
          backgroundColor: "rgba(108,122,253,0.2)",
          tension: 0.35,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.06)" } },
          y: { grid: { color: "rgba(255,255,255,0.06)" } }
        }
      }
    });
  }

  if (els.scoresChart) {
    charts.scores = new Chart(els.scoresChart.getContext("2d"), {
      type: "bar",
      data: {
        labels: d.scores.labels,
        datasets: [{
          label: "Score",
          data: d.scores.data,
          backgroundColor: "#3944d6"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(255,255,255,0.06)" }, suggestedMax: 100 }
        }
      }
    });
  }
}

function renderRole(role) {
  const d = mockData[role] || mockData.student;
  renderKPIs(d);
  renderCourses(d);
  renderActivity(d);
  renderCharts(d);
  if (typeof renderProfile === 'function') {
    renderProfile(d);
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  const initialRole = roleSelect?.value || "student";
  renderRole(initialRole);
  initProfileForm();
  primeUserFromStorage();
  hydrateUserFromServer();
  fetchProfileFromServer();
});

// Re-hydrate on bfcache restores and forward/back navigations
window.addEventListener('pageshow', (event) => {
  // event.persisted indicates bfcache; but we can safely re-run always
  try { primeUserFromStorage(); } catch {}
  try { hydrateUserFromServer(); } catch {}
  try { fetchProfileFromServer(); } catch {}
});

// Re-hydrate on custom event when script is included again
window.addEventListener('edufy:rehydrate', () => {
  try { primeUserFromStorage(); } catch {}
  try { hydrateUserFromServer(); } catch {}
});

// Fetch real user info and override UI placeholders
async function hydrateUserFromServer() {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    if (!res.ok) return; // if 401, keep placeholders
    const me = await res.json();
    // Header username
    const headerName = document.querySelector('.header-username');
    if (headerName && me.username) headerName.textContent = me.username;
    // Greeting name
    const studentName = document.getElementById('studentName');
    if (studentName && me.username) studentName.textContent = me.username;
    // Profile inputs if present
    const profileUsernameInput = document.getElementById('profileUsernameInput') || document.getElementById('Username');
    const profileEmailInput = document.getElementById('profileEmailInput') || document.getElementById('email');
    const profileDisplayName = document.getElementById('profileDisplayName') || document.querySelector('.avatar-name');
    if (profileUsernameInput && me.username) profileUsernameInput.value = me.username;
    if (profileEmailInput && me.email) profileEmailInput.value = me.email;
    if (profileDisplayName && me.username) profileDisplayName.textContent = (profileDisplayName.classList?.contains('avatar-name') ? me.username : '@' + me.username);

    // Persist into profile storage so other pages pick it up
    try {
      const key = 'edufy.profile.v1';
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const updated = {
        ...existing,
        username: me.username || existing.username || '',
        email: me.email || existing.email || ''
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}

    // Trigger any dependent UI updates
    try { profileUsernameInput?.dispatchEvent(new Event('input')); } catch {}
    try { profileEmailInput?.dispatchEvent(new Event('input')); } catch {}
  } catch {}
}

// Load detailed profile data from server (includes birthDate)
async function fetchProfileFromServer() {
  try {
    const res = await fetch('/auth/profile', { credentials: 'include' });
    if (!res.ok) return;
    const p = await res.json();
    const dobInput = document.getElementById('profileDobInput');
    const phoneInput = document.getElementById('profilePhoneInput');
    const locationInput = document.getElementById('profileLocationInput');
    if (dobInput && p.birthDate) dobInput.value = String(p.birthDate);
    if (phoneInput && p.phone) phoneInput.value = p.phone;
    if (locationInput && p.lastLoginCountry) locationInput.value = p.lastLoginCountry;
    // persist birthDate into local storage profile cache
    try {
      const key = 'edufy.profile.v1';
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem(key, JSON.stringify({ ...existing, birthDate: p.birthDate || existing.birthDate }));
    } catch {}
  } catch {}
}

// Apply cached profile immediately to avoid flashes on navigation
function primeUserFromStorage() {
  try {
    const raw = localStorage.getItem('edufy.profile.v1');
    if (!raw) return;
    const me = JSON.parse(raw) || {};
    // Header username
    const headerName = document.querySelector('.header-username');
    if (headerName && me.username) headerName.textContent = me.username;
    // Greeting name
    const studentName = document.getElementById('studentName');
    if (studentName && me.username) studentName.textContent = me.username;
    // Profile inputs if present
    const profileUsernameInput = document.getElementById('profileUsernameInput') || document.getElementById('Username');
    const profileEmailInput = document.getElementById('profileEmailInput') || document.getElementById('email');
    const profileDisplayName = document.getElementById('profileDisplayName') || document.querySelector('.avatar-name');
    if (profileUsernameInput && me.username) profileUsernameInput.value = me.username;
    if (profileEmailInput && me.email) profileEmailInput.value = me.email;
    if (profileDisplayName && me.username) profileDisplayName.textContent = (profileDisplayName.classList?.contains('avatar-name') ? me.username : '@' + me.username);
  } catch {}
}

roleSelect?.addEventListener("change", (e) => {
  const r = e.target.value;
  renderRole(r);
});

// ---------------- Profile form logic ----------------
function getProfileStorageKey() { return "edufy.profile.v1"; }

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(getProfileStorageKey());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveProfileToStorage(p) {
  try { localStorage.setItem(getProfileStorageKey(), JSON.stringify(p)); } catch {}
}

function initProfileForm() {
  const form = document.getElementById("profileForm");
  if (!form) return; // not on profile page

  // Inputs
  const avatarImg = document.getElementById("profileAvatarImg");
  const avatarInput = document.getElementById("profileAvatarInput");
  const avatarChangeBtn = document.getElementById("avatarChangeBtn");
  const usernameInput = document.getElementById("profileUsernameInput");
  const emailInput = document.getElementById("profileEmailInput");
  const idBadge = document.getElementById("profileIdBadge");
  const dobInput = document.getElementById("profileDobInput");
  const ageDisplay = document.getElementById("profileAge");
  const phoneInput = document.getElementById("profilePhoneInput");
  const locationInput = document.getElementById("profileLocationInput");
  const bioInput = document.getElementById("profileBioInput");
  const certificatesList = document.getElementById("certificatesList");
  const addCertificateBtn = document.getElementById("addCertificateBtn");
  const saveBtn = document.getElementById("profileSaveBtn");
  const logoutBtn = document.getElementById("profileLogoutBtn");
  const toastEl = document.getElementById("profileToast");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const completionPercent = document.getElementById("completionPercent");
  const completionProgress = document.getElementById("completionProgress");
  const completionTip = document.getElementById("completionTip");
  const profileLevel = document.getElementById("profileLevel");
  const copyIdBtn = document.getElementById("copyIdBtn");
  const exportProfileBtn = document.getElementById("exportProfileBtn");
  const shareProfileBtn = document.getElementById("shareProfileBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const confettiCanvas = document.getElementById("confettiCanvas");

  // Defaults from mock
  const defaults = (mockData.student && mockData.student.profile) || {};
  const stored = loadProfileFromStorage();
  const profile = stored || {
    username: defaults.username || "",
    email: defaults.email || "",
    id: defaults.id || "USR-0001",
    bio: defaults.bio || "",
    dob: "",
    phone: "",
    location: "",
    certificates: [],
    avatar: defaults.avatar || "../templates/images/caesar.png",
  };

  // Populate
  if (avatarImg) avatarImg.src = profile.avatar;
  if (usernameInput) usernameInput.value = profile.username;
  if (emailInput) emailInput.value = profile.email;
  // Ensure ID exists; auto-generate once if missing
  if (!profile.id) {
    profile.id = `USR-${Date.now().toString().slice(-6)}`;
    saveProfileToStorage(profile);
  }
  if (idBadge) idBadge.textContent = profile.id;
  if (dobInput) dobInput.value = profile.dob || "";
  if (phoneInput) phoneInput.value = profile.phone || "";
  if (locationInput) locationInput.value = profile.location || "";
  if (bioInput) bioInput.value = profile.bio;
  
  // Calculate and display age
  function updateAge() {
    if (!dobInput || !dobInput.value || !ageDisplay) return;
    const dob = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    ageDisplay.textContent = age > 0 ? `${age} years old` : "";
  }
  updateAge();
  dobInput?.addEventListener("change", updateAge);

  // Certificate type icons
  const certIcons = {
    'IELTS': '🇬🇧',
    'TOEFL': '🇺🇸',
    'SAT': '📚',
    'ACT': '📖',
    'GRE': '🎓',
    'GMAT': '💼',
    'AP': '🏅',
    'PTE': '🗣️',
    'Duolingo': '🦉',
    'Cambridge': '🎯',
    'Other': '📄'
  };

  // Profile completion tracker with tips
  let lastPercent = 0;
  function calculateCompletion() {
    const fields = [
      usernameInput?.value?.trim(),
      emailInput?.value?.trim(),
      phoneInput?.value?.trim(),
      locationInput?.value?.trim(),
      dobInput?.value,
      bioInput?.value?.trim(),
      profile.certificates?.length > 0
    ];
    const filled = fields.filter(f => f).length;
    const percent = Math.round((filled / fields.length) * 100);
    
    if (completionPercent) completionPercent.textContent = `${percent}%`;
    if (completionProgress) completionProgress.style.width = `${percent}%`;
    
    // Update tip
    if (completionTip) {
      if (percent < 50) {
        completionTip.textContent = 'Add more details to unlock features!';
      } else if (percent < 80) {
        completionTip.textContent = 'Almost there! Fill remaining fields.';
      } else if (percent < 100) {
        completionTip.textContent = 'One more step to complete profile!';
      } else {
        completionTip.textContent = 'Profile complete! You\'re all set!';
      }
    }
    
    // Update level
    if (profileLevel) {
      if (percent < 30) {
        profileLevel.textContent = '🌟 Beginner';
        profileLevel.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
        profileLevel.style.borderColor = '#9ca3af';
        profileLevel.style.boxShadow = '0 4px 12px rgba(107,114,128,0.3)';
      } else if (percent < 60) {
        profileLevel.textContent = '🔥 Active';
        profileLevel.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        profileLevel.style.borderColor = '#fbbf24';
        profileLevel.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
      } else if (percent < 100) {
        profileLevel.textContent = '💎 Advanced';
        profileLevel.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        profileLevel.style.borderColor = '#60a5fa';
        profileLevel.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
      } else {
        profileLevel.textContent = '👑 Expert';
        profileLevel.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        profileLevel.style.borderColor = '#a78bfa';
        profileLevel.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)';
      }
    }
    
    // Confetti on 100%
    if (percent === 100 && lastPercent < 100) {
      launchConfetti();
    }
    lastPercent = percent;
  }

  // Update display name
  function updateDisplayName() {
    const username = usernameInput?.value?.trim();
    if (profileDisplayName && username) {
      profileDisplayName.textContent = `@${username}`;
    }
  }

  // Wire live updates
  [usernameInput, emailInput, phoneInput, locationInput, dobInput, bioInput].forEach(input => {
    input?.addEventListener("input", () => {
      calculateCompletion();
      updateDisplayName();
    });
  });
  
  calculateCompletion();
  updateDisplayName();

  // Copy ID functionality
  copyIdBtn?.addEventListener('click', async () => {
    const id = idBadge?.textContent;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      const originalIcon = copyIdBtn.querySelector('.copy-icon').textContent;
      copyIdBtn.querySelector('.copy-icon').textContent = '✅';
      showToast('ID copied to clipboard!', 'success');
      setTimeout(() => {
        copyIdBtn.querySelector('.copy-icon').textContent = originalIcon;
      }, 2000);
    } catch (err) {
      showToast('Failed to copy ID', 'error');
    }
  });

  // Export profile
  exportProfileBtn?.addEventListener('click', () => {
    const data = {
      username: usernameInput?.value,
      email: emailInput?.value,
      phone: phoneInput?.value,
      location: locationInput?.value,
      dob: dobInput?.value,
      bio: bioInput?.value,
      certificates: profile.certificates
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.username || 'profile'}_edufy.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Profile exported successfully!', 'success');
  });

  // Share profile
  shareProfileBtn?.addEventListener('click', async () => {
    const shareData = {
      title: 'My Edufy Profile',
      text: `Check out my Edufy profile: @${usernameInput?.value || 'student'}`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast('Profile shared!', 'success');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Profile link copied to clipboard!', 'success');
      }
    } catch (err) {
      showToast('Unable to share', 'error');
    }
  });

  // Settings quick action
  settingsBtn?.addEventListener('click', () => {
    window.location.href = 'settings.html';
  });

  // Confetti animation
  function launchConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    const W = confettiCanvas.width = window.innerWidth;
    const H = confettiCanvas.height = window.innerHeight;
    const pieces = [];
    const colors = ['#4f46e5', '#60a5fa', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
    
    for (let i = 0; i < 100; i++) {
      pieces.push({
        x: Math.random() * W,
        y: Math.random() * H - H,
        r: Math.random() * 6 + 4,
        d: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10
      });
    }
    
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      update();
    }
    
    function update() {
      let active = false;
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.y += p.d;
        p.x += Math.sin(p.y / 50) * 2;
        if (p.y < H) active = true;
      }
      if (active) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    }
    
    draw();
    showToast('🎉 Profile 100% Complete!', 'success');
  }

  // Modal elements
  const modal = document.getElementById("certificateModal");
  const certTypeSelect = document.getElementById("certTypeSelect");
  const customCertNameField = document.getElementById("customCertNameField");
  const customCertName = document.getElementById("customCertName");
  const certScore = document.getElementById("certScore");
  const certIssuer = document.getElementById("certIssuer");
  const certDate = document.getElementById("certDate");
  const saveCertBtn = document.getElementById("saveCertBtn");
  const cancelCertBtn = document.getElementById("cancelCertBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

  // Show/hide custom name field when "Other" is selected
  certTypeSelect?.addEventListener("change", () => {
    if (certTypeSelect.value === "Other") {
      customCertNameField.style.display = "grid";
    } else {
      customCertNameField.style.display = "none";
    }
  });

  // Render certificates
  function renderCertificates() {
    if (!certificatesList) return;
    certificatesList.innerHTML = "";
    if (!profile.certificates || profile.certificates.length === 0) {
      certificatesList.innerHTML = '<p class="field-hint">No certificates added yet. Click "+ Add Certificate" to get started.</p>';
      calculateCompletion();
      return;
    }
    (profile.certificates || []).forEach((cert, idx) => {
      const div = document.createElement("div");
      div.className = "certificate-item";
      const icon = certIcons[cert.type] || certIcons['Other'];
      const scoreBadge = cert.score ? `<span class="certificate-score">${cert.score}</span>` : "";
      const dateBadge = cert.date ? `<span class="certificate-date">📅 ${new Date(cert.date).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})}</span>` : "";
      div.innerHTML = `
        <div class="certificate-info">
          <div class="certificate-header">
            <span class="certificate-type-icon">${icon}</span>
            <span class="certificate-name">${cert.name}</span>
            <span class="certificate-type-badge">${cert.type}</span>
          </div>
          <div class="certificate-meta">
            <span class="certificate-issuer">🏛️ ${cert.issuer}</span>
            ${scoreBadge}
            ${dateBadge}
          </div>
        </div>
        <div class="certificate-actions">
          <button type="button" class="btn-icon danger" data-idx="${idx}">Delete</button>
        </div>
      `;
      certificatesList.appendChild(div);
    });
    // Wire delete
    certificatesList.querySelectorAll(".btn-icon.danger").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (confirm(`Delete ${profile.certificates[idx].name}?`)) {
          profile.certificates.splice(idx, 1);
          renderCertificates();
          calculateCompletion();
          showToast("Certificate deleted. Click Save to persist.", "success");
        }
      });
    });
  }
  renderCertificates();

  // Toast notification helper
  function showToast(msg, type = "success") {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = `toast ${type}`;
    toastEl.style.display = "block";
    setTimeout(() => {
      toastEl.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        toastEl.style.display = "none";
        toastEl.style.animation = "";
      }, 300);
    }, 3000);
  }

  // Wire Change button to file input
  avatarChangeBtn?.addEventListener("click", () => {
    avatarInput?.click();
  });

  // Avatar preview
  avatarInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be less than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      avatarImg.src = reader.result;
      showToast("Avatar updated. Click Save to keep changes.", "success");
    };
    reader.readAsDataURL(file);
  });

  // Open modal
  addCertificateBtn?.addEventListener("click", () => {
    if (modal) modal.style.display = "flex";
    // Reset form
    if (certTypeSelect) certTypeSelect.value = "";
    if (customCertName) customCertName.value = "";
    if (certScore) certScore.value = "";
    if (certIssuer) certIssuer.value = "";
    if (certDate) certDate.value = "";
    if (customCertNameField) customCertNameField.style.display = "none";
  });

  // Close modal
  function closeModal() {
    if (modal) modal.style.display = "none";
  }
  closeModalBtn?.addEventListener("click", closeModal);
  cancelCertBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Save certificate
  saveCertBtn?.addEventListener("click", () => {
    const type = certTypeSelect?.value;
    if (!type) {
      showToast("Please select a certificate type", "error");
      return;
    }
    let certName = type;
    if (type === "Other") {
      certName = customCertName?.value.trim();
      if (!certName) {
        showToast("Please enter certificate name", "error");
        return;
      }
    }
    const issuer = certIssuer?.value.trim() || "Not specified";
    profile.certificates = profile.certificates || [];
    profile.certificates.push({
      type: type,
      name: certName,
      issuer: issuer,
      score: certScore?.value.trim() || "",
      date: certDate?.value || ""
    });
    renderCertificates();
    calculateCompletion();
    closeModal();
    showToast("Certificate added. Click Save to persist.", "success");
  });

  function validate() {
    if (!usernameInput?.value?.trim()) {
      return { ok: false, msg: "Username is required" };
    }
    if (emailInput && emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      return { ok: false, msg: "Invalid email format" };
    }
    if (phoneInput && phoneInput.value && !/^\+?[0-9\-\s()]{7,20}$/.test(phoneInput.value)) {
      return { ok: false, msg: "Invalid phone number" };
    }
    return { ok: true };
  }

  saveBtn?.addEventListener("click", () => {
    const v = validate();
    if (!v.ok) {
      showToast(v.msg, "error");
      return;
    }
    const dataUrl = avatarImg?.src || profile.avatar;
    const toSave = {
      username: usernameInput?.value.trim() || "",
      email: emailInput?.value.trim() || "",
      id: idBadge?.textContent || "",
      bio: bioInput?.value.trim() || "",
      dob: dobInput?.value || "",
      phone: phoneInput?.value.trim() || "",
      location: locationInput?.value.trim() || "",
      certificates: profile.certificates || [],
      avatar: dataUrl,
    };
    profile.certificates = toSave.certificates;
    saveProfileToStorage(toSave);
    // Send to backend
    try {
      const payload = {
        birthDate: dobInput?.value || '',
        phone: phoneInput?.value || '',
        location: locationInput?.value || ''
      };
      fetch('/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      }).then(r => r.ok ? r.json() : null).then(() => {
        // refresh from server to be sure
        fetchProfileFromServer();
        showToast("✅ Profile saved successfully!", "success");
      });
    } catch {
      showToast("✅ Profile saved locally.", "success");
    }
  });

  logoutBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      showToast("Logging out...", "success");
      setTimeout(() => {
        window.location.href = "../access/login.html";
      }, 800);
    }
  });
}

})();