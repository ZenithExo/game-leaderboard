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
    maxlength: [20, 'Username cannot exceed 20 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
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
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
    validate: {
      validator: function(v) {
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase, one lowercase, one number, and one special character'
    }
  },
  avatar: {
    type: String,
    default: 'https://i.pinimg.com/736x/2e/4e/32/2e4e325e91cdd85b86ae78dace760ecd.jpg',
    validate: {
      validator: function(v) {
        return validator.isURL(v, { protocols: ['http','https'], require_protocol: true });
      },
      message: 'Avatar must be a valid URL with http/https protocol'
    }
  },
  level: {
    type: Number,
    default: 1,
    min: [1, 'Level cannot be less than 1'],
    max: [100, 'Level cannot exceed 100']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  achievements: {
    type: Number,
    default: 0,
    min: [0, 'Achievements cannot be negative']
  },
  perfectGames: {
    type: Number,
    default: 0,
    min: [0, 'Perfect games cannot be negative']
  },
  completionRate: {
    type: String,
    default: '0%',
    validate: {
      validator: function(v) {
        return /^\d{1,3}%$/.test(v);
      },
      message: 'Completion rate must be a percentage (0-100%)'
    }
  },
  recentGames: [{
    name: {
      type: String,
      required: [true, 'Game name is required'],
      trim: true
    },
    hours: {
      type: Number,
      required: [true, 'Hours played is required'],
      min: [0, 'Hours cannot be negative']
    },
    image: {
      type: String,
      required: [true, 'Game image is required'],
      validate: {
        validator: function(v) {
          return validator.isURL(v, { protocols: ['http','https'], require_protocol: true });
        },
        message: 'Game image must be a valid URL with http/https protocol'
      }
    }
  }],
  completedGames: [{
    name: {
      type: String,
      required: [true, 'Game name is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Game image is required'],
      validate: {
        validator: function(v) {
          return validator.isURL(v, { protocols: ['http','https'], require_protocol: true });
        },
        message: 'Game image must be a valid URL with http/https protocol'
      }
    }
  }],
  friends: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Friend user ID is required']
    },
    name: {
      type: String,
      required: [true, 'Friend name is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    },
    avatar: {
      type: String,
      default: 'https://i.pinimg.com/736x/2e/4e/32/2e4e325e91cdd85b86ae78dace760ecd.jpg',
      validate: {
        validator: function(v) {
          return validator.isURL(v, { protocols: ['http','https'], require_protocol: true });
        },
        message: 'Friend avatar must be a valid URL with http/https protocol'
      }
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  timestamps: true
});

// Virtual for friends count
userSchema.virtual('friendsCount').get(function() {
  return this.friends.length;
});

// Virtual for account age in days
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Update lastActive timestamp before any update
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastActive: new Date() });
  next();
});

// Compare entered password with hashed password
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method for login
userSchema.statics.login = async function(email, password) {
  // 1) Check if email and password exist
  if (!email || !password) {
    throw new Error('Please provide email and password');
  }

  // 2) Find user by email and select password
  const user = await this.findOne({ email }).select('+password');

  // 3) If user doesn't exist or password is incorrect
  if (!user || !(await user.correctPassword(password))) {
    throw new Error('Incorrect email or password');
  }

  // 4) Update lastActive timestamp
  user.lastActive = new Date();
  await user.save({ validateBeforeSave: false });

  // 5) Return user without password
  user.password = undefined;
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

// Query middleware to always populate friends
userSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'friends.userId',
    select: 'username avatar level isOnline'
  });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;