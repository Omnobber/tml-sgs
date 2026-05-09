const { MODULES } = require("../utils/constants");
const { AppError } = require("../utils/errors");

function moduleGuard(moduleName) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    if (req.user.module === MODULES.SUPER) {
      req.scopeModule = moduleName;
      return next();
    }

    if (req.user.module !== moduleName) {
      return next(new AppError(403, "Module access denied"));
    }

    req.scopeModule = moduleName;
    return next();
  };
}

function roleGuard(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    if (req.user.role === "super_admin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Role access denied"));
    }

    return next();
  };
}

module.exports = { moduleGuard, roleGuard };
