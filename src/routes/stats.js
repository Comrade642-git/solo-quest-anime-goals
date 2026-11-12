const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// Leaderboard among registered hunters
router.get('/leaderboard', (req, res) => {
  const users = db.getAllUsers();
  
  // Sort by Consistency Rank order descending (S > A > B > C > D > E), then streak, then XP
  const ranked = users.map(u => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    avatar: u.avatar,
    theme: u.theme,
    levelInfo: u.levelInfo,
    current_streak: u.current_streak,
    best_streak: u.best_streak,
    isCurrent: u.id === req.user.id
  })).sort((a, b) => {
    if (b.levelInfo.order !== a.levelInfo.order) {
      return (b.levelInfo.order || 0) - (a.levelInfo.order || 0);
    }
    if ((b.current_streak || 0) !== (a.current_streak || 0)) {
      return (b.current_streak || 0) - (a.current_streak || 0);
    }
    return (b.levelInfo.level || 0) - (a.levelInfo.level || 0);
  });

  res.json({
    leaderboard: ranked,
    currentHunterRank: ranked.findIndex(r => r.id === req.user.id) + 1
  });
});

module.exports = router;
