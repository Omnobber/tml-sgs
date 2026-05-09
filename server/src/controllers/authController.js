const { z } = require("zod");
const { AppError } = require("../utils/errors");
const { MODULES, ROLES } = require("../utils/constants");
const { findUserByEmailModuleRole, validatePassword } = require("../services/userService");
const { createAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken } = require("../services/tokenService");

const loginSchema = z.object({
  module: z.enum([MODULES.ERC, MODULES.FMS]),
  role: z.enum([ROLES.ADMIN, ROLES.ENGINEER, ROLES.CLIENT]),
  email: z.string().email(),
  password: z.string().min(8)
});

const superLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await findUserByEmailModuleRole(data.email, data.module, data.role);

    if (!user || !user.is_active) {
      throw new AppError(401, "Invalid credentials");
    }

    const ok = await validatePassword(user, data.password);
    if (!ok) {
      throw new AppError(401, "Invalid credentials");
    }

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        module: user.module,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

async function superLogin(req, res, next) {
  try {
    const data = superLoginSchema.parse(req.body);
    const user = await findUserByEmailModuleRole(data.email, MODULES.SUPER, ROLES.SUPER_ADMIN);

    if (!user || !user.is_active) {
      throw new AppError(401, "Invalid credentials");
    }

    const ok = await validatePassword(user, data.password);
    if (!ok) {
      throw new AppError(401, "Invalid credentials");
    }

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        module: user.module,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.body.refreshToken;
    if (!token) {
      throw new AppError(400, "refreshToken is required");
    }

    const payload = await rotateRefreshToken(token);
    res.json(payload);
  } catch (error) {
    next(new AppError(401, error.message || "Could not refresh token"));
  }
}

async function logout(req, res, next) {
  try {
    const token = req.body.refreshToken;
    if (!token) {
      throw new AppError(400, "refreshToken is required");
    }

    await revokeRefreshToken(token);
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  login,
  superLogin,
  refresh,
  logout,
  me
};
