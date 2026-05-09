const { query } = require("../db/pool");
const { resolveSchema } = require("./moduleService");

async function listCalls({ moduleName, user, filters }) {
  const schema = resolveSchema(moduleName);
  const clauses = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`c.status = $${values.length}`);
  }

  if (filters.priority) {
    values.push(filters.priority);
    clauses.push(`c.priority = $${values.length}`);
  }

  if (filters.assignedTo) {
    values.push(filters.assignedTo);
    clauses.push(`c.assigned_to = $${values.length}`);
  }

  if (filters.fromDate) {
    values.push(filters.fromDate);
    clauses.push(`c.created_at >= $${values.length}`);
  }

  if (filters.toDate) {
    values.push(filters.toDate);
    clauses.push(`c.created_at <= $${values.length}`);
  }

  if (moduleName === "sgs-fms" && filters.vehicleNumber) {
    values.push(filters.vehicleNumber);
    clauses.push(`c.vehicle_number = $${values.length}`);
  }

  if (user.role === "client") {
    values.push(user.sub);
    clauses.push(`c.created_by = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await query(
    `SELECT c.*, u1.name AS assigned_to_name, u2.name AS created_by_name
     FROM ${schema}.call_logs c
     LEFT JOIN public.users u1 ON u1.id = c.assigned_to
     LEFT JOIN public.users u2 ON u2.id = c.created_by
     ${where}
     ORDER BY c.updated_at DESC`
    , values
  );

  return result.rows;
}

async function createCall({ moduleName, payload, user }) {
  const schema = resolveSchema(moduleName);
  const referenceNo = `${moduleName === "sgs-erc" ? "ERC" : "FMS"}-${Date.now()}`;

  const result = await query(
    `INSERT INTO ${schema}.call_logs
      (reference_no, caller_name, contact, location, issue_type, priority, status, assigned_to, description, created_by, vehicle_number, severity)
     VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      referenceNo,
      payload.callerName,
      payload.contact,
      payload.location,
      payload.issueType,
      payload.priority,
      payload.assignedTo || null,
      payload.description,
      user.sub,
      payload.vehicleNumber || null,
      payload.severity || null
    ]
  );

  return result.rows[0];
}

async function getCallById({ moduleName, id, user }) {
  const schema = resolveSchema(moduleName);
  const params = [id];
  let roleClause = "";

  if (user.role === "client") {
    params.push(user.sub);
    roleClause = `AND c.created_by = $2`;
  }

  const callResult = await query(
    `SELECT c.*, u1.name AS assigned_to_name, u2.name AS created_by_name
     FROM ${schema}.call_logs c
     LEFT JOIN public.users u1 ON u1.id = c.assigned_to
     LEFT JOIN public.users u2 ON u2.id = c.created_by
     WHERE c.id = $1 ${roleClause}`,
    params
  );

  const call = callResult.rows[0];
  if (!call) return null;

  const updates = await query(
    `SELECT cu.*, u.name AS updated_by_name
     FROM ${schema}.call_updates cu
     JOIN public.users u ON u.id = cu.updated_by
     WHERE cu.call_log_id = $1
     ORDER BY cu.timestamp ASC`,
    [id]
  );

  const attachments = await query(
    `SELECT a.*, u.name AS uploaded_by_name
     FROM ${schema}.attachments a
     JOIN public.users u ON u.id = a.uploaded_by
     WHERE a.call_log_id = $1
     ORDER BY a.uploaded_at DESC`,
    [id]
  );

  return { ...call, updates: updates.rows, attachments: attachments.rows };
}

async function updateCall({ moduleName, id, payload, user }) {
  const schema = resolveSchema(moduleName);

  const currentResult = await query(`SELECT * FROM ${schema}.call_logs WHERE id = $1`, [id]);
  const current = currentResult.rows[0];
  if (!current) return null;

  if (user.role === "client" && current.created_by !== user.sub) {
    return null;
  }

  const status = payload.status || current.status;

  const result = await query(
    `UPDATE ${schema}.call_logs
     SET status = COALESCE($2, status),
         assigned_to = COALESCE($3, assigned_to),
         priority = COALESCE($4, priority),
         description = COALESCE($5, description),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, payload.status || null, payload.assignedTo || null, payload.priority || null, payload.description || null]
  );

  await query(
    `INSERT INTO ${schema}.call_updates (call_log_id, updated_by, status, comment)
     VALUES ($1, $2, $3, $4)`,
    [id, user.sub, status, payload.comment || "Status update"]
  );

  return result.rows[0];
}

async function createAttachment({ moduleName, callLogId, filePath, user }) {
  const schema = resolveSchema(moduleName);
  const result = await query(
    `INSERT INTO ${schema}.attachments (call_log_id, file_path, uploaded_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [callLogId, filePath, user.sub]
  );
  return result.rows[0];
}

module.exports = {
  listCalls,
  createCall,
  getCallById,
  updateCall,
  createAttachment
};
