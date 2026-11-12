# ⚔️ SoloQuest — Anime Daily Goal & Quest Tracker (デイリークエスト)

An ultra-attractive, gamified anime-themed daily goal tracking web application inspired by **Solo Leveling**, **Cyberpunk: Edgerunners**, **Demon Slayer**, and **Studio Ghibli**.

Track your 10 daily goals, conquer quests, earn XP, level up your hunter rank, maintain unbroken streaks, and track historical consistency with an interactive 30-day heatmap.

---

## 🌟 Key Features

### 1. ⚔️ Gamified Daily Goal Tracking (Solo Leveling System HUD)
- **Daily 10 Quests**: Default pre-loaded classic trials (Morning Workout, Endurance, Deep Work, Hydration, Grimoire Reading, Clean Diet, Meditation, Coding Project, Sanctuary Cleansing, Sleep Restoration).
- **Custom Objectives**: Forge any custom daily quest with title, lore description, category, and custom XP value.
- **Categorization**: Quests are categorized into *Strength*, *Agility*, *Intelligence*, *Vitality*, *Discipline*, and *Spirit*.
- **Interactive Progress Bar**: Live clearance rate gauge (`8/10 Complete - 80%`) with neon glowing shimmer.
- **Victory Celebrations**: Completing 100% of your daily trials triggers confetti cannons, bonus XP, and celebratory anime fanfare.

### 2. 🎨 5 Immersive Anime Themes & Ambient Particle FX
- **⚔️ Shadow Monarch (Solo Leveling)**: Deep electric system blue, holographic scanlines, and floating mana dust.
- **⚡ Neo-Tokyo (Cyberpunk)**: Neon magenta/cyan laser aesthetic, glowing chrome, and cyber data particles.
- **🌸 Sakura Shrine (Twilight)**: Mystical twilight purple with gently swaying and drifting cherry blossom petals.
- **🔥 Flame Hashira (Demon Slayer)**: Blazing crimson and solar amber with rising fiery embers.
- **🍃 Ghibli Meadow (Serene)**: Calming emerald nature tones with floating mystical forest spores.

### 3. 🔊 Pure Web Audio Anime Synthesizer
- Built with the browser's Web Audio API — **zero external audio files or broken links**.
- Sound effects:
  - *Quest Complete Chime*: 4-tone ascending arpeggio.
  - *Level-Up Fanfare*: Epic heroic chord progression.
  - *Quest Uncheck*: Low dampening tone.
  - *All Quests Cleared*: Victory fanfare.
- Convenient sound mute/unmute toggle button with saved preference.

### 4. 🗄️ Multi-User Database & Hunter Registry
- **Multi-Hunter Support**: Multiple accounts with isolated quest logs, streaks, and custom goals.
- **Cryptographic Security**: PBKDF2 password hashing with user-specific cryptographic salts and signed token authentication.
- **Fast Hunter Switcher**: 1-click preview switch to test different hunter profiles (e.g., Sung Jin-Woo, Novice Hunter) without re-authenticating.
- **Persistent Storage**: Atomic ACID-safe JSON database with automatic backup restoration.

### 5. 📊 30-Day Activity Heatmap & Hunter Guild Leaderboard
- **Consistency Heatmap**: Interactive 30-day grid color-coded by daily completion percentage (0%, 25%, 50%, 75%, 100%).
- **Date Navigation**: Jump to any past date to view historical completion logs or verify your consistency.
- **Guild Leaderboard**: Real-time hunter rankings sorted by hunter level, title, and current streak days.

---

## 🚀 Getting Started

### Launching the Application
You can start the server by simply double-clicking **`start.bat`** or running:

```bash
npm start
```

Then open your browser and navigate to:
**http://localhost:3000**

---

## 📁 Project Architecture

```
anime-daily-quest/
├── package.json
├── server.js              # Express app & API router
├── start.bat              # Quick 1-click launcher for Windows
├── data/
│   └── quest_db.json      # Persistent multi-user database
├── src/
│   ├── db.js              # Database engine, XP & level mathematics, streaks
│   ├── auth.js            # PBKDF2 hashing & session token authentication
│   └── routes/
│       ├── auth.js        # Register, login, profile, hunter switcher
│       ├── goals.js       # CRUD goals, toggle completion, restore defaults
│       ├── history.js     # 30-day heatmap & daily breakdown
│       └── stats.js       # Guild leaderboard & hunter rankings
└── public/
    ├── index.html         # Main holographic HUD layout & modals
    ├── css/
    │   └── anime-theme.css # Neon glows, glassmorphism, theme color palettes
    └── js/
        ├── audio.js       # Web Audio API synthesizer for anime SFX
        ├── particles.js   # 60fps canvas particles (Sakura, Mana, Embers)
        ├── api.js         # REST API communication client
        └── app.js         # Reactive UI controller & state management
```

---

## 🐙 Git Version Control & Future Deployment

The repository is already initialized and tracked locally with Git on branch `main`.

When you are ready to publish and deploy to GitHub:
```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```
