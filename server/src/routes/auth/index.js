const express = require("express");
const rateLimit = require("express-rate-limit");
const env = require("../../config/env");
const { authRequired } = require("../../middleware/auth");
const authController = require("../../controllers/authController");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const moduleName = (req.body?.module || "unknown").toString().toLowerCase();
    const role = (req.body?.role || "unknown").toString().toLowerCase();
    const email = (req.body?.email || "unknown").toString().toLowerCase().trim();
    return `${moduleName}:${role}:${email}`;
  },
  message: { error: "Too many login attempts for this account. Try again in 15 minutes." }
});

router.post("/login", loginLimiter, authController.login);
router.post("/super/login", loginLimiter, authController.superLogin);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authRequired, authController.me);

module.exports = router;
