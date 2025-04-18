const Player = require('../models/player');

exports.getLeaderboard = async (req, res) => {
    try {
        const players = await Player.find().sort({ score: -1 });
        res.render('leaderboard/index', { players });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.updateScore = async (req, res) => {
    try {
        const { username, score } = req.body;
        await Player.findOneAndUpdate({ username }, { score });
        res.redirect('/leaderboard');
    } catch (error) {
        res.status(400).send('Update Error');
    }
};