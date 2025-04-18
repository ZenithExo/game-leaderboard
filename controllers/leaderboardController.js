const Player = require('../models/player');

exports.getLeaderboard = async (req, res) => {
    try {
        const players = await Player.find()
            .sort({ score: -1 })
            .limit(10);
        
        res.render('leaderboard', { players });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateScore = async (req, res) => {
    try {
        const { playerId, score } = req.body;
        const player = await Player.findByIdAndUpdate(
            playerId,
            { score },
            { new: true }
        );
        res.json(player);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};