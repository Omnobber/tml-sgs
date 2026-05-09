const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: process.env.ENV_FILE || path.resolve(process.cwd(), ".env") });

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "8h",
  refreshTokenExpiryDays: Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS || 7),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5),
  allowDemoAuthFallback: (process.env.ALLOW_DEMO_AUTH_FALLBACK || "true").toLowerCase() === "true"
};
