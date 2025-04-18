const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.redirect('/leaderboard');
    } catch (error) {
        res.status(400).render('auth/register', { error: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).render('auth/login', { error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('auth/login', { error: 'Invalid password' });
        }
        res.redirect('/leaderboard');
    } catch (error) {
        res.status(400).render('auth/login', { error: 'Login failed' });
    }
};