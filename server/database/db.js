import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      maxPoolSize: 5, // low pool for edge environments
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // IPv4 only (avoids edge DNS stalls)
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected (edge safe)");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB edge connection failed:", error);
    throw error;
  }
}
