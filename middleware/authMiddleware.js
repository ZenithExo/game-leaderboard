// middleware/authMiddleware.js
const User = require('../models/user');

// PHP equivalent: session_start() + authentication check
const requireAuth = async (req, res, next) => {
  try {
    // 1. Check if session exists (like isset($_SESSION['user']))
    if (!req.session.user) {
      return res.redirect('/login?error=not_logged_in');
    }

    // 2. Verify user still exists in DB (unlike PHP, we validate against DB)
    const user = await User.findById(req.session.user.id)
      .select('+active +banned');

    if (!user || user.banned) {
      req.session.destroy(); // Clear invalid session
      return res.redirect('/login?error=account_not_found');
    }

    // 3. Add fresh user data to request (like PHP's $_SESSION refresh)
    req.currentUser = {
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      isAdmin: user.role === 'admin'
    };

    // 4. Update last activity (similar to PHP session handlers)
    user.lastActive = new Date();
    await user.save();

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.redirect('/login?error=server_error');
  }
};

// PHP equivalent: !isset($_SESSION['user'])
const requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  next();
};

// PHP equivalent: checking admin role
const requireAdmin = (req, res, next) => {
  if (!req.currentUser?.isAdmin) {
    return res.status(403).render('error', {
      code: 403,
      message: 'Admin privileges required'
    });
  }
  next();
};

// Game-specific permission check (like PHP game access controls)
const checkGameOwnership = async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const user = await User.findById(req.session.user.id);
    
    if (!user.ownedGames.includes(gameId)) {
      return res.redirect('/store?error=game_not_owned');
    }
    
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireAuth,    // Replace PHP session checks
  requireGuest,   // For login/register pages
  requireAdmin,   // Admin area protection
  checkGameOwnership // Custom game access control
};