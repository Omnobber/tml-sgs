const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { query } = require("../db/pool");

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      module: user.module,
      role: user.role
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenExpiry }
  );
}

async function createRefreshToken(user) {
  if (env.allowDemoAuthFallback && user?.is_demo) {
    return jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        module: user.module,
        role: user.role,
        type: "refresh"
      },
      env.jwtRefreshSecret,
      { expiresIn: `${env.refreshTokenExpiryDays}d` }
    );
  }

  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + env.refreshTokenExpiryDays * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return rawToken;
}

async function rotateRefreshToken(rawToken) {
  if (env.allowDemoAuthFallback) {
    try {
      const payload = jwt.verify(rawToken, env.jwtRefreshSecret);
      if (payload?.type === "refresh") {
        const user = {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          module: payload.module,
          role: payload.role,
          is_demo: true
        };
        return {
          accessToken: createAccessToken(user),
          refreshToken: await createRefreshToken(user),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            module: user.module,
            role: user.role
          }
        };
      }
    } catch (error) {
      // Fall back to DB-based refresh lookup below.
    }
  }

  const rows = await query(
    `SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, u.id as user_id2, u.name, u.email, u.module, u.role, u.is_active
     FROM public.refresh_tokens rt
     JOIN public.users u ON u.id = rt.user_id
     WHERE rt.revoked_at IS NULL
     ORDER BY rt.created_at DESC`
  );

  for (const row of rows.rows) {
    const isMatch = await bcrypt.compare(rawToken, row.token_hash);
    if (!isMatch) {
      continue;
    }

    if (new Date(row.expires_at) < new Date()) {
      throw new Error("Refresh token expired");
    }

    if (!row.is_active) {
      throw new Error("User inactive");
    }

    await query(`UPDATE public.refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [row.id]);

    const user = {
      id: row.user_id2,
      name: row.name,
      email: row.email,
      module: row.module,
      role: row.role
    };

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    return { accessToken, refreshToken, user };
  }

  throw new Error("Invalid refresh token");
}

async function revokeRefreshToken(rawToken) {
  if (env.allowDemoAuthFallback) {
    try {
      const payload = jwt.verify(rawToken, env.jwtRefreshSecret);
      if (payload?.type === "refresh") {
        return true;
      }
    } catch (error) {
      // Ignore and continue with DB token revocation attempt.
    }
  }

  const rows = await query(
    `SELECT id, token_hash FROM public.refresh_tokens WHERE revoked_at IS NULL ORDER BY created_at DESC`
  );

  for (const row of rows.rows) {
    const isMatch = await bcrypt.compare(rawToken, row.token_hash);
    if (isMatch) {
      await query(`UPDATE public.refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [row.id]);
      return true;
    }
  }

  return false;
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken
};
