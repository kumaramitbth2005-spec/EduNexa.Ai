const mongoose = require('mongoose');
const dns = require('dns');

// Fallback to reliable public DNS resolvers to ensure MongoDB Atlas SRV lookups work across all ISPs/OSs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

let isConnecting = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n⚠️ [DATABASE WARNING] process.env.MONGODB_URI is not set.');
    console.warn('👉 In cloud hosting (Render), please add MONGODB_URI to your Render Environment Variables with your MongoDB Atlas connection string (mongodb+srv://...).');
    console.warn('👉 Server will stay active to serve frontend. Retrying connection in 10 seconds...\n');
    setTimeout(connectDB, 10000);
    return;
  }

  if (process.env.NODE_ENV === 'production' && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
    console.warn('\n⚠️ [DATABASE WARNING] MONGODB_URI is configured as localhost/127.0.0.1 in production.');
    console.warn('👉 Render containers cannot access localhost MongoDB. Please update MONGODB_URI in Render Dashboard with a MongoDB Atlas cloud URI.\n');
  }

  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    isConnecting = false;

    // Resilient server: Do NOT crash with process.exit(1).
    // Keep HTTP server alive for health checks & frontend serving, and retry in background.
    console.warn('⚠️ Server remains online. Retrying database connection in 10 seconds...');
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;


