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

// Enhanced Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-123',
    resave: true, // Changed to true for better session handling
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/game-leaderboard',
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' // Changed to lax for better cross-site compatibility
    }
}));

// Session Debugging Middleware
app.use((req, res, next) => {
    console.log('Session status:', req.sessionID);
    console.log('Session data:', req.session);
    next();
});

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
        req.session.returnTo = req.originalUrl;
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

        const topPlayers = await User.find()
            .sort({ score: -1 })
            .limit(5)
            .select('username avatar score')
            .lean();
        
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

// Enhanced Login Route with Debugging
app.get('/login', (req, res) => {
    if (req.session.user) {
        console.log('User already logged in, redirecting to profile');
        return res.redirect('/profile');
    }
    res.render('login', { 
        error: null, 
        email: '',
        user: null,
        isLoggedIn: false,
        returnTo: req.session.returnTo || '/profile'
    });
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const returnTo = req.session.returnTo || '/profile';
        
        console.log('Login attempt for email:', email);
        
        if (!email || !password) {
            console.log('Missing email or password');
            return res.render('login', {
                error: 'Please provide both email and password',
                email,
                user: null,
                isLoggedIn: false
            });
        }

        console.log('Looking for user in database...');
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('User not found for email:', email);
            return res.render('login', {
                error: 'Invalid email or password',
                email,
                user: null,
                isLoggedIn: false
            });
        }

        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', user.username);
            return res.render('login', {
                error: 'Invalid email or password',
                email,
                user: null,
                isLoggedIn: false
            });
        }

        console.log('Login successful for:', user.username);
        
        // Set session data
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || 'https://gravatar.com/avatar/1ceb93ead2d2c15f0ca52c6c87f11ed9?s=400&d=robohash&r=x',
            score: user.score || 0,
            rank: user.rank || 'Unranked',
            level: user.level || 1
        };

        console.log('Session after login:', req.session);
        
        // Ensure session is saved before redirect
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).render('login', {
                    error: 'Server error during login',
                    email,
                    user: null,
                    isLoggedIn: false
                });
            }
            
            delete req.session.returnTo;
            console.log('Redirecting to:', returnTo);
            return res.redirect(returnTo);
        });

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
    console.log('Logging out user:', req.session.user?.username);
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.redirect('/profile');
        }
        res.redirect('/');
    });
});

// Enhanced Register Route
app.get('/register', (req, res) => {
    if (req.session.user) {
        console.log('User already logged in, redirecting to profile');
        return res.redirect('/profile');
    }
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
        
        console.log('Registration attempt:', { username, email });

        if (!username || !email || !password || !confirmPassword) {
            console.log('Missing required fields');
            return res.render('register', {
                error: 'All fields are required',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        if (password !== confirmPassword) {
            console.log('Password mismatch');
            return res.render('register', {
                error: 'Passwords do not match',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        if (password.length < 8) {
            console.log('Password too short');
            return res.render('register', {
                error: 'Password must be at least 8 characters',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        console.log('Checking for existing user...');
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.log('User already exists:', existingUser.email);
            return res.render('register', {
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
                user: null,
                isLoggedIn: false,
                formData: { username, email }
            });
        }

        console.log('Creating new user...');
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            score: 0,
            avatar: 'https://gravatar.com/avatar/1ceb93ead2d2c15f0ca52c6c87f11ed9?s=400&d=robohash&r=x',
            recentGames: [],
            completedGames: [],
            friends: []
        });

        console.log('User created:', user.username);
        
        // Set session data
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            score: 0,
            rank: 'Unranked',
            level: 1
        };

        // Ensure session is saved before redirect
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('register', {
                    error: 'Registration complete but login failed',
                    user: null,
                    isLoggedIn: false,
                    formData: { username, email }
                });
            }
            console.log('Redirecting to profile');
            res.redirect('/profile');
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', {
            error: 'Registration failed. Please try different credentials.',
            user: null,
            isLoggedIn: false,
            formData: {
                username: req.body.username || '',
                email: req.body.email || ''
            }
        });
    }
});

// Enhanced Profile Route
app.get('/profile', requireLogin, async (req, res) => {
    try {
        console.log('Profile access for:', req.session.user.username);
        
        const user = await User.findById(req.session.user.id)
            .populate('friends.userId', 'username avatar level isOnline')
            .lean();

        if (!user) {
            console.log('User not found in DB - destroying session');
            req.session.destroy();
            return res.redirect('/login');
        }

        res.render('profile', {
            user: {
                ...user,
                avatar: user.avatar || 'https://gravatar.com/avatar/1ceb93ead2d2c15f0ca52c6c87f11ed9?s=400&d=robohash&r=x'
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
        const players = await User.find({}, 'username avatar score level achievements')
            .sort({ score: -1 })
            .limit(100)
            .lean();

        const leaderboardData = players.map((player, index) => ({
            rank: index + 1,
            username: player.username || 'Anonymous',
            avatar: player.avatar || 'https://i.pinimg.com/736x/b1/94/74/b1947450a6a5f8eacdd349f0c99b2698.jpg',
            score: player.score || 0,
            level: player.level || 1,
            achievements: player.achievements || 0,
            game: 'All'
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
        
        if (!game || isNaN(score)) {
            return res.status(400).json({ error: 'Invalid game or score' });
        }

        const newScore = await Score.create({
            user: req.session.user.id,
            game: game,
            score: parseInt(score)
        });

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