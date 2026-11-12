const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const goalsRoutes = require('./src/routes/goals');
const historyRoutes = require('./src/routes/history');
const statsRoutes = require('./src/routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'SYSTEM_ONLINE',
    system: 'SoloQuest Hunter Gate v2.0',
    timestamp: new Date().toISOString()
  });
});

// Single Page Application routing fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚔️ [SOLO QUEST: ANIME GOAL TRACKER ONLINE] ⚔️`);
  console.log(`🌐 System Gate active on: http://localhost:${PORT}`);
  console.log(`💾 Database initialized and tracking hunters`);
  console.log(`=======================================================`);
});
