const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', playerSchema);