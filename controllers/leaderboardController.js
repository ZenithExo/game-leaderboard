const Player = require('../models/player');
const Score = require('../models/score');

// Add or update player score
exports.submitScore = async (req, res) => {
  try {
    const { playerName, game, score } = req.body;

    // Validate input
    if (!playerName || !game || typeof score !== 'number') {
      return res.status(400).json({ 
        error: 'Please provide playerName, game, and a numeric score' 
      });
    }

    // Find or create player (with upsert to avoid race conditions)
    const player = await Player.findOneAndUpdate(
      { playerName },
      { playerName },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    // Create new score record
    const newScore = new Score({
      player: player._id,
      game,
      score,
      submittedAt: new Date()
    });
    await newScore.save();

    // Prepare response without internal MongoDB properties
    const response = {
      id: newScore._id,
      player: {
        id: player._id,
        playerName: player.playerName
      },
      game,
      score,
      submittedAt: newScore.submittedAt
    };

    res.status(201).json(response);
  } catch (err) {
    console.error('Submit score error:', err);
    res.status(500).json({ 
      error: 'Server error while submitting score' 
    });
  }
};

// Get leaderboard for a game
exports.getLeaderboard = async (req, res) => {
  try {
    const { game, limit = 10 } = req.query;

    // Validate input
    if (!game) {
      return res.status(400).json({ 
        error: 'Please specify a game parameter' 
      });
    }

    const leaderboard = await Score.find({ game })
      .sort({ score: -1 })
      .limit(Math.min(parseInt(limit), 100)) // Cap limit at 100
      .populate('player', 'playerName avatar')
      .lean(); // Convert to plain JS objects

    // Format response
    const formattedLeaderboard = leaderboard.map(entry => ({
      rank: leaderboard.indexOf(entry) + 1,
      playerName: entry.player.playerName,
      avatar: entry.player.avatar,
      score: entry.score,
      game: entry.game,
      submittedAt: entry.submittedAt
    }));

    res.json({
      game,
      count: formattedLeaderboard.length,
      leaderboard: formattedLeaderboard
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ 
      error: 'Server error while fetching leaderboard' 
    });
  }
};

// Get player stats
exports.getPlayerStats = async (req, res) => {
  try {
    const { playerName } = req.params;

    // Find player
    const player = await Player.findOne({ playerName });
    if (!player) {
      return res.status(404).json({ 
        error: 'Player not found' 
      });
    }

    // Get all scores for player
    const scores = await Score.find({ player: player._id })
      .sort({ score: -1 })
      .lean();

    // Get player's rank in each game (optimized with aggregation)
    const stats = await Promise.all(
      scores.map(async score => {
        const rank = await Score.countDocuments({ 
          game: score.game, 
          score: { $gt: score.score } 
        }) + 1;

        return {
          game: score.game,
          score: score.score,
          rank,
          submittedAt: score.submittedAt
        };
      })
    );

    // Calculate summary statistics
    const totalGames = stats.length;
    const averageScore = stats.reduce((sum, stat) => sum + stat.score, 0) / totalGames;
    const bestScore = Math.max(...stats.map(stat => stat.score));

    res.json({
      player: {
        id: player._id,
        playerName: player.playerName,
        avatar: player.avatar
      },
      summary: {
        totalGames,
        averageScore,
        bestScore
      },
      gameStats: stats
    });
  } catch (err) {
    console.error('Player stats error:', err);
    res.status(500).json({ 
      error: 'Server error while fetching player stats' 
    });
  }
};