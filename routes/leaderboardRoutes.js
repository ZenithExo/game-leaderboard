const express = require('express');
const router = express.Router();
const { getLeaderboard, updateScore } = require('../controllers/leaderboardController');

router.get('/', getLeaderboard);
router.post('/update-score', updateScore);

module.exports = router;