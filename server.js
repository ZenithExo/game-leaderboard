const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const User = require('./models/user');
const Score = require('./models/score');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/game-leaderboard',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// Global Template Variables Middleware
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    next();
});

// Flash messages middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

// Authentication Middleware
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        req.session.message = {
            type: 'error',
            text: 'Please login to access this page'
        };
        return res.redirect('/login');
    }
    next();
};

// Home Route
app.get('/', async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect('/profile');
        }

        const topPlayers = await User.find().sort({ score: -1 }).limit(5).lean();
        
        res.render('index', {
            featuredGame: { banner: '/images/default-banner.jpg' },
            topPlayers: topPlayers || [],
            trendingGames: []
        });
    } catch (err) {
        console.error('Home route error:', err);
        res.status(500).render('500', {
            user: null,
            isLoggedIn: false
        });
    }
});

// Enhanced Auth Routes
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/profile');
    res.render('login', { 
        error: null, 
        email: '',
        user: null,
        isLoggedIn: false
    });
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.render('login', {
                error: 'Please provide both email and password',
                email,
                user: null,
                isLoggedIn: false
            });
        }

        // Find user with password field explicitly selected
        const user = await User.findOne({ email }).select('+password +isActive');
        
        if (!user) {
            return res.render('login', {
                error: 'Invalid email or password',
                email,
                user: null,
                isLoggedIn: false
            });
        }

        // Password verification
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', {
                error: 'Invalid email or password',
                email,
                user: null,
                isLoggedIn: false
            });
        }

        // Update last active time
        await User.findByIdAndUpdate(user._id, { lastActive: new Date() });

        // Set session data
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || '/images/default-avatar.jpg',
            score: user.score || 0,
            rank: user.rank || 'Unranked',
            level: user.level || 1
        };

        res.redirect('/profile');
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).render('login', {
            error: 'Server error. Please try again.',
            email: req.body.email,
            user: null,
            isLoggedIn: false
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Session destruction error:', err);
        res.redirect('/');
    });
});

// Enhanced Register Routes
app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/profile');
    res.render('register', { 
        error: null,
        user: null,
        isLoggedIn: false,
        formData: {
            username: '',
            email: ''
        }
    });
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        
        // Input validation
        if (!username || !email || !password || !confirmPassword) {
            return res.render('register', {
                error: 'All fields are required',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        if (password !== confirmPassword) {
            return res.render('register', {
                error: 'Passwords do not match',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        if (password.length < 8) {
            return res.render('register', {
                error: 'Password must be at least 8 characters',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('register', {
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        // Create user with hashed password
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            score: 0,
            avatar: '/images/default-avatar.jpg',
            recentGames: [],
            completedGames: [],
            friends: []
        });

        // Auto-login after registration
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            score: 0,
            rank: 'Unranked',
            level: 1
        };

        res.redirect('/profile');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', {
            error: 'Registration failed. Please try again.',
            user: null,
            isLoggedIn: false,
            formData: {
                username: req.body.username || '',
                email: req.body.email || ''
            }
        });
    }
});

// Profile Route
app.get('/profile', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)
            .populate('friends.userId', 'username avatar level isOnline')
            .lean();

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        res.render('profile', {
            user: {
                ...user,
                avatar: user.avatar || '/images/default-avatar.jpg'
            },
            isLoggedIn: true
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).render('500', {
            user: null,
            isLoggedIn: false
        });
    }
});

// Leaderboard Route
app.get('/leaderboard', async (req, res) => {
    try {
        // Get top 100 players with only necessary fields
        const players = await User.find({}, 'username avatar score level achievements')
            .sort({ score: -1 })
            .limit(100)
            .lean();

        // Prepare clean data for the view
        const leaderboardData = players.map((player, index) => ({
            rank: index + 1,
            username: player.username || 'Anonymous',
            avatar: player.avatar || '/images/default-avatar.png',
            score: player.score || 0,
            level: player.level || 1,
            achievements: player.achievements || 0,
            game: 'All' // Default game filter
        }));

        res.render('leaderboard', {
            players: leaderboardData,
            currentUser: req.session.user || null,
            isLoggedIn: !!req.session.user,
            filters: {
                games: ['All', 'Valorant', 'Call of Duty', 'Fortnite']
            }
        });

    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).render('500', {
            user: null,
            isLoggedIn: false
        });
    }
});

// API Routes
app.post('/models/scores', requireLogin, async (req, res) => {
    try {
        const { game, score } = req.body;
        
        // Input validation
        if (!game || isNaN(score)) {
            return res.status(400).json({ error: 'Invalid game or score' });
        }

        const newScore = await Score.create({
            user: req.session.user.id,
            game: game,
            score: parseInt(score)
        });

        // Update user's total score and last activity
        await User.findByIdAndUpdate(req.session.user.id, {
            $inc: { score: parseInt(score) },
            lastActive: new Date()
        });

        res.status(201).json(newScore);
    } catch (err) {
        console.error('Score submission error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Static Pages
app.get('/about', (req, res) => {
    res.render('about', {
        user: req.session.user || null,
        isLoggedIn: !!req.session.user
    });
});

// Error Handling
app.use((req, res) => {
    res.status(404).render('404', {
        user: null,
        isLoggedIn: false
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    const errorTemplate = path.join(__dirname, 'views', '500.ejs');
    if (fs.existsSync(errorTemplate)) {
        res.status(500).render('500', {
            user: null,
            isLoggedIn: false
        });
    } else {
        res.status(500).send('500 - Server Error');
    }
});

// Server Start
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

// Handle server termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false, () => {
            process.exit(0);
        });
    });
});