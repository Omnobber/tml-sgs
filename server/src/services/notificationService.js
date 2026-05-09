const { query } = require("../db/pool");
const { resolveSchema } = require("./moduleService");

async function listNotifications(moduleName, userId) {
  const schema = resolveSchema(moduleName);
  const result = await query(
    `SELECT * FROM ${schema}.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [userId]
  );
  return result.rows;
}

async function createNotification(moduleName, userId, message) {
  const schema = resolveSchema(moduleName);
  await query(
    `INSERT INTO ${schema}.notifications (user_id, message) VALUES ($1, $2)`,
    [userId, message]
  );
}

async function markRead(moduleName, notificationId, userId) {
  const schema = resolveSchema(moduleName);
  const result = await query(
    `UPDATE ${schema}.notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

module.exports = { listNotifications, createNotification, markRead };
