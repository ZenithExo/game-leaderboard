const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', PlayerSchema);