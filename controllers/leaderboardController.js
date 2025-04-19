// controllers/leaderboardController.js
const User = require('../models/user'); // Ensure this path is correct

// GET /leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const players = await User.find()
      .sort({ score: -1 }) // Highest scores first
      .limit(100)
      .lean(); // Optional: converts to plain JS objects

    res.status(200).json({
      success: true,
      players: players || [], // Ensure array exists
      filters: ['All', 'Voluntary', 'Call of Duty', 'Founder'] // Example filters
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching leaderboard' 
    });
  }
};

// POST /update-score
exports.updateScore = async (req, res) => {
  try {
    const { userId, score } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { score: score } }, // Increment score
      { new: true } // Return updated user
    );

    res.status(200).json({ 
      success: true,
      user 
    });
  } catch (err) {
    console.error('Score update error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating score' 
    });
  }
};