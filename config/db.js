// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Connection URI - defaults to local database if env var not set
    const DB_URI = process.env.MONGODB_URI || 
                  'mongodb://localhost:27017/game-leaderboard';

    // Modern Mongoose 6+ connection (removed deprecated options)
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ MongoDB Connected | Database: "${mongoose.connection.name}"`);
    
    // Debug: List collections (matches your screenshot)
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Collections:', collections.map(c => c.name).join(', '));

  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

// Enhanced connection events
mongoose.connection.on('connected', () => {
  console.log(`🟢 Mongoose connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔴 Mongoose disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`⛔ Mongoose error: ${err.message}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🚪 Mongoose connection closed (app termination)');
  process.exit(0);
});

module.exports = connectDB;