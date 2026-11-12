const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../auth');

// All routes here require authentication
router.use(authMiddleware);

// Get today's goals and completion status
router.get('/today', (req, res) => {
  const dateStr = req.query.date || db.getTodayString();
  const status = db.getTodayGoalStatus(req.user.id, dateStr);
  const user = db.findUserById(req.user.id);
  
  res.json({
    ...status,
    userLevel: db.calculateLevel(user.xp),
    currentStreak: user.current_streak,
    bestStreak: user.best_streak
  });
});

// Toggle a goal's completion status
router.post('/:id/toggle', (req, res) => {
  const goalId = req.params.id;
  const dateStr = req.body.date || db.getTodayString();

  const result = db.toggleGoal(req.user.id, goalId, dateStr);
  if (!result) {
    return res.status(404).json({ error: 'Quest goal not found.' });
  }

  // Get refreshed day status
  const dayStatus = db.getTodayGoalStatus(req.user.id, dateStr);

  res.json({
    message: result.completed ? 'Quest objective accomplished!' : 'Objective status reverted.',
    toggle: result,
    dayStatus,
    allCompletedJustNow: dayStatus.allCompleted && dayStatus.totalGoals >= 1
  });
});

// Add a new goal
router.post('/', (req, res) => {
  const { title, description, category, xp_reward, icon } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Quest title is required.' });
  }

  const newGoal = db.addGoal(req.user.id, {
    title,
    description,
    category,
    xp_reward,
    icon
  });

  const dayStatus = db.getTodayGoalStatus(req.user.id);
  res.status(201).json({
    message: 'New quest added to your Hunter Log.',
    goal: newGoal,
    dayStatus
  });
});

// Update a goal
router.put('/:id', (req, res) => {
  const updated = db.updateGoal(req.params.id, req.user.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Goal not found.' });
  }
  const dayStatus = db.getTodayGoalStatus(req.user.id);
  res.json({
    message: 'Quest specifications updated.',
    goal: updated,
    dayStatus
  });
});

// Delete a goal
router.delete('/:id', (req, res) => {
  const success = db.deleteGoal(req.params.id, req.user.id);
  if (!success) {
    return res.status(404).json({ error: 'Goal not found.' });
  }
  const dayStatus = db.getTodayGoalStatus(req.user.id);
  res.json({
    message: 'Quest removed from log.',
    dayStatus
  });
});

// Restore standard 10 Hunter Quests
router.post('/restore-defaults', (req, res) => {
  db.seedDefaultGoalsForUser(req.user.id);
  db.save();
  const dayStatus = db.getTodayGoalStatus(req.user.id);
  res.json({
    message: 'Standard 10 Hunter Quests summoned to your log!',
    dayStatus
  });
});

module.exports = router;
