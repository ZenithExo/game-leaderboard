const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      user: userResponse, 
      token 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please provide username and password' });
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      user: userResponse, 
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
};