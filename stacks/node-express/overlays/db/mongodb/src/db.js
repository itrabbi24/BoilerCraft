const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/{{DB_NAME}}';
  try {
    await mongoose.connect(uri);
    console.log('⚡ Connected to MongoDB (Mongoose)');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
}

module.exports = { connectDB };
