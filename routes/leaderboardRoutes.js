const express = require('express');
const { submitScore, getLeaderboard } = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/submit', authMiddleware, submitScore);
router.get('/:game', getLeaderboard);

module.exports = router;
