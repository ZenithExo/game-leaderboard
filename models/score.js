// models/Score.js
const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A score must belong to a user']
  },
  game: {
    type: String,
    required: [true, 'Please specify the game'],
    enum: [
      'Valorant',
      'Call of Duty',
      'Fortnite',
      'Metal Gear Rising',
      'Cyberpunk 2077',
      'God of War',
      'Red Dead Redemption 2',
      'Sekiro'
    ],
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'A score value is required'],
    min: [0, 'Score cannot be negative']
  },
  kills: {
    type: Number,
    default: 0
  },
  deaths: {
    type: Number,
    default: 0
  },
  assists: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    min: [0, 'Accuracy cannot be negative'],
    max: [100, 'Accuracy cannot exceed 100%'],
    default: 0
  },
  rank: {
    type: String,
    enum: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Master',
      'Grandmaster',
      'Champion'
    ],
    default: 'Bronze'
  },
  date: {
    type: Date,
    default: Date.now
  },
  screenshotProof: {
    type: String,
    default: 'https://i.imgur.com/default-screenshot.jpg'
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate K/D Ratio (Virtual Property)
scoreSchema.virtual('kdRatio').get(function() {
  return this.deaths === 0 
    ? this.kills 
    : parseFloat((this.kills / this.deaths).toFixed(2));
});

// Indexes for faster queries
scoreSchema.index({ score: -1 }); // Descending for leaderboards
scoreSchema.index({ game: 1, score: -1 }); // For game-specific leaderboards

// Populate user data when querying scores
scoreSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'username avatar level'
  });
  next();
});

// Static method for getting leaderboard
scoreSchema.statics.getLeaderboard = async function(game = 'all', limit = 10) {
  const matchStage = game === 'all' 
    ? {} 
    : { game };

  return await this.aggregate([
    { $match: matchStage },
    { $sort: { score: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        score: 1,
        game: 1,
        rank: 1,
        date: 1,
        kills: 1,
        deaths: 1,
        assists: 1,
        accuracy: 1,
        kdRatio: 1,
        'user.username': 1,
        'user.avatar': 1,
        'user.level': 1
      }
    }
  ]);
};

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;