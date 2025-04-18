// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { requireAuth } = require('../middleware/authMiddleware');

// PHP Equivalent: profile.php session check + data fetch
router.get('/profile', requireAuth, async (req, res) => {
    try {
        // Get full profile with friends populated (like PHP JOIN queries)
        const user = await User.findById(req.session.user.id)
            .populate({
                path: 'friends.userId',
                select: 'username avatar level isOnline lastActive',
                options: { sort: { 'userId.isOnline': -1 } } // Online friends first
            })
            .lean(); // Convert to plain JS object for EJS

        if (!user) {
            req.session.destroy();
            return res.redirect('/login?error=profile_not_found');
        }

        // Calculate additional stats (like PHP computations)
        const completionPercentage = parseInt(user.completionRate) || 0;
        const nextLevelXP = Math.pow(user.level || 1, 2) * 100;

        // Render profile with all data (equivalent to PHP include header/footer)
        res.render('profile', {
            user: {
                ...user,
                // Add calculated fields
                completionPercentage,
                nextLevelXP,
                // Format games data
                recentGames: user.recentGames || getDefaultGames(),
                completedGames: user.completedGames || getCompletedGames()
            },
            currentPage: 'profile'
        });

    } catch (err) {
        console.error('Profile Route Error:', err);
        res.status(500).render('error', { 
            message: 'Profile load failed',
            error: process.env.NODE_ENV === 'development' ? err : null
        });
    }
});

// PHP Equivalent: Profile update form handler
router.post('/profile/update', requireAuth, async (req, res) => {
    try {
        const { username, avatar } = req.body;

        // Validation (like PHP filter_input)
        if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid username format' 
            });
        }

        // Update user (like PHP PDO prepared statements)
        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id,
            { username, avatar },
            { new: true }
        );

        // Update session (like PHP $_SESSION update)
        req.session.user.username = updatedUser.username;
        req.session.user.avatar = updatedUser.avatar;

        res.json({ 
            success: true,
            user: updatedUser
        });

    } catch (err) {
        console.error('Profile Update Error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Update failed' 
        });
    }
});

// Helper functions (equivalent to PHP include 'game_data.php')
function getDefaultGames() {
    return [
        { 
            name: 'Metal Gear Rising', 
            hours: 61, 
            image: '/images/games/mgr.jpg' 
        },
        { 
            name: 'Cyberpunk 2077', 
            hours: 45, 
            image: '/images/games/cyberpunk.jpg' 
        }
    ];
}

function getCompletedGames() {
    return [
        { 
            name: 'Red Dead Redemption 2', 
            image: '/images/games/rdr2.jpg' 
        }
    ];
}

module.exports = router;