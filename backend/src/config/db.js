import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectMongoDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectMongoDB() {
  await mongoose.disconnect();
}
