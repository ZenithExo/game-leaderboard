// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'https://i.pinimg.com/736x/2e/4e/32/2e4e325e91cdd85b86ae78dace760ecd.jpg'
  },
  level: {
    type: Number,
    default: 1
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  achievements: {
    type: Number,
    default: 0
  },
  perfectGames: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: String,
    default: '0%'
  },
  recentGames: [{
    name: String,
    hours: Number,
    image: String
  }],
  completedGames: [{
    name: String,
    image: String
  }],
  friends: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    avatar: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for friends count
userSchema.virtual('friendsCount').get(function() {
  return this.friends.length;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with hashed password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Static method for login
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Incorrect email or password');
  }
  
  const isMatch = await user.correctPassword(password, user.password);
  
  if (!isMatch) {
    throw new Error('Incorrect email or password');
  }
  
  return user;
};

// Add default recent games if empty
userSchema.pre('save', function(next) {
  if (this.recentGames.length === 0) {
    this.recentGames = [
      { 
        name: 'Metal Gear Rising Revengence', 
        hours: 61, 
        image: 'https://wp-uploads.qualbert.com/2022/05/MGR-Retrospective.png' 
      },
      { 
        name: 'Cyberpunk 2077', 
        hours: 45, 
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' 
      },
      { 
        name: 'God of War', 
        hours: 30, 
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png' 
      }
    ];
  }
  
  if (this.completedGames.length === 0) {
    this.completedGames = [
      { 
        name: 'Red Dead Redemption 2', 
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg' 
      },
      { 
        name: 'Cyberpunk 2077', 
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' 
      },
      { 
        name: 'Sekiro', 
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/814380/header.jpg' 
      }
    ];
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;