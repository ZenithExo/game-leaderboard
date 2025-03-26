const express = require('express');
const connectDB = require('game-leaderboard\config\db.js');
const authRoutes = require('game-leaderboard/routes/authRoutes');
const leaderboardRoutes = require('game-leaderboard/routes/leaderboardRoutes');
require('dotenv').config();

const app = express();
connectDB();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));