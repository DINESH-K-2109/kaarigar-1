/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Skip prerendering pages that have dynamic route handlers
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Explicitly enable environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kaarigar',
    MONGODB_URI_ADMIN: process.env.MONGODB_URI_ADMIN || 'mongodb://localhost:27017/kaarigar_admin',
    MONGODB_URI_TRADESMEN: process.env.MONGODB_URI_TRADESMEN || 'mongodb://localhost:27017/kaarigar_tradesmen',
    MONGODB_URI_CUSTOMERS: process.env.MONGODB_URI_CUSTOMERS || 'mongodb://localhost:27017/kaarigar_customers',
    ADMIN_REGISTRATION_KEY: process.env.ADMIN_REGISTRATION_KEY || 'dineshksahu981767742',
    JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-change-this',
  },
  // Enable experimental features if needed
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig; 