const Player = require('../models/player');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const player = await Player.findOne({ username });
        res.redirect('/leaderboard');
    } catch (error) {
        res.status(400).send('Login Error');
    }
};