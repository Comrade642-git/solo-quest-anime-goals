// Client API Client
const API = {
  TOKEN_KEY: 'solo_quest_token',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'System Gate error occurred.');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getMe() {
    return this.request('/api/auth/me');
  },

  updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  },

  getHunters() {
    return this.request('/api/auth/hunters');
  },

  switchHunter(userId) {
    return this.request('/api/auth/switch-hunter', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Goals
  getTodayGoals(dateStr) {
    const q = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    return this.request(`/api/goals/today${q}`);
  },

  toggleGoal(goalId, dateStr) {
    return this.request(`/api/goals/${goalId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date: dateStr })
    });
  },

  addGoal(goalData) {
    return this.request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
  },

  updateGoal(goalId, goalData) {
    return this.request(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goalData)
    });
  },

  deleteGoal(goalId) {
    return this.request(`/api/goals/${goalId}`, {
      method: 'DELETE'
    });
  },

  restoreDefaults() {
    return this.request('/api/goals/restore-defaults', {
      method: 'POST'
    });
  },

  // History & Stats
  getHeatmap(days = 30) {
    return this.request(`/api/history/heatmap?days=${days}`);
  },

  getLeaderboard() {
    return this.request('/api/stats/leaderboard');
  }
};

window.API = API;
