const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    game: { type: String, required: true },
    score: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Score', ScoreSchema);
