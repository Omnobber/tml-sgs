const { query } = require("../db/pool");

async function recordAudit({ userId, moduleName, action, entityType, entityId, payload }) {
  await query(
    `INSERT INTO public.audit_logs (user_id, module, action, entity_type, entity_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId || null, moduleName || null, action, entityType, entityId || null, payload || null]
  );
}

module.exports = { recordAudit };
