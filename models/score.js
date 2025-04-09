const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  game: {
    type: String,
    required: true,
    trim: true
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
scoreSchema.index({ game: 1, score: -1 });

module.exports = mongoose.model('Score', scoreSchema);