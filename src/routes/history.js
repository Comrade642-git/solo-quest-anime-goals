const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// Get 30 or 60 day heatmap history
router.get('/heatmap', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = db.getUserHistory(req.user.id, Math.min(90, Math.max(7, days)));
  
  // Calculate completion rate summary
  const completedDays = history.filter(h => h.rate >= 80).length;
  const partialDays = history.filter(h => h.rate > 0 && h.rate < 80).length;
  const totalCompletedQuests = history.reduce((sum, h) => sum + h.completedCount, 0);

  res.json({
    history,
    summary: {
      daysTracked: history.length,
      perfectDays: completedDays,
      activeDays: completedDays + partialDays,
      totalQuestsCompleted: totalCompletedQuests,
      currentStreak: req.user.current_streak || 0,
      bestStreak: req.user.best_streak || 0
    }
  });
});

// Get specific day's breakdown
router.get('/day/:date', (req, res) => {
  const dateStr = req.params.date;
  const status = db.getTodayGoalStatus(req.user.id, dateStr);
  res.json(status);
});

module.exports = router;
