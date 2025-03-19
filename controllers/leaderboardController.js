const Score = require('../models/Score');

exports.submitScore = async (req, res) => {
    try {
        const { game, score } = req.body;
        const newScore = new Score({ user: req.user.id, game, score });
        await newScore.save();
        res.status(201).json({ message: 'Score submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const { game } = req.params;
        const scores = await Score.find({ game }).sort({ score: -1 }).populate('user', 'username');
        res.json(scores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
