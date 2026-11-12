const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, verifyPassword, generateToken, authMiddleware } = require('../auth');

// Register a new hunter
router.post('/register', (req, res) => {
  const { username, password, display_name, avatar, theme } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Codename (username) and security key (password) are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Hunter codename must be at least 3 characters.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Security key must be at least 4 characters.' });
  }

  const existing = db.findUserByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'A hunter with this codename is already registered in the guild.' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = db.createUser({
    username,
    password_hash: hash,
    salt,
    display_name: display_name || username,
    avatar: avatar || 'jinwoo',
    theme: theme || 'monarch'
  });

  const token = generateToken(newUser);
  res.status(201).json({
    message: 'Welcome to the Guild, Hunter! System quest granted.',
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      display_name: newUser.display_name,
      avatar: newUser.avatar,
      theme: newUser.theme,
      levelInfo: db.calculateLevel(newUser.xp),
      current_streak: newUser.current_streak,
      best_streak: newUser.best_streak
    }
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const user = db.findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Hunter codename not recognized.' });
  }

  const valid = verifyPassword(password, user.password_hash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid security key.' });
  }

  const token = generateToken(user);
  res.json({
    message: 'Authentication successful. Quest Log synchronized.',
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      theme: user.theme,
      levelInfo: db.calculateLevel(user.xp),
      current_streak: user.current_streak,
      best_streak: user.best_streak
    }
  });
});

// Get current profile
router.get('/me', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar: user.avatar,
    theme: user.theme,
    levelInfo: db.calculateLevel(user.xp),
    current_streak: user.current_streak,
    best_streak: user.best_streak,
    last_active_date: user.last_active_date
  });
});

// Update profile / avatar / theme
router.patch('/profile', authMiddleware, (req, res) => {
  const { display_name, avatar, theme } = req.body;
  const updated = db.updateUser(req.user.id, { display_name, avatar, theme });
  res.json({
    message: 'Hunter profile updated.',
    user: {
      id: updated.id,
      username: updated.username,
      display_name: updated.display_name,
      avatar: updated.avatar,
      theme: updated.theme,
      levelInfo: db.calculateLevel(updated.xp),
      current_streak: updated.current_streak,
      best_streak: updated.best_streak
    }
  });
});

// Public List of hunters for quick switch demo / showcase
router.get('/hunters', (req, res) => {
  const all = db.getAllUsers();
  res.json(all);
});

// Quick Switch Demo Login (allows clicking any hunter profile in UI without retyping password)
router.post('/switch-hunter', (req, res) => {
  const { userId } = req.body;
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Hunter not found.' });
  }
  const token = generateToken(user);
  res.json({
    message: `Switched aura to ${user.display_name}!`,
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      theme: user.theme,
      levelInfo: db.calculateLevel(user.xp),
      current_streak: user.current_streak,
      best_streak: user.best_streak
    }
  });
});

module.exports = router;
