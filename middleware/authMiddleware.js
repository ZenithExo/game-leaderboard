const User = require('../models/user');
const Game = require('../models/game'); // Added for game ownership checks

/**
 * Middleware to verify authenticated users (replaces PHP session checks)
 */
const requireAuth = async (req, res, next) => {
  try {
    // 1. Check session exists and has user data
    if (!req.session?.user?.id) {
      console.log('No active session - redirecting to login');
      return res.redirect('/login?error=session_expired');
    }

    // 2. Verify user exists and is active
    const user = await User.findById(req.session.user.id)
      .select('+active +banned +role +lastActive')
      .lean();

    if (!user) {
      console.log('User not found in DB - destroying session');
      req.session.destroy();
      return res.redirect('/login?error=account_not_found');
    }

    if (user.banned) {
      console.log('Banned user attempt:', user._id);
      req.session.destroy();
      return res.redirect('/login?error=account_banned');
    }

    if (!user.active) {
      console.log('Inactive user attempt:', user._id);
      req.session.destroy();
      return res.redirect('/login?error=account_inactive');
    }

    // 3. Update request with fresh user data
    req.currentUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || 'https://gravatar.com/avatar/default?s=200&d=robohash',
      score: user.score || 0,
      level: user.level || 1,
      isAdmin: user.role === 'admin',
      lastActive: user.lastActive
    };

    // 4. Update last activity (with rate limiting)
    const now = new Date();
    if (!user.lastActive || (now - user.lastActive) > 300000) { // 5 minutes
      await User.updateOne(
        { _id: user._id },
        { $set: { lastActive: now } }
      );
    }

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.redirect('/login?error=server_error');
  }
};

/**
 * Middleware for guest-only routes (like login/register)
 */
const requireGuest = (req, res, next) => {
  if (req.session?.user) {
    console.log('Guest middleware - user already logged in');
    return res.redirect('/profile');
  }
  next();
};

/**
 * Admin access control middleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.redirect('/login?error=not_logged_in');
    }

    // Double-check admin status in DB
    const user = await User.findById(req.currentUser.id)
      .select('role')
      .lean();

    if (!user || user.role !== 'admin') {
      console.log('Unauthorized admin access attempt:', req.currentUser.id);
      return res.status(403).render('error', {
        code: 403,
        message: 'Administrator privileges required',
        user: req.currentUser,
        isLoggedIn: true
      });
    }

    next();
  } catch (err) {
    console.error('Admin Middleware Error:', err);
    res.status(500).render('error', {
      code: 500,
      message: 'Server error during authorization',
      user: req.currentUser || null,
      isLoggedIn: !!req.currentUser
    });
  }
};

/**
 * Game ownership verification middleware
 */
const checkGameOwnership = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.redirect('/login?error=not_logged_in');
    }

    const gameId = req.params.id || req.body.gameId;
    if (!gameId) {
      return res.status(400).render('error', {
        code: 400,
        message: 'Game ID not specified',
        user: req.currentUser,
        isLoggedIn: true
      });
    }

    // Verify game exists
    const gameExists = await Game.exists({ _id: gameId });
    if (!gameExists) {
      return res.status(404).render('error', {
        code: 404,
        message: 'Game not found',
        user: req.currentUser,
        isLoggedIn: true
      });
    }

    // Check ownership
    const user = await User.findById(req.currentUser.id)
      .select('ownedGames')
      .lean();

    if (!user.ownedGames.includes(gameId)) {
      console.log('Unauthorized game access attempt:', {
        user: req.currentUser.id,
        game: gameId
      });
      return res.redirect(`/store/${gameId}?error=game_not_owned`);
    }

    req.gameId = gameId; // Attach to request for downstream middleware
    next();
  } catch (err) {
    console.error('Game Ownership Middleware Error:', err);
    res.status(500).render('error', {
      code: 500,
      message: 'Server error verifying game ownership',
      user: req.currentUser || null,
      isLoggedIn: !!req.currentUser
    });
  }
};

/**
 * Email verification check middleware
 */
const requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.redirect('/login?error=not_logged_in');
    }

    const user = await User.findById(req.currentUser.id)
      .select('emailVerified')
      .lean();

    if (!user.emailVerified) {
      return res.redirect('/verify-email?error=email_not_verified');
    }

    next();
  } catch (err) {
    console.error('Email Verification Middleware Error:', err);
    res.redirect('/profile?error=server_error');
  }
};

module.exports = {
  requireAuth,          // Replacement for PHP session checks
  requireGuest,         // For login/register pages
  requireAdmin,         // Admin area protection
  checkGameOwnership,   // Game access control
  requireVerifiedEmail  // Email verification check
};