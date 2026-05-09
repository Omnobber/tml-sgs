const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { query } = require("../db/pool");
const { findDemoUser, validateDemoPassword } = require("./demoAuthService");

async function findUserByEmailModuleRole(email, moduleName, role) {
  try {
    const result = await query(
      `SELECT id, name, email, password_hash, module, role, is_active
       FROM public.users
       WHERE email = $1 AND module = $2 AND role = $3`,
      [email.toLowerCase(), moduleName, role]
    );
    return result.rows[0] || null;
  } catch (error) {
    if (env.allowDemoAuthFallback && (error.code === "ECONNREFUSED" || error.code === "3D000")) {
      return findDemoUser(email, moduleName, role);
    }
    throw error;
  }
}

async function validatePassword(user, password) {
  if (user?.is_demo) {
    return validateDemoPassword(user, password);
  }
  return bcrypt.compare(password, user.password_hash);
}

async function listUsersByModule(moduleName) {
  const result = await query(
    `SELECT id, name, email, module, role, is_active, created_at
     FROM public.users WHERE module = $1 ORDER BY created_at DESC`,
    [moduleName]
  );
  return result.rows;
}

async function createModuleUser({ name, email, password, moduleName, role }) {
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const result = await query(
    `INSERT INTO public.users (name, email, password_hash, module, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, module, role, is_active, created_at`,
    [name, email.toLowerCase(), hash, moduleName, role]
  );
  return result.rows[0];
}

async function updateModuleUser({ id, name, role, isActive, moduleName }) {
  const result = await query(
    `UPDATE public.users
     SET name = COALESCE($2, name),
         role = COALESCE($3, role),
         is_active = COALESCE($4, is_active)
     WHERE id = $1 AND module = $5
     RETURNING id, name, email, module, role, is_active, created_at`,
    [id, name || null, role || null, isActive, moduleName]
  );
  return result.rows[0] || null;
}

module.exports = {
  findUserByEmailModuleRole,
  validatePassword,
  listUsersByModule,
  createModuleUser,
  updateModuleUser
};
