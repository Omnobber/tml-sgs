const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { AppError } = require("../utils/errors");

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next(new AppError(401, "Missing access token"));
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = payload;
    return next();
  } catch (error) {
    return next(new AppError(401, "Invalid or expired token"));
  }
}

module.exports = { authRequired };
