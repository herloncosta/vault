import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimitWindowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMax: Number.parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
};

export default env;
