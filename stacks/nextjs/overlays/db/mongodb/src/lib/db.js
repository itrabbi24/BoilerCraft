import mongoose from 'mongoose';

// Cached across hot reloads in development.
const cached = globalThis.__bcMongoose || (globalThis.__bcMongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/{{DB_NAME}}';
  cached.promise ||= mongoose.connect(uri);
  cached.conn = await cached.promise;
  return cached.conn;
}
