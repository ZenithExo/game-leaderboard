const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);


router.post('/register', register);
router.post('/login', login);

module.exports = router;