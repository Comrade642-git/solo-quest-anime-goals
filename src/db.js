const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'quest_db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'quest_db.backup.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial state
const defaultState = {
  users: [],
  goals: [],
  daily_logs: [],
  user_stats: []
};

class QuestDatabase {
  constructor() {
    this.data = this.load();
    this.seedDefaultsIfNeeded();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading DB file, attempting backup load:', err.message);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const backupRaw = fs.readFileSync(BACKUP_FILE, 'utf8');
          return JSON.parse(backupRaw);
        } catch (backupErr) {
          console.error('Failed to load backup:', backupErr.message);
        }
      }
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  save() {
    try {
      const serialized = JSON.stringify(this.data, null, 2);
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, serialized, 'utf8');
      
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, BACKUP_FILE);
      }
      
      fs.renameSync(tempFile, DB_FILE);
      return true;
    } catch (err) {
      console.error('Failed to commit DB state:', err);
      return false;
    }
  }

  // --- Rank Calculations Strictly Based on Daily Consistency (Streaks) ---
  // Ranks: E (Default) -> D -> C -> B -> A -> S (Highest)
  calculateRank(streak = 0) {
    const s = Math.max(0, streak || 0);

    if (s >= 30) {
      return {
        rankBadge: 'S',
        rank: 'S-Rank Supreme Hunter',
        title: 'Supreme Monarch',
        rankColor: '#c084fc',
        minStreak: 30,
        nextRank: 'MAX RANK (S-Rank)',
        daysToNextRank: 0,
        streakProgress: '100%',
        order: 6
      };
    } else if (s >= 21) {
      const needed = 30 - s;
      return {
        rankBadge: 'A',
        rank: 'A-Rank Master',
        title: 'Master Hunter',
        rankColor: '#eab308',
        minStreak: 21,
        nextRank: 'S-Rank',
        daysToNextRank: needed,
        streakProgress: `${Math.round(((s - 21) / 9) * 100)}%`,
        order: 5
      };
    } else if (s >= 14) {
      const needed = 21 - s;
      return {
        rankBadge: 'B',
        rank: 'B-Rank Elite',
        title: 'Elite Hunter',
        rankColor: '#06b6d4',
        minStreak: 14,
        nextRank: 'A-Rank',
        daysToNextRank: needed,
        streakProgress: `${Math.round(((s - 14) / 7) * 100)}%`,
        order: 4
      };
    } else if (s >= 7) {
      const needed = 14 - s;
      return {
        rankBadge: 'C',
        rank: 'C-Rank Vanguard',
        title: 'Vanguard Hunter',
        rankColor: '#22c55e',
        minStreak: 7,
        nextRank: 'B-Rank',
        daysToNextRank: needed,
        streakProgress: `${Math.round(((s - 7) / 7) * 100)}%`,
        order: 3
      };
    } else if (s >= 3) {
      const needed = 7 - s;
      return {
        rankBadge: 'D',
        rank: 'D-Rank Apprentice',
        title: 'Apprentice Hunter',
        rankColor: '#38bdf8',
        minStreak: 3,
        nextRank: 'C-Rank',
        daysToNextRank: needed,
        streakProgress: `${Math.round(((s - 3) / 4) * 100)}%`,
        order: 2
      };
    } else {
      // Default: E-Rank (0 to 2 days)
      const needed = 3 - s;
      return {
        rankBadge: 'E',
        rank: 'E-Rank Novice',
        title: 'Awakened Novice',
        rankColor: '#94a3b8',
        minStreak: 0,
        nextRank: 'D-Rank',
        daysToNextRank: needed,
        streakProgress: `${Math.round((s / 3) * 100)}%`,
        order: 1
      };
    }
  }

  // --- XP & Level Calculations ---
  calculateLevel(xp = 0, streak = 0) {
    let level = 1;
    let threshold = 200;
    let accumulated = 0;
    while (xp >= accumulated + threshold) {
      accumulated += threshold;
      level++;
      threshold = Math.floor(threshold * 1.35);
    }
    const currentLevelXP = xp - accumulated;
    const nextLevelXP = threshold;
    const progressPercent = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

    // Consistency Rank (S, A, B, C, D, E)
    const rankInfo = this.calculateRank(streak);

    return {
      level,
      currentLevelXP,
      nextLevelXP,
      progressPercent,
      ...rankInfo
    };
  }

  // Helper date formatted YYYY-MM-DD
  getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // --- Users Operations ---
  findUserByUsername(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getAllUsers() {
    return this.data.users.map(u => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar: u.avatar,
      theme: u.theme || 'monarch',
      levelInfo: this.calculateLevel(u.xp || 0, u.current_streak || 0),
      current_streak: u.current_streak || 0,
      best_streak: u.best_streak || 0,
      created_at: u.created_at
    }));
  }

  createUser({ username, password_hash, salt, display_name, avatar, theme }) {
    const id = crypto.randomUUID();
    // Every new account starts strictly at E-Rank (0 streak, 0 XP)
    const newUser = {
      id,
      username: username.trim(),
      password_hash,
      salt,
      display_name: display_name ? display_name.trim() : username.trim(),
      avatar: avatar || 'jinwoo',
      theme: theme || 'monarch',
      xp: 0,
      current_streak: 0,
      best_streak: 0,
      last_active_date: null,
      created_at: new Date().toISOString()
    };

    this.data.users.push(newUser);
    
    // Seed standard 10 Hunter Daily Quests for this new user
    this.seedDefaultGoalsForUser(id);
    this.save();
    return newUser;
  }

  setCustomGoalsForUser(userId, goalsList) {
    // Deactivate existing goals for this user
    this.data.goals.forEach(g => {
      if (g.user_id === userId) {
        g.is_active = false;
      }
    });

    // Add new custom goals
    goalsList.forEach((q, index) => {
      if (q.title && q.title.trim()) {
        this.data.goals.push({
          id: crypto.randomUUID(),
          user_id: userId,
          title: q.title.trim(),
          description: q.description ? q.description.trim() : '',
          category: q.category || 'Discipline',
          xp_reward: Number(q.xp_reward) || 50,
          icon: q.icon || 'check-circle',
          order_index: index,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    });
    this.save();
    return this.getUserGoals(userId);
  }

  updateUser(id, updates) {
    const user = this.findUserById(id);
    if (!user) return null;
    
    const allowed = ['display_name', 'avatar', 'theme', 'xp', 'current_streak', 'best_streak', 'last_active_date'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    }
    this.save();
    return user;
  }

  // --- Goals Operations ---
  seedDefaultGoalsForUser(userId) {
    const defaultQuests = [
      { title: 'Morning Physical Training (100 Push-ups / 100 Sit-ups)', desc: 'Sharpen your hunter physique with core endurance.', cat: 'Strength', xp: 50, icon: 'dumbbell' },
      { title: 'Endurance Run or 10,000 Steps', desc: 'Build agility and speed for dungeon runs.', cat: 'Agility', xp: 50, icon: 'flame' },
      { title: 'Deep Work / Skill Mastery (2 Hours)', desc: 'Conquer the intellectual dungeon with zero distraction.', cat: 'Intelligence', xp: 60, icon: 'brain' },
      { title: 'Drink 2.5 Liters of Pure Water', desc: 'Hydrate mana reserves for cellular restoration.', cat: 'Vitality', xp: 30, icon: 'droplet' },
      { title: 'Read 20 Pages of Knowledge / Wisdom', desc: 'Absorb ancient grimoires or modern tactical knowledge.', cat: 'Intelligence', xp: 40, icon: 'book-open' },
      { title: 'Clean & Nutritious Hunter Fuel (No Junk)', desc: 'Fuel the vessel with high-tier nutrient rations.', cat: 'Vitality', xp: 40, icon: 'apple' },
      { title: '15 Minutes Meditation & Breathwork', desc: 'Calm the spiritual aura and focus mental mana.', cat: 'Spirit', xp: 35, icon: 'wind' },
      { title: 'Code or Build a Creative Project Task', desc: 'Forge modern tech weapons and forge your digital empire.', cat: 'Intelligence', xp: 50, icon: 'code' },
      { title: 'Sanctuary Organization & Room Cleansing', desc: 'Maintain an orderly base camp for supreme efficiency.', cat: 'Discipline', xp: 30, icon: 'sparkles' },
      { title: '8 Hours Mana Regeneration Sleep', desc: 'Rest fully before the next dungeon gate opens at dawn.', cat: 'Vitality', xp: 50, icon: 'moon' }
    ];

    defaultQuests.forEach((q, index) => {
      this.data.goals.push({
        id: crypto.randomUUID(),
        user_id: userId,
        title: q.title,
        description: q.desc,
        category: q.cat,
        xp_reward: q.xp,
        icon: q.icon,
        order_index: index,
        is_active: true,
        created_at: new Date().toISOString()
      });
    });
  }

  getUserGoals(userId) {
    return this.data.goals
      .filter(g => g.user_id === userId && g.is_active)
      .sort((a, b) => a.order_index - b.order_index);
  }

  addGoal(userId, { title, description, category, xp_reward, icon }) {
    const userGoals = this.getUserGoals(userId);
    const newGoal = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'Discipline',
      xp_reward: Number(xp_reward) || 40,
      icon: icon || 'check-circle',
      order_index: userGoals.length,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.data.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  updateGoal(goalId, userId, updates) {
    const goal = this.data.goals.find(g => g.id === goalId && g.user_id === userId);
    if (!goal) return null;
    if (updates.title !== undefined) goal.title = updates.title.trim();
    if (updates.description !== undefined) goal.description = updates.description.trim();
    if (updates.category !== undefined) goal.category = updates.category;
    if (updates.xp_reward !== undefined) goal.xp_reward = Number(updates.xp_reward) || 40;
    if (updates.icon !== undefined) goal.icon = updates.icon;
    if (updates.order_index !== undefined) goal.order_index = updates.order_index;
    this.save();
    return goal;
  }

  deleteGoal(goalId, userId) {
    const goal = this.data.goals.find(g => g.id === goalId && g.user_id === userId);
    if (!goal) return false;
    goal.is_active = false;
    this.save();
    return true;
  }

  // --- Daily Quest Logs & Streak System ---
  getTodayGoalStatus(userId, dateStr = null) {
    const targetDate = dateStr || this.getTodayString();
    const goals = this.getUserGoals(userId);
    
    // Find all logs for user on this date
    const logs = this.data.daily_logs.filter(l => l.user_id === userId && l.date === targetDate);
    const logMap = new Map();
    logs.forEach(l => logMap.set(l.goal_id, l));

    const enrichedGoals = goals.map(g => {
      const log = logMap.get(g.id);
      return {
        ...g,
        completed: log ? !!log.completed : false,
        completed_at: log ? log.completed_at : null
      };
    });

    const totalGoals = enrichedGoals.length;
    const completedCount = enrichedGoals.filter(g => g.completed).length;
    const totalXPForDay = enrichedGoals.filter(g => g.completed).reduce((sum, g) => sum + g.xp_reward, 0);
    const allCompleted = totalGoals > 0 && completedCount === totalGoals;

    return {
      date: targetDate,
      totalGoals,
      completedCount,
      completionRate: totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0,
      totalXPForDay,
      allCompleted,
      goals: enrichedGoals
    };
  }

  toggleGoal(userId, goalId, dateStr = null) {
    const targetDate = dateStr || this.getTodayString();
    const goal = this.data.goals.find(g => g.id === goalId && g.user_id === userId);
    if (!goal) return null;

    let log = this.data.daily_logs.find(l => l.user_id === userId && l.goal_id === goalId && l.date === targetDate);
    let wasCompleted = false;

    if (!log) {
      log = {
        id: crypto.randomUUID(),
        user_id: userId,
        goal_id: goalId,
        date: targetDate,
        completed: true,
        completed_at: new Date().toISOString()
      };
      this.data.daily_logs.push(log);
      wasCompleted = true;
    } else {
      log.completed = !log.completed;
      log.completed_at = log.completed ? new Date().toISOString() : null;
      wasCompleted = log.completed;
    }

    // Award or deduct XP
    const user = this.findUserById(userId);
    if (user) {
      if (wasCompleted) {
        user.xp = (user.xp || 0) + goal.xp_reward;
      } else {
        user.xp = Math.max(0, (user.xp || 0) - goal.xp_reward);
      }
      this.recalculateStreaks(userId);
    }

    this.save();
    return {
      goalId,
      date: targetDate,
      completed: wasCompleted,
      xpChanged: wasCompleted ? goal.xp_reward : -goal.xp_reward,
      userLevel: this.calculateLevel(user.xp, user.current_streak),
      currentStreak: user.current_streak
    };
  }

  // Streak Recalculation
  recalculateStreaks(userId) {
    const user = this.findUserById(userId);
    if (!user) return;

    const userLogs = this.data.daily_logs.filter(l => l.user_id === userId && l.completed);
    const dateCounts = {};
    userLogs.forEach(l => {
      dateCounts[l.date] = (dateCounts[l.date] || 0) + 1;
    });

    const activeDates = Object.keys(dateCounts).sort().reverse();
    if (activeDates.length === 0) {
      user.current_streak = 0;
      return;
    }

    let streak = 0;
    let checkDate = new Date();
    
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dateCounts[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const curStr = checkDate.toISOString().split('T')[0];
      if (dateCounts[curStr] && dateCounts[curStr] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    user.current_streak = streak;
    if (streak > (user.best_streak || 0)) {
      user.best_streak = streak;
    }
  }

  // --- 30-Day Heatmap / History ---
  getUserHistory(userId, days = 30) {
    const history = [];
    const now = new Date();
    const goals = this.getUserGoals(userId);
    const totalGoals = goals.length || 10;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const completedCount = this.data.daily_logs.filter(
        l => l.user_id === userId && l.date === dateStr && l.completed
      ).length;

      const rate = Math.min(100, Math.round((completedCount / totalGoals) * 100));

      history.push({
        date: dateStr,
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completedCount,
        totalGoals,
        rate,
        level: rate === 0 ? 0 : rate < 30 ? 1 : rate < 70 ? 2 : rate < 100 ? 3 : 4
      });
    }

    return history;
  }

  // --- Seed Initial Demo Data ---
  seedDefaultsIfNeeded() {
    if (this.data.users.length === 0) {
      console.log('Seeding initial anime hunter users...');
      
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync('hunter123', salt, 1000, 64, 'sha512').toString('hex');

      // Sung Jin-Woo (14-day streak = B-Rank Elite)
      const jinwooId = crypto.randomUUID();
      const jinwoo = {
        id: jinwooId,
        username: 'jinwoo',
        password_hash: hash,
        salt,
        display_name: 'Sung Jin-Woo',
        avatar: 'jinwoo',
        theme: 'monarch',
        xp: 2200,
        current_streak: 14,
        best_streak: 14,
        last_active_date: this.getTodayString(),
        created_at: new Date(Date.now() - 14 * 86400000).toISOString()
      };
      this.data.users.push(jinwoo);
      this.seedDefaultGoalsForUser(jinwooId);

      // Seed past history for Jinwoo
      const jinwooGoals = this.getUserGoals(jinwooId);
      for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
        const d = new Date(Date.now() - dayOffset * 86400000).toISOString().split('T')[0];
        const numCompleted = dayOffset === 0 ? 7 : Math.floor(Math.random() * 3) + 8;
        for (let g = 0; g < Math.min(numCompleted, jinwooGoals.length); g++) {
          this.data.daily_logs.push({
            id: crypto.randomUUID(),
            user_id: jinwooId,
            goal_id: jinwooGoals[g].id,
            date: d,
            completed: true,
            completed_at: new Date(Date.now() - dayOffset * 86400000 + g * 3600000).toISOString()
          });
        }
      }

      // Novice Hunter (0-day streak = E-Rank Default)
      const guestSalt = crypto.randomBytes(16).toString('hex');
      const guestHash = crypto.pbkdf2Sync('hunter123', guestSalt, 1000, 64, 'sha512').toString('hex');
      const guestId = crypto.randomUUID();
      const guest = {
        id: guestId,
        username: 'hunter',
        password_hash: guestHash,
        salt: guestSalt,
        display_name: 'Novice Hunter',
        avatar: 'flame',
        theme: 'flame',
        xp: 0,
        current_streak: 0,
        best_streak: 0,
        last_active_date: null,
        created_at: new Date().toISOString()
      };
      this.data.users.push(guest);
      this.seedDefaultGoalsForUser(guestId);

      this.save();
    }
  }
}

module.exports = new QuestDatabase();
