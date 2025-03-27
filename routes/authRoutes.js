const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Get current user (protected route)
router.get('/me', require('../middleware/authMiddleware'), authController.getMe);

module.exports = router;