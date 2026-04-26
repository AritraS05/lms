import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  // Fail fast (5s) instead of the default 30s, so a missing mongod is obvious.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('[db] connected to MongoDB');
}
