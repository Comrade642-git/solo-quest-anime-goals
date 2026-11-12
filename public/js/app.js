// Solo Quest - Application Controller & State Management
document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    user: null,
    date: new Date().toISOString().split('T')[0],
    goals: [],
    dayStatus: null,
    categoryFilter: 'all',
    activeTab: 'quests'
  };

  // DOM Elements
  const el = {
    themeSelect: document.getElementById('theme-select'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    btnHunterProfile: document.getElementById('btn-hunter-profile'),

    // Hunter profile
    hunterAvatar: document.getElementById('hunter-avatar-img'),
    rankBadge: document.getElementById('rank-badge'),
    hunterName: document.getElementById('hunter-name'),
    rankTitle: document.getElementById('rank-title'),
    rankName: document.getElementById('rank-name'),
    streakCount: document.getElementById('streak-count'),
    hunterLevel: document.getElementById('hunter-level'),
    hunterXpLabel: document.getElementById('hunter-xp-label'),
    hunterXpPercent: document.getElementById('hunter-xp-percent'),
    hunterXpBar: document.getElementById('hunter-xp-bar'),

    // Tabs
    tabQuestsBtn: document.getElementById('tab-quests-btn'),
    tabHistoryBtn: document.getElementById('tab-history-btn'),
    tabLeaderboardBtn: document.getElementById('tab-leaderboard-btn'),
    tabQuestsContent: document.getElementById('tab-quests-content'),
    tabHistoryContent: document.getElementById('tab-history-content'),
    tabLeaderboardContent: document.getElementById('tab-leaderboard-content'),

    // Quest Section
    dateLabel: document.getElementById('date-label'),
    questDatePicker: document.getElementById('quest-date-picker'),
    btnPrevDay: document.getElementById('btn-prev-day'),
    btnNextDay: document.getElementById('btn-next-day'),
    btnAddQuest: document.getElementById('btn-add-quest'),
    questCompletionCount: document.getElementById('quest-completion-count'),
    questCompletionPercent: document.getElementById('quest-completion-percent'),
    questProgressBar: document.getElementById('quest-progress-bar'),
    questListContainer: document.getElementById('quest-list-container'),
    btnRestoreDefaults: document.getElementById('btn-restore-defaults'),

    // Modals
    modalQuest: document.getElementById('modal-quest'),
    modalQuestTitle: document.getElementById('modal-quest-title'),
    formQuest: document.getElementById('form-quest'),
    questIdInput: document.getElementById('quest-id-input'),
    questTitleInput: document.getElementById('quest-title-input'),
    questDescInput: document.getElementById('quest-desc-input'),
    questCatInput: document.getElementById('quest-cat-input'),
    questXpInput: document.getElementById('quest-xp-input'),
    btnCloseQuestModal: document.getElementById('btn-close-quest-modal'),
    btnCancelQuest: document.getElementById('btn-cancel-quest'),

    modalAuth: document.getElementById('modal-auth'),
    btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
    quickHuntersList: document.getElementById('quick-hunters-list'),
    authTabLogin: document.getElementById('auth-tab-login'),
    authTabRegister: document.getElementById('auth-tab-register'),
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    regUsername: document.getElementById('reg-username'),
    regDisplay: document.getElementById('reg-display'),
    regPassword: document.getElementById('reg-password'),

    modalCelebrate: document.getElementById('modal-celebrate'),
    btnCloseCelebrate: document.getElementById('btn-close-celebrate'),

    // Heatmap & Leaderboard
    heatmapGrid: document.getElementById('heatmap-grid'),
    heatmapTooltip: document.getElementById('heatmap-tooltip'),
    statDaysTracked: document.getElementById('stat-days-tracked'),
    statPerfectDays: document.getElementById('stat-perfect-days'),
    statTotalQuests: document.getElementById('stat-total-quests'),
    statBestStreak: document.getElementById('stat-best-streak'),
    leaderboardTableBody: document.getElementById('leaderboard-table-body'),
    countdownTimer: document.getElementById('countdown-timer')
  };

  // Category Icon & Color Mapping
  const categoryMeta = {
    Strength: { color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: '⚔️' },
    Agility: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: '⚡' },
    Intelligence: { color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30', icon: '🧠' },
    Vitality: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', icon: '🌿' },
    Discipline: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: '🎯' },
    Spirit: { color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: '✨' }
  };

  // Avatar Icons
  const avatarMeta = {
    jinwoo: { label: 'Sung Jin-Woo', emoji: '⚔️', bg: 'bg-indigo-900 text-cyan-300' },
    cyberpunk: { label: 'Cyber Ninja', emoji: '⚡', bg: 'bg-pink-900 text-rose-300' },
    hashira: { label: 'Flame Hashira', emoji: '🔥', bg: 'bg-amber-900 text-orange-300' },
    ghibli: { label: 'Valley Wanderer', emoji: '🍃', bg: 'bg-emerald-900 text-emerald-300' }
  };

  // --- INITIALIZATION ---
  async function init() {
    updateCountdown();
    setInterval(updateCountdown, 60000);

    // Initialize Date picker with today
    el.questDatePicker.value = state.date;

    // Check saved theme
    const savedTheme = localStorage.getItem('quest_theme') || 'monarch';
    setTheme(savedTheme);
    el.themeSelect.value = savedTheme;

    // Check sound state
    updateSoundIcon();

    // Check login or auto-login with default hunter
    try {
      if (API.getToken()) {
        const me = await API.getMe();
        state.user = me;
      } else {
        // Auto sign-in to demo hunter 'jinwoo'
        const res = await API.login({ username: 'jinwoo', password: 'hunter123' });
        API.setToken(res.token);
        state.user = res.user;
      }
    } catch (err) {
      console.warn('Initial auth check fell back to hunter login:', err);
      try {
        const res = await API.login({ username: 'jinwoo', password: 'hunter123' });
        API.setToken(res.token);
        state.user = res.user;
      } catch (e) {
        openAuthModal();
      }
    }

    if (state.user) {
      updateHunterHUD(state.user);
      await loadQuestsForDate(state.date);
    }

    setupEventListeners();
    refreshIcons();
  }

  // --- THEME & SOUND ---
  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('quest_theme', theme);
    if (state.user) {
      API.updateProfile({ theme }).catch(() => {});
    }
  }

  function updateSoundIcon() {
    if (window.animeAudio.enabled) {
      el.soundIcon.setAttribute('data-lucide', 'volume-2');
      el.btnSoundToggle.classList.add('text-cyan-400');
      el.btnSoundToggle.classList.remove('text-slate-500');
    } else {
      el.soundIcon.setAttribute('data-lucide', 'volume-x');
      el.btnSoundToggle.classList.add('text-slate-500');
      el.btnSoundToggle.classList.remove('text-cyan-400');
    }
    refreshIcons();
  }

  // --- REFRESH HUNTER PROFILE HUD ---
  function updateHunterHUD(user) {
    if (!user) return;
    el.hunterName.textContent = user.display_name || user.username;
    
    const info = user.levelInfo || { level: 1, currentLevelXP: 0, nextLevelXP: 200, progressPercent: 0, rank: 'E-Rank Novice', title: 'Awakened Hunter', rankBadge: 'E', rankColor: '#94a3b8' };
    el.hunterLevel.textContent = info.level;
    el.rankTitle.textContent = info.title;
    el.rankName.textContent = info.rank;
    el.rankBadge.textContent = info.rankBadge;
    el.rankBadge.style.borderColor = info.rankColor;
    el.rankBadge.style.boxShadow = `0 0 15px ${info.rankColor}`;

    el.hunterXpLabel.textContent = `${info.currentLevelXP.toLocaleString()} / ${info.nextLevelXP.toLocaleString()} XP`;
    el.hunterXpPercent.textContent = `${info.progressPercent}%`;
    el.hunterXpBar.style.width = `${info.progressPercent}%`;

    el.streakCount.textContent = `${user.current_streak || 0} Days Active Streak`;

    // Avatar
    const av = avatarMeta[user.avatar] || avatarMeta['jinwoo'];
    el.hunterAvatar.textContent = av.emoji;
  }

  // --- LOAD QUESTS FOR TARGET DATE ---
  async function loadQuestsForDate(dateStr) {
    try {
      const data = await API.getTodayGoals(dateStr);
      state.dayStatus = data;
      state.goals = data.goals || [];

      // Update HUD level/streak if returned
      if (data.userLevel && state.user) {
        state.user.levelInfo = data.userLevel;
        state.user.current_streak = data.currentStreak;
        updateHunterHUD(state.user);
      }

      renderDateLabel(dateStr);
      renderQuestProgress(data);
      renderQuestCards();
    } catch (err) {
      console.error('Failed to load quests:', err);
    }
  }

  function renderDateLabel(dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) {
      el.dateLabel.textContent = 'TODAY';
    } else {
      el.dateLabel.textContent = dateStr;
    }
  }

  function renderQuestProgress(data) {
    const total = data.totalGoals || 0;
    const completed = data.completedCount || 0;
    const rate = data.completionRate || 0;

    el.questCompletionCount.textContent = `${completed} / ${total} Objectives Complete`;
    el.questCompletionPercent.textContent = `${rate}%`;
    el.questProgressBar.style.width = `${rate}%`;
  }

  // --- RENDER QUEST CARDS ---
  function renderQuestCards() {
    el.questListContainer.innerHTML = '';

    const filtered = state.goals.filter(g => {
      if (state.categoryFilter === 'all') return true;
      return (g.category || '').toLowerCase() === state.categoryFilter.toLowerCase();
    });

    if (filtered.length === 0) {
      el.questListContainer.innerHTML = `
        <div class="anime-card p-8 text-center border-dashed border-slate-700">
          <p class="text-slate-400 text-sm">No daily quests found in this category.</p>
          <button id="btn-empty-add" class="mt-3 px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition">
            + Forge a New Quest Objective
          </button>
        </div>
      `;
      document.getElementById('btn-empty-add')?.addEventListener('click', openAddQuestModal);
      return;
    }

    filtered.forEach((quest) => {
      const isCompleted = !!quest.completed;
      const meta = categoryMeta[quest.category] || categoryMeta['Discipline'];

      const card = document.createElement('div');
      card.className = `anime-card p-4 flex items-center justify-between gap-3 quest-item ${isCompleted ? 'is-completed' : ''}`;
      card.dataset.id = quest.id;

      card.innerHTML = `
        <div class="flex items-center gap-3.5 flex-1 min-w-0">
          <input type="checkbox" class="quest-checkbox" ${isCompleted ? 'checked' : ''} data-id="${quest.id}" title="Mark completed">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="hud-tag text-[10px] ${meta.color}">
                <span>${meta.icon}</span>
                <span>${quest.category}</span>
              </span>
              <span class="text-xs font-mono font-bold text-amber-400">+${quest.xp_reward} XP</span>
            </div>
            <h4 class="quest-title text-sm font-semibold text-slate-100 mt-1 truncate">${escapeHtml(quest.title)}</h4>
            ${quest.description ? `<p class="text-xs text-slate-400 mt-0.5 line-clamp-1">${escapeHtml(quest.description)}</p>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button class="btn-edit-quest p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition" data-id="${quest.id}" title="Edit quest">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button class="btn-delete-quest p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition" data-id="${quest.id}" title="Delete quest">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      el.questListContainer.appendChild(card);
    });

    refreshIcons();
    attachQuestCardEvents();
  }

  function attachQuestCardEvents() {
    // Checkbox toggles
    document.querySelectorAll('.quest-checkbox').forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const goalId = e.target.dataset.id;
        const card = e.target.closest('.quest-item');
        
        try {
          const res = await API.toggleGoal(goalId, state.date);
          const completed = res.toggle.completed;

          // Sound effect
          if (completed) {
            window.animeAudio.playQuestComplete();
            spawnXpPopup(card, `+${res.toggle.xpChanged} XP!`);
          } else {
            window.animeAudio.playQuestUncheck();
          }

          // Update user level state
          if (res.toggle.userLevel) {
            const oldLevel = state.user.levelInfo?.level || 1;
            state.user.levelInfo = res.toggle.userLevel;
            state.user.current_streak = res.toggle.currentStreak;
            updateHunterHUD(state.user);

            // Level up fanfare check!
            if (res.toggle.userLevel.level > oldLevel) {
              window.animeAudio.playLevelUp();
              triggerCelebrationConfetti();
            }
          }

          // Check if user completed 100% of today's trials!
          if (res.allCompletedJustNow) {
            window.animeAudio.playAllCompleted();
            triggerCelebrationConfetti();
            openCelebrateModal();
          }

          await loadQuestsForDate(state.date);
        } catch (err) {
          console.error('Failed to toggle goal:', err);
          e.target.checked = !e.target.checked;
        }
      });
    });

    // Edit quest
    document.querySelectorAll('.btn-edit-quest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const goalId = e.currentTarget.dataset.id;
        const quest = state.goals.find(g => g.id === goalId);
        if (quest) {
          openEditQuestModal(quest);
        }
      });
    });

    // Delete quest
    document.querySelectorAll('.btn-delete-quest').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const goalId = e.currentTarget.dataset.id;
        if (confirm('Are you sure you want to dismiss this quest objective?')) {
          try {
            await API.deleteGoal(goalId);
            window.animeAudio.playClick();
            await loadQuestsForDate(state.date);
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });
  }

  // --- FLOATING XP POPUP ANIMATION ---
  function spawnXpPopup(element, text) {
    const rect = element.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'floating-xp-popup text-xs';
    popup.textContent = text;
    popup.style.left = `${rect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top + window.scrollY}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
  }

  // --- CELEBRATION CONFETTI ---
  function triggerCelebrationConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#c084fc', '#facc15', '#f43f5e']
      });
    }
  }

  // --- HEATMAP & HISTORY TAB ---
  async function loadHeatmap() {
    try {
      const data = await API.getHeatmap(30);
      el.heatmapGrid.innerHTML = '';

      data.history.forEach((h) => {
        const cell = document.createElement('div');
        cell.className = `heat-cell heat-${h.level}`;
        cell.title = `${h.date} (${h.dayOfWeek}): ${h.completedCount}/${h.totalGoals} objectives cleared (${h.rate}%)`;

        cell.addEventListener('mouseenter', () => {
          el.heatmapTooltip.textContent = `📅 ${h.date} (${h.dayOfWeek}): ${h.completedCount}/${h.totalGoals} cleared (${h.rate}%)`;
        });

        cell.addEventListener('click', () => {
          state.date = h.date;
          el.questDatePicker.value = h.date;
          switchTab('quests');
          loadQuestsForDate(h.date);
        });

        el.heatmapGrid.appendChild(cell);
      });

      // Stats
      el.statDaysTracked.textContent = data.summary.daysTracked;
      el.statPerfectDays.textContent = data.summary.perfectDays;
      el.statTotalQuests.textContent = data.summary.totalQuestsCompleted;
      el.statBestStreak.textContent = `🔥 ${data.summary.bestStreak}`;
    } catch (err) {
      console.error('Heatmap load error:', err);
    }
  }

  // --- LEADERBOARD TAB ---
  async function loadLeaderboard() {
    try {
      const data = await API.getLeaderboard();
      el.leaderboardTableBody.innerHTML = '';

      data.leaderboard.forEach((hunter, idx) => {
        const tr = document.createElement('tr');
        tr.className = hunter.isCurrent ? 'bg-cyan-500/10' : 'hover:bg-slate-800/40';

        const av = avatarMeta[hunter.avatar] || avatarMeta['jinwoo'];

        tr.innerHTML = `
          <td class="py-3 px-3 font-orbitron font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}">
            #${idx + 1}
          </td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              <span class="text-base">${av.emoji}</span>
              <span class="font-bold text-white">${escapeHtml(hunter.display_name)}</span>
              ${hunter.isCurrent ? '<span class="hud-tag text-[9px]">YOU</span>' : ''}
            </div>
          </td>
          <td class="py-3 px-3">
            <span class="hud-tag text-[10px]" style="border-color:${hunter.levelInfo.rankColor}; color:${hunter.levelInfo.rankColor}">${hunter.levelInfo.rankBadge} • ${hunter.levelInfo.rank}</span>
          </td>
          <td class="py-3 px-3 font-orbitron text-cyan-300 font-semibold">
            Lv. ${hunter.levelInfo.level}
          </td>
          <td class="py-3 px-3 font-semibold text-amber-400">
            🔥 ${hunter.current_streak} Days
          </td>
          <td class="py-3 px-3">
            ${hunter.isCurrent ? '<span class="text-slate-500 text-[11px]">Active</span>' : `
              <button class="btn-switch-to-hunter text-cyan-400 hover:underline font-semibold" data-id="${hunter.id}">
                Switch To
              </button>
            `}
          </td>
        `;

        el.leaderboardTableBody.appendChild(tr);
      });

      document.querySelectorAll('.btn-switch-to-hunter').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const userId = e.currentTarget.dataset.id;
          await switchUser(userId);
          switchTab('quests');
        });
      });
    } catch (err) {
      console.error('Leaderboard load error:', err);
    }
  }

  // --- MODAL CONTROLS ---
  function openAddQuestModal() {
    el.modalQuestTitle.textContent = 'FORGE DAILY QUEST';
    el.questIdInput.value = '';
    el.questTitleInput.value = '';
    el.questDescInput.value = '';
    el.questCatInput.value = 'Discipline';
    el.questXpInput.value = '50';
    el.modalQuest.classList.remove('hidden');
    el.questTitleInput.focus();
  }

  function openEditQuestModal(quest) {
    el.modalQuestTitle.textContent = 'CALIBRATE DAILY QUEST';
    el.questIdInput.value = quest.id;
    el.questTitleInput.value = quest.title;
    el.questDescInput.value = quest.description || '';
    el.questCatInput.value = quest.category || 'Discipline';
    el.questXpInput.value = quest.xp_reward || '50';
    el.modalQuest.classList.remove('hidden');
  }

  function closeQuestModal() {
    el.modalQuest.classList.add('hidden');
  }

  async function openAuthModal() {
    try {
      const hunters = await API.getHunters();
      el.quickHuntersList.innerHTML = '';

      hunters.forEach(h => {
        const av = avatarMeta[h.avatar] || avatarMeta['jinwoo'];
        const isCurrent = state.user && state.user.id === h.id;

        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-2 rounded-lg border ${isCurrent ? 'bg-cyan-500/10 border-cyan-400' : 'bg-slate-800/60 border-slate-700'} hover:border-cyan-400 cursor-pointer transition`;
        row.innerHTML = `
          <div class="flex items-center gap-2.5">
            <span class="text-xl">${av.emoji}</span>
            <div>
              <p class="font-bold text-white text-xs">${escapeHtml(h.display_name)} <span class="text-slate-400 font-normal">(@${escapeHtml(h.username)})</span></p>
              <p class="text-[10px] text-cyan-300">Level ${h.levelInfo.level} • ${h.levelInfo.rankBadge} ${h.levelInfo.rank}</p>
            </div>
          </div>
          <button class="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] hover:bg-cyan-500/40">
            ${isCurrent ? 'Active Aura' : 'Select'}
          </button>
        `;

        row.addEventListener('click', async () => {
          await switchUser(h.id);
          closeAuthModal();
        });

        el.quickHuntersList.appendChild(row);
      });
    } catch (e) {
      console.warn('Failed to populate quick hunters list:', e);
    }

    el.modalAuth.classList.remove('hidden');
  }

  function closeAuthModal() {
    el.modalAuth.classList.add('hidden');
  }

  function openCelebrateModal() {
    el.modalCelebrate.classList.remove('hidden');
  }

  function closeCelebrateModal() {
    el.modalCelebrate.classList.add('hidden');
  }

  async function switchUser(userId) {
    try {
      const res = await API.switchHunter(userId);
      API.setToken(res.token);
      state.user = res.user;
      updateHunterHUD(state.user);
      if (res.user.theme) {
        setTheme(res.user.theme);
        el.themeSelect.value = res.user.theme;
      }
      window.animeAudio.playTone(660, 'sine', 0.2, 0.15, 0);
      await loadQuestsForDate(state.date);
    } catch (err) {
      alert(err.message);
    }
  }

  // --- TAB SWITCHING ---
  function switchTab(tabKey) {
    state.activeTab = tabKey;

    el.tabQuestsContent.classList.add('hidden');
    el.tabHistoryContent.classList.add('hidden');
    el.tabLeaderboardContent.classList.add('hidden');

    el.tabQuestsBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg font-rajdhani font-bold text-sm tracking-wide bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white transition';
    el.tabHistoryBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg font-rajdhani font-bold text-sm tracking-wide bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white transition';
    el.tabLeaderboardBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg font-rajdhani font-bold text-sm tracking-wide bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white transition';

    const activeStyle = 'flex items-center gap-2 px-4 py-2 rounded-lg font-rajdhani font-bold text-sm tracking-wide bg-cyan-500/20 border border-cyan-400 text-cyan-300 transition';

    if (tabKey === 'quests') {
      el.tabQuestsContent.classList.remove('hidden');
      el.tabQuestsBtn.className = activeStyle;
    } else if (tabKey === 'history') {
      el.tabHistoryContent.classList.remove('hidden');
      el.tabHistoryBtn.className = activeStyle;
      loadHeatmap();
    } else if (tabKey === 'leaderboard') {
      el.tabLeaderboardContent.classList.remove('hidden');
      el.tabLeaderboardBtn.className = activeStyle;
      loadLeaderboard();
    }

    refreshIcons();
  }

  // --- COUNTDOWN TIMER ---
  function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (el.countdownTimer) {
      el.countdownTimer.textContent = `${hours}h ${mins}m`;
    }
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Theme Selector
    el.themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
      window.animeAudio.playClick();
    });

    // Sound toggle
    el.btnSoundToggle.addEventListener('click', () => {
      window.animeAudio.toggle();
      updateSoundIcon();
    });

    // Hunter Profile / Switch modal
    el.btnHunterProfile.addEventListener('click', openAuthModal);
    el.btnCloseAuthModal.addEventListener('click', closeAuthModal);

    // Tab buttons
    el.tabQuestsBtn.addEventListener('click', () => switchTab('quests'));
    el.tabHistoryBtn.addEventListener('click', () => switchTab('history'));
    el.tabLeaderboardBtn.addEventListener('click', () => switchTab('leaderboard'));

    // Category filters
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill').forEach(p => {
          p.classList.remove('active', 'border-cyan-400', 'bg-cyan-500/20', 'text-cyan-300');
          p.classList.add('border-slate-700', 'bg-slate-800/40', 'text-slate-400');
        });
        pill.classList.add('active', 'border-cyan-400', 'bg-cyan-500/20', 'text-cyan-300');
        pill.classList.remove('border-slate-700', 'bg-slate-800/40', 'text-slate-400');
        
        state.categoryFilter = pill.dataset.cat;
        window.animeAudio.playClick();
        renderQuestCards();
      });
    });

    // Date navigation
    el.questDatePicker.addEventListener('change', (e) => {
      state.date = e.target.value;
      loadQuestsForDate(state.date);
    });

    el.btnPrevDay.addEventListener('click', () => {
      const cur = new Date(state.date);
      cur.setDate(cur.getDate() - 1);
      state.date = cur.toISOString().split('T')[0];
      el.questDatePicker.value = state.date;
      loadQuestsForDate(state.date);
    });

    el.btnNextDay.addEventListener('click', () => {
      const cur = new Date(state.date);
      cur.setDate(cur.getDate() + 1);
      state.date = cur.toISOString().split('T')[0];
      el.questDatePicker.value = state.date;
      loadQuestsForDate(state.date);
    });

    // Add Quest Modal
    el.btnAddQuest.addEventListener('click', openAddQuestModal);
    el.btnCloseQuestModal.addEventListener('click', closeQuestModal);
    el.btnCancelQuest.addEventListener('click', closeQuestModal);

    el.formQuest.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = el.questIdInput.value;
      const questData = {
        title: el.questTitleInput.value.trim(),
        description: el.questDescInput.value.trim(),
        category: el.questCatInput.value,
        xp_reward: parseInt(el.questXpInput.value) || 50
      };

      try {
        if (id) {
          await API.updateGoal(id, questData);
        } else {
          await API.addGoal(questData);
        }
        window.animeAudio.playClick();
        closeQuestModal();
        await loadQuestsForDate(state.date);
      } catch (err) {
        alert(err.message);
      }
    });

    // Restore Defaults
    el.btnRestoreDefaults.addEventListener('click', async () => {
      if (confirm('Summon the standard 10 Hunter Quests into your log?')) {
        try {
          await API.restoreDefaults();
          window.animeAudio.playTone(587, 'sine', 0.25, 0.15, 0);
          await loadQuestsForDate(state.date);
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Celebrate Modal close
    el.btnCloseCelebrate.addEventListener('click', closeCelebrateModal);

    // Auth Modal Tabs
    el.authTabLogin.addEventListener('click', () => {
      el.authTabLogin.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400';
      el.authTabRegister.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700';
      el.formLogin.classList.remove('hidden');
      el.formRegister.classList.add('hidden');
    });

    el.authTabRegister.addEventListener('click', () => {
      el.authTabRegister.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400';
      el.authTabLogin.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700';
      el.formRegister.classList.remove('hidden');
      el.formLogin.classList.add('hidden');
    });

    // Avatar selector inside register form
    document.querySelectorAll('#avatar-selector label').forEach(lbl => {
      lbl.addEventListener('click', () => {
        document.querySelectorAll('#avatar-selector label').forEach(l => {
          l.classList.remove('border-2', 'border-cyan-400');
          l.classList.add('border-slate-700');
        });
        lbl.classList.add('border-2', 'border-cyan-400');
        lbl.classList.remove('border-slate-700');
      });
    });

    // Login Form Submit
    el.formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await API.login({
          username: el.loginUsername.value.trim(),
          password: el.loginPassword.value
        });
        API.setToken(res.token);
        state.user = res.user;
        updateHunterHUD(state.user);
        if (res.user.theme) {
          setTheme(res.user.theme);
          el.themeSelect.value = res.user.theme;
        }
        closeAuthModal();
        await loadQuestsForDate(state.date);
      } catch (err) {
        alert(err.message);
      }
    });

    // Register Form Submit
    el.formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selAvatar = document.querySelector('input[name="reg-avatar"]:checked')?.value || 'jinwoo';
      try {
        const res = await API.register({
          username: el.regUsername.value.trim(),
          display_name: el.regDisplay.value.trim() || el.regUsername.value.trim(),
          password: el.regPassword.value,
          avatar: selAvatar,
          theme: 'monarch'
        });
        API.setToken(res.token);
        state.user = res.user;
        updateHunterHUD(state.user);
        triggerCelebrationConfetti();
        closeAuthModal();
        await loadQuestsForDate(state.date);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // --- UTILITIES ---
  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init();
});
