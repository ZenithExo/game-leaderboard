const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  game: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster leaderboard queries
ScoreSchema.index({ game: 1, score: -1 });

module.exports = mongoose.model('Score', ScoreSchema);