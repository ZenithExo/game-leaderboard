const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Submit score (protected route)
router.post('/scores', authMiddleware, leaderboardController.submitScore);

// Get leaderboard
router.get('/leaderboard', leaderboardController.getLeaderboard);

// Get player stats
router.get('/players/:playerName', leaderboardController.getPlayerStats);

module.exports = router;