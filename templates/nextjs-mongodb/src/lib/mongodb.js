const mongoose = require('mongoose');

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/{{PROJECT_NAME}}';
  try {
    const db = await mongoose.connect(uri);
    isConnected = db.connections[0].readyState;
    console.log('⚡ Connected to MongoDB (Next.js App Router)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}
