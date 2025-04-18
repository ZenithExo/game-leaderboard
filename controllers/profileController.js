const User = require('../models/user');
const Score = require('../models/score');

// Get profile data
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id || req.user.id)
            .populate({
                path: 'friends.user',
                select: 'username avatar level isOnline lastActive',
                options: { sort: { isOnline: -1 } }
            })
            .populate({
                path: 'recentGames.game',
                select: 'name image'
            })
            .lean();

        if (!user) {
            return res.status(404).render('error', {
                message: 'Profile not found'
            });
        }

        // Get leaderboard stats
        const leaderboardStats = await Score.aggregate([
            { $match: { user: user._id } },
            { $group: {
                _id: '$game',
                highestScore: { $max: '$score' },
                averageScore: { $avg: '$score' }
            }}
        ]);

        res.render('profile', {
            user,
            leaderboardStats,
            isOwnProfile: req.user?.id === user._id.toString(),
            currentPage: 'profile'
        });

    } catch (err) {
        next(err);
    }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
    try {
        const updates = {
            username: req.body.username,
            avatar: req.body.avatar,
            bio: req.body.bio
        };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        );

        // Update session if username/avatar changed
        if (req.body.username || req.body.avatar) {
            req.session.user = {
                ...req.session.user,
                username: user.username,
                avatar: user.avatar
            };
        }

        res.redirect(`/profile/${user._id}?success=Profile updated successfully`);

    } catch (err) {
        if (err.code === 11000) {
            return res.redirect('/profile/edit?error=Username already taken');
        }
        next(err);
    }
};

// Add friend
exports.addFriend = async (req, res, next) => {
    try {
        const { friendId } = req.params;

        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { friends: { user: friendId } } }
        );

        res.redirect(`/profile/${friendId}?success=Friend added`);

    } catch (err) {
        next(err);
    }
};

// Get edit profile page
exports.getEditProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).lean();
        res.render('profile-edit', {
            user,
            error: req.query.error,
            currentPage: 'profile'
        });
    } catch (err) {
        next(err);
    }
};