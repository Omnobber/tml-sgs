const { query, pool, isMySQL, translateSchemaSql } = require("../db/pool");
const fallbackStore = require("./fmsFallbackStore");
const { AppError } = require("../utils/errors");

const LOOKUP_TABLES = {
  divisions: "fms.divisions",
  areas: "fms.areas",
  categories: "fms.call_categories",
  assetTypes: "fms.asset_types"
};

const BATCH_SIZE = 250;

function dbUnavailable(error) {
  return (
    error &&
    (error.code === "ECONNREFUSED" ||
      error.code === "ECONNRESET" ||
      error.code === "ETIMEDOUT" ||
      error.code === "3D000" ||
      error.code === "42P01" ||
      error.code === "57P01" ||
      error.code === "57P03")
  );
}

function isUniqueViolation(error) {
  return error && (error.code === "23505" || error.code === "ER_DUP_ENTRY");
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeStatus(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) return "open";
  if (text === "closed") return "closed";
  if (text === "hold" || text === "on_hold") return "hold";
  if (text === "in progress" || text === "in_progress") return "in_progress";
  return text.replace(/\s+/g, "_");
}

function toNumber(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function parseDateTime(value) {
  const text = cleanText(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return text;
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => cleanText(row[key])).filter(Boolean))];
}

function normalizeRow(row) {
  return {
    rowNumber: row.rowNumber || null,
    incidentNo: cleanText(row.incidentNo),
    month: cleanText(row.month),
    callOpenDate: parseDateTime(row.callOpenDate),
    division: cleanText(row.division),
    area: cleanText(row.area),
    machine: cleanText(row.machine),
    assetNo: cleanText(row.assetNo),
    equipmentName: cleanText(row.equipmentName),
    assetNonAsset: cleanText(row.assetNonAsset) || "Assets",
    natureOfCall: cleanText(row.natureOfCall),
    assetType: cleanText(row.assetType),
    callCategory: cleanText(row.callCategory),
    equipment: cleanText(row.equipment) || "N/A",
    repeated: cleanText(row.repeated) || "NO",
    reportedBy: cleanText(row.reportedBy),
    description: cleanText(row.description),
    attendedBy: cleanText(row.attendedBy),
    attendDate: parseDateTime(row.attendDate),
    actionTaken: cleanText(row.actionTaken),
    status: normalizeStatus(row.status),
    closedDate: parseDateTime(row.closedDate),
    responseMinutes: toNumber(row.responseMinutes),
    resolutionMinutes: toNumber(row.resolutionMinutes),
    downtimeMinutes: toNumber(row.downtimeMinutes),
    pendingSide: cleanText(row.pendingSide),
    remarks: cleanText(row.remarks)
  };
}

function validateRow(row) {
  const errors = [];
  if (!row.incidentNo) errors.push("Incident No is required");
  if (!row.month) errors.push("Month is required");
  if (!row.callOpenDate) errors.push("Call Open Date / Time is required");
  if (!row.division) errors.push("Division is required");
  if (!row.area) errors.push("Area is required");
  if (!row.machine) errors.push("Device / Machine Name is required");
  if (!row.natureOfCall) errors.push("Nature of Call is required");
  if (!row.assetType) errors.push("Type of Assets is required");
  if (!row.callCategory) errors.push("Call Category is required");
  if (!row.description) errors.push("Call Description is required");
  if (!row.status) errors.push("Status is required");
  return errors;
}

function buildBreakdownInsertRow(row, batchId, userId) {
  return [
    row.incidentNo,
    row.incidentNo,
    row.month,
    row.callOpenDate,
    row.division,
    row.area,
    row.machine,
    row.assetNo || null,
    row.equipmentName || null,
    row.assetNonAsset || null,
    row.natureOfCall || null,
    row.assetType || null,
    row.callCategory || null,
    row.equipment || null,
    row.repeated || null,
    row.reportedBy || null,
    row.description || null,
    row.attendedBy || null,
    row.attendDate || null,
    row.actionTaken || null,
    row.status || "open",
    row.closedDate || null,
    row.responseMinutes,
    row.resolutionMinutes,
    row.downtimeMinutes,
    row.pendingSide || null,
    row.remarks || null,
    batchId,
    row.reportedBy || row.division || "Imported Caller",
    "N/A",
    row.area || row.division || "Imported Location",
    row.natureOfCall || "Imported Call",
    "medium",
    row.description || "Imported FMS call",
    row.machine || null,
    row.assetType || null,
    userId
  ];
}

function buildInsertPlaceholders(rowCount, columnCount, startIndex = 1) {
  const parts = [];
  let parameterIndex = startIndex;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const rowParts = [];
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      rowParts.push(`$${parameterIndex += 0}`);
    }
    parts.push(`(${rowParts.join(", ")})`);
  }
  return parts.join(", ");
}

async function withTransaction(handler) {
  if (isMySQL) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const txQuery = async (sql, params = []) => {
        const [rows, fields] = await connection.query(translateSchemaSql(sql), params);
        if (Array.isArray(rows)) {
          return { rows, fields, rowCount: rows.length };
        }
        return {
          rows: [],
          fields,
          rowCount: rows.affectedRows ?? 0,
          affectedRows: rows.affectedRows ?? 0,
          changedRows: rows.changedRows ?? 0,
          insertId: rows.insertId ?? null
        };
      };
      const result = await handler(txQuery);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const txQuery = async (sql, params = []) => client.query(sql, params);
    const result = await handler(txQuery);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureLookupRows(txQuery, table, values) {
  const unique = [...new Set(values.map(cleanText).filter(Boolean))];
  if (!unique.length) return;

  for (let index = 0; index < unique.length; index += BATCH_SIZE) {
    const chunk = unique.slice(index, index + BATCH_SIZE);
    const params = [];
    const placeholders = chunk.map((value) => {
      params.push(value);
      return `($${params.length})`;
    });

    const insertSql = isMySQL
      ? `INSERT IGNORE INTO ${table} (name) VALUES ${placeholders.join(", ")}`
      : `INSERT INTO ${table} (name) VALUES ${placeholders.join(", ")} ON CONFLICT (name) DO NOTHING`;
    await txQuery(insertSql, params);
  }
}

async function ensureAreaRows(txQuery, rows) {
  const unique = [];
  const seen = new Set();
  rows.forEach((row) => {
    const division = cleanText(row.division);
    const area = cleanText(row.area);
    if (!division || !area) return;
    const key = `${division.toLowerCase()}::${area.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({ division, area });
  });

  if (!unique.length) return;

  for (let index = 0; index < unique.length; index += BATCH_SIZE) {
    const chunk = unique.slice(index, index + BATCH_SIZE);
    const params = [];
    const placeholders = chunk.map((item) => {
      params.push(item.division, item.area);
      const divIndex = params.length - 1;
      const areaIndex = params.length;
      return `($${divIndex}, $${areaIndex})`;
    });

    const insertSql = isMySQL
      ? `INSERT IGNORE INTO ${LOOKUP_TABLES.areas} (division_name, name) VALUES ${placeholders.join(", ")}`
      : `INSERT INTO ${LOOKUP_TABLES.areas} (division_name, name) VALUES ${placeholders.join(", ")} ON CONFLICT (division_name, name) DO NOTHING`;
    await txQuery(insertSql, params);
  }
}

async function insertAuditLogs(txQuery, rows, batchId, userId) {
  if (!rows.length) return;
  const params = [];
  const placeholders = rows.map((row) => {
    const base = params.length;
    params.push(
      userId,
      "sgs-fms",
      "import",
      "call_log",
      row.incidentNo,
      JSON.stringify({ batchId, incidentNo: row.incidentNo, source: "excel-import" })
    );
    return isMySQL
      ? "(?, ?, ?, ?, ?, ?)"
      : `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  });

  const sql = `INSERT INTO public.audit_logs (user_id, module, action, entity_type, entity_id, payload) VALUES ${placeholders.join(", ")}`;
  await txQuery(sql, params);
}

async function insertErrorLogs(txQuery, batchId, errors) {
  if (!errors.length) return;
  const params = [];
  const placeholders = errors.map((error) => {
    const base = params.length;
    const payload = JSON.stringify(error.row);
    params.push(batchId, error.rowNumber, error.incidentNo || null, error.message, payload);
    return isMySQL
      ? "(?, ?, ?, ?, ?)"
      : `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  const sql = `INSERT INTO fms.import_errors (batch_id, row_number, incident_no, error_message, row_data) VALUES ${placeholders.join(", ")}`;
  await txQuery(sql, params);
}

async function getBatchByImportKey(txQuery, importKey) {
  const result = await txQuery(
    `SELECT id, import_key, total_rows, imported_rows, skipped_rows, failed_rows, status
     FROM fms.import_batches
     WHERE import_key = $1`,
    [importKey]
  );
  return result.rows[0] || null;
}

async function upsertBatch(txQuery, payload) {
  const insertSql = isMySQL
    ? `INSERT INTO fms.import_batches
        (import_key, file_name, uploader_id, uploader_name, file_size_bytes, total_rows, status)
       VALUES (?, ?, ?, ?, ?, ?, 'processing')
       ON DUPLICATE KEY UPDATE
         file_name = VALUES(file_name),
         uploader_id = VALUES(uploader_id),
         uploader_name = VALUES(uploader_name),
         file_size_bytes = VALUES(file_size_bytes),
         total_rows = VALUES(total_rows),
         updated_at = CURRENT_TIMESTAMP`
    : `INSERT INTO fms.import_batches
        (import_key, file_name, uploader_id, uploader_name, file_size_bytes, total_rows, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing')
       ON CONFLICT (import_key) DO UPDATE SET
         file_name = EXCLUDED.file_name,
         uploader_id = EXCLUDED.uploader_id,
         uploader_name = EXCLUDED.uploader_name,
         file_size_bytes = EXCLUDED.file_size_bytes,
         total_rows = EXCLUDED.total_rows,
         updated_at = NOW()
       RETURNING id, import_key, total_rows, imported_rows, skipped_rows, failed_rows, status`;

  const result = await txQuery(insertSql, [
    payload.importKey,
    payload.fileName,
    payload.uploaderId,
    payload.uploaderName,
    payload.fileSizeBytes || null,
    payload.totalRows || 0
  ]);

  if (isMySQL) {
    const lookup = await txQuery(
      `SELECT id, import_key, total_rows, imported_rows, skipped_rows, failed_rows, status
       FROM fms.import_batches
       WHERE import_key = ?`,
      [payload.importKey]
    );
    return lookup.rows[0];
  }
  return result.rows[0];
}

function buildInsertSql(rowCount) {
  const columns = [
    "reference_no",
    "call_no",
    "month",
    "call_open_dt",
    "division",
    "area",
    "machine",
    "asset_no",
    "equipment_name",
    "asset_non_asset",
    "nature_of_call",
    "type_of_assets",
    "call_category",
    "equipment_materials",
    "repeated_call",
    "problem_reported_by",
    "description",
    "call_attended_by",
    "call_attend_dt",
    "action_taken",
    "status",
    "call_closed_dt",
    "response_time_min",
    "resolution_time_min",
    "downtime_min",
    "pending_side",
    "remarks",
    "import_batch_id",
    "caller_name",
    "contact",
    "location",
    "issue_type",
    "priority",
    "problem_desc",
    "vehicle_number",
    "severity",
    "created_by"
  ];

  const rowPlaceholders = [];
  const params = [];
  for (let index = 0; index < rowCount; index += 1) {
    const offset = index * columns.length;
    const placeholders = columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`);
    rowPlaceholders.push(`(${placeholders.join(", ")})`);
  }

  return {
    columns,
    params,
    sql: `INSERT INTO fms.call_logs (${columns.join(", ")}) VALUES ${rowPlaceholders.join(", ")}`
  };
}

async function queryExistingIncidentNos(txQuery, incidentNos) {
  const unique = [...new Set(incidentNos.map(cleanText).filter(Boolean))];
  const existing = new Set();
  for (let index = 0; index < unique.length; index += BATCH_SIZE) {
    const chunk = unique.slice(index, index + BATCH_SIZE);
    const params = [];
    const placeholders = chunk.map((value) => {
      params.push(value);
      return `$${params.length}`;
    });
    const result = await txQuery(
      `SELECT reference_no
       FROM fms.call_logs
       WHERE reference_no IN (${placeholders.join(", ")})`,
      params
    );
    result.rows.forEach((row) => existing.add(cleanText(row.reference_no).toLowerCase()));
  }
  return existing;
}

function mapDbCall(row) {
  if (!row) return null;
  return {
    id: row.id,
    incidentNo: row.reference_no,
    clientRequestId: row.client_request_id || "",
    month: row.month || "",
    callOpenDate: row.call_open_dt || "",
    division: row.division || "",
    area: row.area || "",
    machine: row.machine || "",
    assetNo: row.asset_no || "",
    equipmentName: row.equipment_name || "",
    assetNonAsset: row.asset_non_asset || "",
    natureOfCall: row.nature_of_call || "",
    assetType: row.type_of_assets || "",
    callCategory: row.call_category || "",
    equipment: row.equipment_materials || "",
    repeated: row.repeated_call || "",
    reportedBy: row.problem_reported_by || "",
    description: row.description || "",
    attendedBy: row.call_attended_by || "",
    attendDate: row.call_attend_dt || "",
    actionTaken: row.action_taken || "",
    status: String(row.status || "").toUpperCase(),
    closedDate: row.call_closed_dt || "",
    responseMinutes: row.response_time_min ?? null,
    resolutionMinutes: row.resolution_time_min ?? null,
    downtimeMinutes: row.downtime_min ?? null,
    pendingSide: row.pending_side || "",
    remarks: row.remarks || "",
    importBatchId: row.import_batch_id || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

const CALL_LOG_FIELDS = [
  "reference_no",
  "call_no",
  "month",
  "call_open_dt",
  "division",
  "area",
  "machine",
  "asset_no",
  "equipment_name",
  "asset_non_asset",
  "nature_of_call",
  "type_of_assets",
  "call_category",
  "equipment_materials",
  "repeated_call",
  "problem_reported_by",
  "call_description",
  "call_attended_by",
  "call_attend_dt",
  "action_taken",
  "call_closed_dt",
  "response_time_min",
  "resolution_time_min",
  "downtime_min",
  "pending_side",
  "remarks",
  "import_batch_id",
  "caller_name",
  "contact",
  "location",
  "issue_type",
  "priority",
  "status",
  "assigned_to",
  "description",
  "created_by",
  "vehicle_number",
  "severity"
];

function formatMonthLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleString("en-US", { month: "short", year: "2-digit" })
    .toUpperCase()
    .replace(" ", "-");
}

function buildFmsCallRow(payload = {}, user = {}) {
  const normalized = normalizeRow(payload);
  const now = new Date().toISOString();
  const callOpenDate = normalized.callOpenDate || parseDateTime(payload.callOpenDate) || now;
  const month = normalized.month || formatMonthLabel(callOpenDate) || formatMonthLabel(now);
  const referenceNo =
    cleanText(payload.referenceNo) ||
    cleanText(payload.reference_no) ||
    normalized.incidentNo ||
    cleanText(payload.callNo) ||
    `FMS-${Date.now()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;
  const status = normalizeStatus(normalized.status || payload.status || "open");
  const closedDate = normalized.closedDate || (status === "closed" ? now : null);

  return {
    reference_no: referenceNo,
    call_no: cleanText(payload.callNo) || referenceNo,
    month,
    call_open_dt: callOpenDate,
    division: normalized.division || cleanText(payload.division) || cleanText(payload.department) || "",
    area: normalized.area || cleanText(payload.area) || cleanText(payload.location) || "",
    machine: normalized.machine || cleanText(payload.machine) || cleanText(payload.vehicleNumber) || cleanText(payload.issueType) || "",
    asset_no: normalized.assetNo || cleanText(payload.assetNo) || null,
    equipment_name: normalized.equipmentName || cleanText(payload.equipmentName) || null,
    asset_non_asset: normalized.assetNonAsset || cleanText(payload.assetNonAsset) || "Assets",
    nature_of_call: normalized.natureOfCall || cleanText(payload.natureOfCall) || cleanText(payload.issueType) || "Project Call",
    type_of_assets: normalized.assetType || cleanText(payload.assetType) || cleanText(payload.severity) || null,
    call_category: normalized.callCategory || cleanText(payload.callCategory) || null,
    equipment_materials: normalized.equipment || cleanText(payload.equipment) || "N/A",
    repeated_call: normalized.repeated || cleanText(payload.repeated) || "NO",
    problem_reported_by: normalized.reportedBy || cleanText(payload.reportedBy) || cleanText(payload.callerName) || null,
    call_description: normalized.description || cleanText(payload.description) || cleanText(payload.problemDesc) || "Imported FMS call",
    call_attended_by: normalized.attendedBy || cleanText(payload.attendedBy) || null,
    call_attend_dt: normalized.attendDate || parseDateTime(payload.attendDate) || null,
    action_taken: normalized.actionTaken || cleanText(payload.actionTaken) || null,
    call_closed_dt: closedDate,
    response_time_min: normalized.responseMinutes ?? null,
    resolution_time_min: normalized.resolutionMinutes ?? null,
    downtime_min: normalized.downtimeMinutes ?? null,
    pending_side: normalized.pendingSide || cleanText(payload.pendingSide) || null,
    remarks: normalized.remarks || cleanText(payload.remarks) || null,
    import_batch_id: normalized.importBatchId || payload.importBatchId || null,
    client_request_id: cleanText(payload.clientRequestId) || cleanText(payload.client_request_id) || null,
    caller_name: cleanText(payload.callerName) || normalized.reportedBy || cleanText(payload.reportedBy) || "FMS Caller",
    contact: cleanText(payload.contact) || "N/A",
    location: cleanText(payload.location) || normalized.area || normalized.division || "N/A",
    issue_type: cleanText(payload.issueType) || normalized.natureOfCall || "Project Call",
    priority: cleanText(payload.priority) || "medium",
    status,
    assigned_to: payload.assignedTo ?? payload.assigned_to ?? null,
    description: cleanText(payload.description) || normalized.description || "Imported FMS call",
    created_by: user?.sub || null,
    vehicle_number: cleanText(payload.vehicleNumber) || normalized.machine || null,
    severity: cleanText(payload.severity) || normalized.assetType || null
  };
}

async function findCallByReferenceNo(referenceNo) {
  if (!referenceNo) return null;
  const result = await query(
    `SELECT *
     FROM fms.call_logs
     WHERE reference_no = $1`,
    [referenceNo]
  );
  return mapDbCall(result.rows[0] || null);
}

async function findCallByClientRequestId(clientRequestId) {
  if (!clientRequestId) return null;
  const result = await query(
    `SELECT *
     FROM fms.call_logs
     WHERE client_request_id = $1`,
    [clientRequestId]
  );
  return mapDbCall(result.rows[0] || null);
}

function normalizeDeleteIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [ids]).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
}

async function deleteCallLogs(ids, user) {
  const normalizedIds = normalizeDeleteIds(ids);
  if (!normalizedIds.length) {
    throw new AppError(400, "At least one call id is required.");
  }

  try {
    return await withTransaction(async (txQuery) => {
      let rows = [];

      if (isMySQL) {
        const lookupPlaceholders = normalizedIds.map(() => "?").join(", ");
        const lookup = await txQuery(
          `SELECT id, reference_no, import_batch_id
           FROM fms.call_logs
           WHERE id IN (${lookupPlaceholders})`,
          normalizedIds
        );
        rows = lookup.rows || [];
      } else {
        const lookup = await txQuery(
          `SELECT id, reference_no, import_batch_id
           FROM fms.call_logs
           WHERE id = ANY($1::int[])`,
          [normalizedIds]
        );
        rows = lookup.rows || [];
      }

      if (rows.some((row) => row.import_batch_id)) {
        throw new AppError(409, "Imported rows can only be removed through rollback.");
      }

      if (!rows.length) {
        return { deletedRows: 0, deletedIds: [] };
      }

      const rowIds = rows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
      if (!rowIds.length) {
        return { deletedRows: 0, deletedIds: [] };
      }

      if (isMySQL) {
        const deletePlaceholders = rowIds.map(() => "?").join(", ");
        const deleteResult = await txQuery(
          `DELETE FROM fms.call_logs
           WHERE id IN (${deletePlaceholders})`,
          rowIds
        );
        return {
          deletedRows: deleteResult.affectedRows ?? deleteResult.rowCount ?? rowIds.length,
          deletedIds: rowIds
        };
      }

      const deleteResult = await txQuery(
        `DELETE FROM fms.call_logs
         WHERE id = ANY($1::int[])`,
        [rowIds]
      );
      return {
        deletedRows: deleteResult.rowCount ?? deleteResult.affectedRows ?? rowIds.length,
        deletedIds: rowIds
      };
    });
  } catch (error) {
    if (dbUnavailable(error)) {
      return fallbackStore.deleteCallLogs(normalizedIds, user);
    }

    console.error("FMS delete call failed:", {
      message: error.message,
      code: error.code,
      ids: normalizedIds
    });
    throw error;
  }
}

function buildInsertParams(row, userId) {
  return [
    row.reference_no,
    row.call_no,
    row.month,
    row.call_open_dt,
    row.division || null,
    row.area || null,
    row.machine || null,
    row.asset_no || null,
    row.equipment_name || null,
    row.asset_non_asset || null,
    row.nature_of_call || null,
    row.type_of_assets || null,
    row.call_category || null,
    row.equipment_materials || null,
    row.repeated_call || null,
    row.problem_reported_by || null,
    row.call_description || null,
    row.call_attended_by || null,
    row.call_attend_dt || null,
    row.action_taken || null,
    row.call_closed_dt || null,
    row.response_time_min ?? null,
    row.resolution_time_min ?? null,
    row.downtime_min ?? null,
    row.pending_side || null,
    row.remarks || null,
    row.import_batch_id || null,
    row.client_request_id || null,
    row.caller_name || null,
    row.contact || null,
    row.location || null,
    row.issue_type || null,
    row.priority || "medium",
    row.status || "open",
    row.assigned_to ?? null,
    row.description || null,
    userId,
    row.vehicle_number || null,
    row.severity || null
  ];
}

function buildUpdateParams(row, userId, id) {
  return [
    id,
    row.reference_no,
    row.call_no,
    row.month,
    row.call_open_dt,
    row.division || null,
    row.area || null,
    row.machine || null,
    row.asset_no || null,
    row.equipment_name || null,
    row.asset_non_asset || null,
    row.nature_of_call || null,
    row.type_of_assets || null,
    row.call_category || null,
    row.equipment_materials || null,
    row.repeated_call || null,
    row.problem_reported_by || null,
    row.call_description || null,
    row.call_attended_by || null,
    row.call_attend_dt || null,
    row.action_taken || null,
    row.call_closed_dt || null,
    row.response_time_min ?? null,
    row.resolution_time_min ?? null,
    row.downtime_min ?? null,
    row.pending_side || null,
    row.remarks || null,
    row.import_batch_id || null,
    row.client_request_id || null,
    row.caller_name || null,
    row.contact || null,
    row.location || null,
    row.issue_type || null,
    row.priority || "medium",
    row.status || "open",
    row.assigned_to ?? null,
    row.description || null,
    userId,
    row.vehicle_number || null,
    row.severity || null
  ];
}

function filterCallLogs(rows, filters = {}) {
  const status = cleanText(filters.status);
  const priority = cleanText(filters.priority);
  const assignedTo = cleanText(filters.assignedTo || filters.assigned_to);
  const search = cleanText(filters.search).toLowerCase();

  return rows.filter((row) => {
    if (status && cleanText(row.status).toLowerCase() !== status.toLowerCase()) return false;
    if (priority && cleanText(row.priority).toLowerCase() !== priority.toLowerCase()) return false;
    if (assignedTo && String(row.assigned_to || "") !== assignedTo) return false;
    if (!search) return true;
    const haystack = [
      row.reference_no,
      row.call_no,
      row.caller_name,
      row.location,
      row.issue_type,
      row.vehicle_number,
      row.severity,
      row.description,
      row.problem_reported_by,
      row.call_description,
      row.division,
      row.area,
      row.machine
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

async function getCallLogById(id) {
  const result = await query(
    `SELECT *
     FROM fms.call_logs
     WHERE id = $1`,
    [id]
  );
  return mapDbCall(result.rows[0] || null);
}

async function createCallLog({ payload, user }) {
  const row = buildFmsCallRow(payload, user);
  try {
    const existingByRequestId = await findCallByClientRequestId(row.client_request_id);
    if (existingByRequestId) {
      return { ...existingByRequestId, wasDuplicateReplay: true };
    }

    const existingByReference = await findCallByReferenceNo(row.reference_no);
    if (existingByReference) {
      return { ...existingByReference, wasDuplicateReplay: true };
    }

    if (isMySQL) {
      const insertParams = buildInsertParams(row, user.sub);
      const insertResult = await query(
        `INSERT INTO fms.call_logs (
          reference_no, call_no, month, call_open_dt, division, area, machine, asset_no, equipment_name,
          asset_non_asset, nature_of_call, type_of_assets, call_category, equipment_materials, repeated_call,
          problem_reported_by, call_description, call_attended_by, call_attend_dt, action_taken, call_closed_dt,
          response_time_min, resolution_time_min, downtime_min, pending_side, remarks, import_batch_id, client_request_id, caller_name,
          contact, location, issue_type, priority, status, assigned_to, description, created_by, vehicle_number, severity, updated_at
        ) VALUES (
          ${insertParams.map(() => "?").join(", ")}, NOW()
        )`,
        insertParams
      );
      const insertedId = insertResult.insertId;
      return await getCallLogById(insertedId);
    }

    const result = await query(
      `INSERT INTO fms.call_logs (
        reference_no, call_no, month, call_open_dt, division, area, machine, asset_no, equipment_name,
        asset_non_asset, nature_of_call, type_of_assets, call_category, equipment_materials, repeated_call,
        problem_reported_by, call_description, call_attended_by, call_attend_dt, action_taken, call_closed_dt,
        response_time_min, resolution_time_min, downtime_min, pending_side, remarks, import_batch_id, client_request_id, caller_name,
        contact, location, issue_type, priority, status, assigned_to, description, created_by, vehicle_number, severity, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, NOW()
      ) RETURNING *`,
      buildInsertParams(row, user.sub)
    );
    return mapDbCall(result.rows[0]);
  } catch (error) {
    if (dbUnavailable(error)) {
      throw new AppError(503, "Database is temporarily unavailable. Please retry when the server reconnects.");
    }

    if (isUniqueViolation(error)) {
      if (row.client_request_id) {
        const existing = await findCallByClientRequestId(row.client_request_id);
        if (existing) {
          return { ...existing, wasDuplicateReplay: true };
        }
      }
      const existing = await findCallByReferenceNo(row.reference_no);
      if (existing) {
        return { ...existing, wasDuplicateReplay: true };
      }
    }

    console.error("FMS create call failed:", {
      message: error.message,
      code: error.code,
      referenceNo: row.reference_no,
      clientRequestId: row.client_request_id || null
    });
    throw error;
  }
}

async function updateCallLog(id, payload, user) {
  const current = await getCallLogById(id);
  if (!current) return null;
  const merged = buildFmsCallRow({ ...current, ...payload }, user);
  try {
    if (isMySQL) {
      await query(
        `UPDATE fms.call_logs
         SET reference_no = ?,
             call_no = ?,
             month = ?,
             call_open_dt = ?,
             division = ?,
             area = ?,
             machine = ?,
             asset_no = ?,
             equipment_name = ?,
             asset_non_asset = ?,
             nature_of_call = ?,
             type_of_assets = ?,
             call_category = ?,
             equipment_materials = ?,
             repeated_call = ?,
             problem_reported_by = ?,
             call_description = ?,
             call_attended_by = ?,
             call_attend_dt = ?,
             action_taken = ?,
             call_closed_dt = ?,
             response_time_min = ?,
             resolution_time_min = ?,
             downtime_min = ?,
             pending_side = ?,
             remarks = ?,
             import_batch_id = ?,
             client_request_id = ?,
             caller_name = ?,
             contact = ?,
             location = ?,
             issue_type = ?,
             priority = ?,
             status = ?,
             assigned_to = ?,
             description = ?,
             created_by = ?,
             vehicle_number = ?,
             severity = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          merged.reference_no,
          merged.call_no,
          merged.month,
          merged.call_open_dt,
          merged.division || null,
          merged.area || null,
          merged.machine || null,
          merged.asset_no || null,
          merged.equipment_name || null,
          merged.asset_non_asset || null,
          merged.nature_of_call || null,
          merged.type_of_assets || null,
          merged.call_category || null,
          merged.equipment_materials || null,
          merged.repeated_call || null,
          merged.problem_reported_by || null,
          merged.call_description || null,
          merged.call_attended_by || null,
          merged.call_attend_dt || null,
          merged.action_taken || null,
          merged.call_closed_dt || null,
          merged.response_time_min ?? null,
          merged.resolution_time_min ?? null,
          merged.downtime_min ?? null,
          merged.pending_side || null,
          merged.remarks || null,
          merged.import_batch_id || null,
          merged.client_request_id || null,
          merged.caller_name || null,
          merged.contact || null,
          merged.location || null,
          merged.issue_type || null,
          merged.priority || "medium",
          merged.status || "open",
          merged.assigned_to ?? null,
          merged.description || null,
          merged.created_by || user?.sub || null,
          merged.vehicle_number || null,
          merged.severity || null,
          id
        ]
      );
      return await getCallLogById(id);
    }

    const result = await query(
      `UPDATE fms.call_logs
       SET reference_no = $2,
           call_no = $3,
           month = $4,
           call_open_dt = $5,
           division = $6,
           area = $7,
           machine = $8,
           asset_no = $9,
           equipment_name = $10,
           asset_non_asset = $11,
           nature_of_call = $12,
           type_of_assets = $13,
           call_category = $14,
           equipment_materials = $15,
           repeated_call = $16,
           problem_reported_by = $17,
           call_description = $18,
           call_attended_by = $19,
           call_attend_dt = $20,
           action_taken = $21,
           call_closed_dt = $22,
           response_time_min = $23,
           resolution_time_min = $24,
           downtime_min = $25,
           pending_side = $26,
           remarks = $27,
           import_batch_id = $28,
           client_request_id = $29,
           caller_name = $30,
           contact = $31,
           location = $32,
           issue_type = $33,
           priority = $34,
           status = $35,
           assigned_to = $36,
           description = $37,
           created_by = $38,
           vehicle_number = $39,
           severity = $40,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        merged.reference_no,
        merged.call_no,
        merged.month,
        merged.call_open_dt,
        merged.division || null,
        merged.area || null,
        merged.machine || null,
        merged.asset_no || null,
        merged.equipment_name || null,
        merged.asset_non_asset || null,
        merged.nature_of_call || null,
        merged.type_of_assets || null,
        merged.call_category || null,
        merged.equipment_materials || null,
        merged.repeated_call || null,
        merged.problem_reported_by || null,
        merged.call_description || null,
        merged.call_attended_by || null,
        merged.call_attend_dt || null,
        merged.action_taken || null,
        merged.call_closed_dt || null,
        merged.response_time_min ?? null,
        merged.resolution_time_min ?? null,
        merged.downtime_min ?? null,
        merged.pending_side || null,
        merged.remarks || null,
        merged.import_batch_id || null,
        merged.client_request_id || null,
        merged.caller_name || null,
        merged.contact || null,
        merged.location || null,
        merged.issue_type || null,
        merged.priority || "medium",
        merged.status || "open",
        merged.assigned_to ?? null,
        merged.description || null,
        merged.created_by || user?.sub || null,
        merged.vehicle_number || null,
        merged.severity || null
      ]
    );
    return mapDbCall(result.rows[0]);
  } catch (error) {
    if (dbUnavailable(error)) {
      throw new AppError(503, "Database is temporarily unavailable. Please retry when the server reconnects.");
    }

    console.error("FMS update call failed:", {
      message: error.message,
      code: error.code,
      callId: id
    });
    throw error;
  }
}

async function listBreakdownCallLogs() {
  try {
    const result = await query(
      `SELECT *
       FROM fms.call_logs
       ORDER BY COALESCE(call_open_dt, created_at) DESC, id DESC`
    );
    return result.rows.map(mapDbCall);
  } catch (error) {
    if (dbUnavailable(error)) {
      return fallbackStore.listCallLogs();
    }
    throw error;
  }
}

async function listImportHistory() {
  try {
    const result = await query(
      `SELECT b.*, u.name AS uploader_name_fallback
       FROM fms.import_batches b
       LEFT JOIN public.users u ON u.id = b.uploader_id
       ORDER BY b.uploaded_at DESC, b.id DESC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      importKey: row.import_key,
      fileName: row.file_name,
      uploaderId: row.uploader_id,
      uploaderName: row.uploader_name || row.uploader_name_fallback || "",
      uploadedAt: row.uploaded_at,
      fileSizeBytes: row.file_size_bytes || 0,
      totalRows: row.total_rows || 0,
      importedRows: row.imported_rows || 0,
      skippedRows: row.skipped_rows || 0,
      failedRows: row.failed_rows || 0,
      status: row.status,
      rolledBackAt: row.rolled_back_at || null,
      rolledBackBy: row.rolled_back_by || null
    }));
  } catch (error) {
    if (dbUnavailable(error)) {
      return fallbackStore.listImportHistory();
    }
    throw error;
  }
}

async function listImportErrors(importId) {
  try {
    const result = await query(
      `SELECT *
       FROM fms.import_errors
       WHERE batch_id = $1
       ORDER BY row_number ASC, id ASC`,
      [importId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      batchId: row.batch_id,
      rowNumber: row.row_number,
      incidentNo: row.incident_no,
      errorMessage: row.error_message,
      rowData: row.row_data,
      createdAt: row.created_at
    }));
  } catch (error) {
    if (dbUnavailable(error)) {
      return fallbackStore.listImportErrors(importId);
    }
    throw error;
  }
}

async function importBreakdownChunk({ importKey, fileName, fileSizeBytes, totalRows, rows, user }) {
  const normalizedRows = rows.map(normalizeRow);
  try {
    const result = await withTransaction(async (txQuery) => {
      const batch = await upsertBatch(txQuery, {
        importKey,
        fileName,
        fileSizeBytes,
        totalRows,
        uploaderId: user.sub,
        uploaderName: user.name
      });

      const existing = await queryExistingIncidentNos(txQuery, normalizedRows.map((row) => row.incidentNo));
      const seen = new Set();
      const validRows = [];
      const skippedErrors = [];
      const failedErrors = [];

      for (const row of normalizedRows) {
        if (!row.incidentNo || !row.month || !row.callOpenDate || !row.division || !row.area || !row.machine || !row.natureOfCall || !row.assetType || !row.callCategory || !row.description || !row.status) {
          failedErrors.push({
            rowNumber: row.rowNumber,
            incidentNo: row.incidentNo || "",
            message: validateRow(row).join("; "),
            row
          });
          continue;
        }

        const duplicateKey = row.incidentNo.toLowerCase();
        if (seen.has(duplicateKey)) {
          skippedErrors.push({
            rowNumber: row.rowNumber,
            incidentNo: row.incidentNo,
            message: "Duplicate Incident Number in uploaded file",
            row
          });
          continue;
        }

        if (existing.has(row.incidentNo.toLowerCase())) {
          skippedErrors.push({
            rowNumber: row.rowNumber,
            incidentNo: row.incidentNo,
            message: "Duplicate Incident Number already exists",
            row
          });
          continue;
        }

        seen.add(duplicateKey);
        validRows.push(row);
      }

      await ensureLookupRows(txQuery, LOOKUP_TABLES.divisions, uniqueValues(validRows, "division"));
      await ensureAreaRows(txQuery, validRows);
      await ensureLookupRows(txQuery, LOOKUP_TABLES.categories, uniqueValues(validRows, "callCategory"));
      await ensureLookupRows(txQuery, LOOKUP_TABLES.assetTypes, uniqueValues(validRows, "assetType"));

      const insertedIncidentNos = [];
      for (let index = 0; index < validRows.length; index += BATCH_SIZE) {
        const chunk = validRows.slice(index, index + BATCH_SIZE);
        const { columns, sql } = buildInsertSql(chunk.length);
        const params = [];
        chunk.forEach((row) => {
          params.push(
            row.incidentNo,
            row.incidentNo,
            row.month,
            row.callOpenDate,
            row.division,
            row.area,
            row.machine,
            row.assetNo || null,
            row.equipmentName || null,
            row.assetNonAsset || null,
            row.natureOfCall || null,
            row.assetType || null,
            row.callCategory || null,
            row.equipment || null,
            row.repeated || null,
            row.reportedBy || null,
            row.description || null,
            row.attendedBy || null,
            row.attendDate || null,
            row.actionTaken || null,
            row.status || "open",
            row.closedDate || null,
            row.responseMinutes,
            row.resolutionMinutes,
            row.downtimeMinutes,
            row.pendingSide || null,
            row.remarks || null,
            batch.id,
            row.reportedBy || row.division || "Imported Caller",
            "N/A",
            row.area || row.division || "Imported Location",
            row.natureOfCall || "Imported Call",
            "medium",
            row.description || "Imported FMS call",
            row.machine || null,
            row.assetType || null,
            user.sub
          );
        });

        const insertSql = isMySQL
          ? `INSERT INTO fms.call_logs (${columns.join(", ")}) VALUES ${chunk
              .map(() => `(${columns.map(() => "?").join(", ")})`)
              .join(", ")}`
          : sql;
        const insertResult = await txQuery(insertSql, params);
        const insertedCount = insertResult.rowCount ?? insertResult.affectedRows ?? chunk.length;
        insertedIncidentNos.push(...chunk.slice(0, insertedCount).map((row) => row.incidentNo));
      }

      await insertAuditLogs(
        txQuery,
        validRows.filter((row) => insertedIncidentNos.includes(row.incidentNo)),
        batch.id,
        user.sub
      );
      await insertErrorLogs(txQuery, batch.id, [...failedErrors, ...skippedErrors]);

      const importedCount = insertedIncidentNos.length;
      const skippedCount = skippedErrors.length;
      const failedCount = failedErrors.length;
      const status = failedCount > 0 || skippedCount > 0 ? "completed_with_errors" : "completed";

      await txQuery(
        `UPDATE fms.import_batches
         SET imported_rows = imported_rows + $2,
             skipped_rows = skipped_rows + $3,
             failed_rows = failed_rows + $4,
             status = $5,
             completed_at = CASE WHEN $6 THEN NOW() ELSE completed_at END
         WHERE id = $1`,
        [batch.id, importedCount, skippedCount, failedCount, status, true]
      );

      const refreshed = await txQuery(
        `SELECT b.*, u.name AS uploader_name_fallback
         FROM fms.import_batches b
         LEFT JOIN public.users u ON u.id = b.uploader_id
         WHERE b.id = $1`,
        [batch.id]
      );

      return {
        batch: refreshed.rows[0],
        importedCount,
        skippedCount,
        failedCount
      };
    });

    return {
      batch: {
        id: result.batch.id,
        importKey: result.batch.import_key,
        fileName: result.batch.file_name,
        uploaderId: result.batch.uploader_id,
        uploaderName: result.batch.uploader_name || result.batch.uploader_name_fallback || "",
        uploadedAt: result.batch.uploaded_at,
        totalRows: result.batch.total_rows || totalRows,
        importedRows: result.batch.imported_rows || result.importedCount,
        skippedRows: result.batch.skipped_rows || result.skippedCount,
        failedRows: result.batch.failed_rows || result.failedCount,
        status: result.batch.status
      },
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      failedCount: result.failedCount
    };
  } catch (error) {
    if (dbUnavailable(error)) {
      return fallbackStore.importBreakdownChunk({
        importKey,
        fileName,
        fileSizeBytes,
        totalRows,
        normalizedRows,
        user
      });
    }
    throw error;
  }
}

async function rollbackLastImport(user) {
  try {
    return await withTransaction(async (txQuery) => {
      const batchResult = await txQuery(
        `SELECT *
         FROM fms.import_batches
         WHERE rolled_back_at IS NULL
         ORDER BY uploaded_at DESC, id DESC
         LIMIT 1`
      );
      const batch = batchResult.rows[0];
      if (!batch) {
        return null;
      }

      const deleteResult = await txQuery(
        `DELETE FROM fms.call_logs
         WHERE import_batch_id = $1`,
        [batch.id]
      );

      await txQuery(
        `UPDATE fms.import_batches
         SET rolled_back_at = NOW(),
             rolled_back_by = $2,
             status = 'rolled_back'
         WHERE id = $1`,
        [batch.id, user.sub]
      );

      return {
        batch: {
          id: batch.id,
          importKey: batch.import_key,
          fileName: batch.file_name,
          totalRows: batch.total_rows || 0,
          importedRows: batch.imported_rows || 0,
          skippedRows: batch.skipped_rows || 0,
          failedRows: batch.failed_rows || 0
        },
        deletedRows: deleteResult.rowCount ?? deleteResult.affectedRows ?? 0
      };
    });
  } catch (error) {
    if (dbUnavailable(error)) {
      return fallbackStore.rollbackLastImport(user);
    }
    throw error;
  }
}

module.exports = {
  listBreakdownCallLogs,
  getCallLogById,
  createCallLog,
  updateCallLog,
  listImportHistory,
  listImportErrors,
  importBreakdownChunk,
  rollbackLastImport,
  deleteCallLogs
};
