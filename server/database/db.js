// server/database/db.js
import mongoose from "mongoose";
import config from "../config.js";

const { uri, maxPoolSize, serverSelectionTimeoutSec, socketTimeoutSec } = config.db;

if (!uri) {
  throw new Error("MONGO_URI is not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      maxPoolSize,
      serverSelectionTimeoutMS: serverSelectionTimeoutSec * 1000,
      socketTimeoutMS: socketTimeoutSec * 1000,
      family: 4,
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
