const User = require('../models/user');

exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.find()
            .sort({ score: -1 })
            .select('username score')
            .limit(10);
        res.render('leaderboard', { users });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateScore = async (req, res) => {
    try {
        const { userId, score } = req.body;
        await User.findByIdAndUpdate(userId, { score });
        res.redirect('/leaderboard');
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};