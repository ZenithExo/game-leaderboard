const Player = require('../models/player');
const Score = require('../models/score');

// Add or update player score
exports.submitScore = async (req, res) => {
  try {
    const { playerName, game, score } = req.body;
    
    // Find or create player
    let player = await Player.findOne({ playerName });
    if (!player) {
      player = new Player({ playerName });
      await player.save();
    }

    // Create new score record
    const newScore = new Score({
      player: player._id,
      game,
      score
    });
    await newScore.save();

    res.status(201).json(newScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get leaderboard for a game
exports.getLeaderboard = async (req, res) => {
  try {
    const { game, limit = 10 } = req.query;
    
    const leaderboard = await Score.find({ game })
      .sort({ score: -1 })
      .limit(parseInt(limit))
      .populate('player', 'playerName avatar');
    
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get player stats
exports.getPlayerStats = async (req, res) => {
  try {
    const { playerName } = req.params;
    
    const player = await Player.findOne({ playerName });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get all scores for player
    const scores = await Score.find({ player: player._id }).sort({ score: -1 });
    
    // Get player's rank in each game
    const stats = await Promise.all(scores.map(async score => {
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
    }));

    res.json({
      player,
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};