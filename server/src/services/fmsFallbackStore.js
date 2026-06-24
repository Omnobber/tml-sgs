const fs = require("fs");
const path = require("path");
const { AppError } = require("../utils/errors");

const dataPath = path.resolve(__dirname, "../data/fms-call-report.json");
const initial = JSON.parse(fs.readFileSync(dataPath, "utf8"));
let records = initial.map((item) => ({ ...item }));
let nextId = records.length + 1;
let importBatches = [];
let importErrors = new Map();
let nextImportBatchId = 1;

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "closed") return "closed";
  if (value === "in_progress" || value === "in progress") return "in_progress";
  if (value === "on_hold" || value === "on hold") return "on_hold";
  return "open";
}

function matchesFilter(value, filter) {
  if (!filter) return true;
  return String(value || "").toLowerCase() === String(filter).toLowerCase();
}

function matchesSearch(record, search) {
  if (!search) return true;
  const haystack = [
    record.call_no,
    record.division,
    record.division_raw,
    record.area,
    record.device_name,
    record.asset_tag,
    record.equipment_name,
    record.nature_of_call,
    record.asset_type,
    record.call_category,
    record.problem_desc,
    record.engineer_name,
    record.action_taken,
    record.remarks
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(String(search).toLowerCase());
}

function shape(record) {
  return {
    id: record.id,
    call_no: record.call_no,
    call_date: record.call_date,
    call_time: record.call_time,
    division: record.division,
    department: record.area,
    asset_tag: record.asset_tag,
    asset_type: record.asset_type,
    problem_desc: record.problem_desc,
    engineer_id: record.engineer_id || null,
    engineer_name: record.engineer_name || null,
    status: normalizeStatus(record.status),
    open_dt: record.open_dt,
    close_dt: record.close_dt,
    mttr_min: record.mttr_min ?? record.downtime_min ?? null,
    downtime_min: record.downtime_min ?? null,
    root_cause: record.call_category || null,
    resolution: record.action_taken || null,
    remarks: record.remarks || null,
    feedback: record.pending_side || null,
    importBatchId: record.import_batch_id || null,
    system_type: "fms",
    created_by_name: "FMS Demo",
    source: record
  };
}

function listCallLogs(filters = {}) {
  return records
    .filter((record) => matchesFilter(record.status, filters.status ? normalizeStatus(filters.status) : null))
    .filter((record) => matchesFilter(record.division, filters.division))
    .filter((record) => matchesSearch(record, filters.search))
    .filter((record) => {
      if (!filters.engineerId) return true;
      return String(record.engineer_id || "") === String(filters.engineerId);
    })
    .map(shape)
    .sort((a, b) => String(b.open_dt || "").localeCompare(String(a.open_dt || "")));
}

function getCallLogById(id) {
  const record = records.find((item) => Number(item.id) === Number(id));
  return record ? shape(record) : null;
}

function createCallLog(payload) {
  const now = new Date().toISOString();
  const record = {
    id: nextId++,
    call_no: payload.callNo || `FMS-LOCAL-${String(nextId - 1).padStart(4, "0")}`,
    source_period: null,
    call_date: payload.callDate || now.slice(0, 10),
    call_time: payload.callTime || now.slice(11, 16),
    open_dt: payload.openDt || now,
    close_dt: payload.closeDt || null,
    division: String(payload.division || "OTHER").toUpperCase(),
    division_raw: payload.division || "OTHER",
    area: payload.department || payload.area || "OTHER",
    device_name: payload.deviceName || null,
    asset_tag: payload.assetTag || null,
    equipment_name: payload.equipmentName || null,
    assets_or_non_assets: payload.assetsOrNonAssets || null,
    nature_of_call: payload.natureOfCall || "Project Call",
    asset_type: payload.assetType || null,
    call_category: payload.callCategory || null,
    equipment_materials: payload.equipmentMaterials || null,
    repeated_call: payload.repeatedCall || "No",
    reported_by: payload.reportedBy || null,
    problem_desc: payload.problemDesc || "Imported FMS call",
    engineer_name: payload.engineerName || null,
    attend_dt: payload.attendDt || null,
    action_taken: payload.actionTaken || null,
    status: normalizeStatus(payload.status || "open"),
    pending_side: payload.pendingSide || null,
    remarks: payload.remarks || null,
    response_time_min: payload.responseTimeMin ?? null,
    resolution_time_min: payload.resolutionTimeMin ?? null,
    downtime_min: payload.downtimeMin ?? null,
    mttr_min: payload.downtimeMin ?? payload.resolutionTimeMin ?? null,
    system_type: "fms"
  };
  records.unshift(record);
  return shape(record);
}

function updateCallLog(id, payload) {
  const idx = records.findIndex((item) => Number(item.id) === Number(id));
  if (idx === -1) return null;
  const current = records[idx];
  const updated = {
    ...current,
    division: payload.division ? String(payload.division).toUpperCase() : current.division,
    division_raw: payload.division || current.division_raw,
    area: payload.department || current.area,
    asset_tag: payload.assetTag ?? current.asset_tag,
    asset_type: payload.assetType ?? current.asset_type,
    problem_desc: payload.problemDesc ?? current.problem_desc,
    engineer_name: payload.engineerName ?? current.engineer_name,
    status: payload.status ? normalizeStatus(payload.status) : current.status,
    close_dt: payload.closeDt ?? current.close_dt,
    downtime_min: payload.downtimeMin ?? current.downtime_min,
    mttr_min: payload.downtimeMin ?? current.mttr_min,
    remarks: payload.remarks ?? current.remarks,
    pending_side: payload.feedback ?? current.pending_side,
    action_taken: payload.resolution ?? current.action_taken
  };
  records[idx] = updated;
  return shape(updated);
}

function deleteCallLogs(ids = []) {
  const idSet = new Set(
    (Array.isArray(ids) ? ids : [ids])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  );

  if (!idSet.size) {
    throw new AppError(400, "At least one call id is required.");
  }

  const matched = records.filter((record) => idSet.has(Number(record.id)));
  if (!matched.length) {
    return { deletedRows: 0, deletedIds: [] };
  }

  if (matched.some((record) => record.import_batch_id)) {
    throw new AppError(409, "Imported rows can only be removed through rollback.");
  }

  records = records.filter((record) => !idSet.has(Number(record.id)));
  return {
    deletedRows: matched.length,
    deletedIds: matched.map((record) => record.id)
  };
}

function normalizeImportStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "rolled_back") return "rolled_back";
  if (value === "completed_with_errors") return "completed_with_errors";
  if (value === "completed") return "completed";
  return "processing";
}

function cloneRow(row) {
  return JSON.parse(JSON.stringify(row));
}

function validateImportedRow(row) {
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

function listImportHistory() {
  return [...importBatches]
    .sort((a, b) => String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || "")))
    .map((batch) => ({ ...batch }));
}

function listImportErrors(importId) {
  return (importErrors.get(Number(importId)) || []).map((entry) => ({ ...entry }));
}

function importBreakdownChunk({ importKey, fileName, fileSizeBytes, totalRows, normalizedRows, user }) {
  const now = new Date().toISOString();
  const batchId = nextImportBatchId++;
  const seen = new Set();
  const validRows = [];
  const skippedErrors = [];
  const failedErrors = [];
  const existingIncidentNos = new Set(
    records
      .map((record) => String(record.call_no || record.reference_no || record.incidentNo || "").toLowerCase())
      .filter(Boolean)
  );

  for (const row of normalizedRows || []) {
    const validationErrors = validateImportedRow(row);
    if (validationErrors.length) {
      failedErrors.push({
        rowNumber: row.rowNumber,
        incidentNo: row.incidentNo || "",
        message: validationErrors.join("; "),
        row
      });
      continue;
    }

    const duplicateKey = String(row.incidentNo || "").toLowerCase();
    if (seen.has(duplicateKey)) {
      skippedErrors.push({
        rowNumber: row.rowNumber,
        incidentNo: row.incidentNo,
        message: "Duplicate Incident Number in uploaded file",
        row
      });
      continue;
    }

    if (existingIncidentNos.has(duplicateKey)) {
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

  validRows.forEach((row) => {
    const record = {
      id: nextId++,
      call_no: row.incidentNo,
      reference_no: row.incidentNo,
      month: row.month,
      call_open_dt: row.callOpenDate,
      division: row.division,
      area: row.area,
      machine: row.machine,
      asset_no: row.assetNo || null,
      equipment_name: row.equipmentName || null,
      asset_non_asset: row.assetNonAsset || null,
      nature_of_call: row.natureOfCall || null,
      type_of_assets: row.assetType || null,
      call_category: row.callCategory || null,
      equipment_materials: row.equipment || null,
      repeated_call: row.repeated || null,
      problem_reported_by: row.reportedBy || null,
      call_description: row.description || null,
      call_attended_by: row.attendedBy || null,
      call_attend_dt: row.attendDate || null,
      action_taken: row.actionTaken || null,
      status: row.status || "open",
      call_closed_dt: row.closedDate || null,
      response_time_min: row.responseMinutes ?? null,
      resolution_time_min: row.resolutionMinutes ?? null,
      downtime_min: row.downtimeMinutes ?? null,
      pending_side: row.pendingSide || null,
      remarks: row.remarks || null,
      import_batch_id: batchId,
      caller_name: row.reportedBy || row.division || "Imported Caller",
      contact: "N/A",
      location: row.area || row.division || "Imported Location",
      issue_type: row.natureOfCall || "Imported Call",
      priority: "medium",
      description: row.description || "Imported FMS call",
      vehicle_number: row.machine || null,
      severity: row.assetType || null,
      created_by: user?.sub || null,
      created_at: now,
      updated_at: now
    };
    records.unshift(record);
  });

  const batch = {
    id: batchId,
    importKey,
    fileName,
    uploaderId: user?.sub || null,
    uploaderName: user?.name || "FMS Demo",
    uploadedAt: now,
    fileSizeBytes: fileSizeBytes || 0,
    totalRows: totalRows || normalizedRows.length || 0,
    importedRows: validRows.length,
    skippedRows: skippedErrors.length,
    failedRows: failedErrors.length,
    status: normalizeImportStatus(skippedErrors.length || failedErrors.length ? "completed_with_errors" : "completed"),
    rolledBackAt: null,
    rolledBackBy: null
  };

  importBatches.unshift(batch);
  importErrors.set(batchId, [
    ...failedErrors.map((entry) => ({
      id: `${batchId}-f-${entry.rowNumber}`,
      batchId,
      rowNumber: entry.rowNumber,
      incidentNo: entry.incidentNo,
      errorMessage: entry.message,
      rowData: cloneRow(entry.row),
      createdAt: now
    })),
    ...skippedErrors.map((entry) => ({
      id: `${batchId}-s-${entry.rowNumber}`,
      batchId,
      rowNumber: entry.rowNumber,
      incidentNo: entry.incidentNo,
      errorMessage: entry.message,
      rowData: cloneRow(entry.row),
      createdAt: now
    }))
  ]);

  return {
    batch: { ...batch },
    importedCount: validRows.length,
    skippedCount: skippedErrors.length,
    failedCount: failedErrors.length
  };
}

function rollbackLastImport(user) {
  const batch = [...importBatches]
    .filter((item) => !item.rolledBackAt)
    .sort((a, b) => String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || "")) || Number(b.id) - Number(a.id))[0];

  if (!batch) {
    return null;
  }

  const deletedRows = records.filter((record) => Number(record.import_batch_id) === Number(batch.id)).length;
  records = records.filter((record) => Number(record.import_batch_id) !== Number(batch.id));

  batch.rolledBackAt = new Date().toISOString();
  batch.rolledBackBy = user?.sub || null;
  batch.status = "rolled_back";

  return {
    batch: {
      id: batch.id,
      importKey: batch.importKey,
      fileName: batch.fileName,
      totalRows: batch.totalRows || 0,
      importedRows: batch.importedRows || 0,
      skippedRows: batch.skippedRows || 0,
      failedRows: batch.failedRows || 0
    },
    deletedRows
  };
}

function updateCallStatus(id, status) {
  return updateCallLog(id, { status });
}

function dashboardKpis() {
  const calls = records.map(shape);
  return {
    total_calls: calls.length,
    open_calls: calls.filter((c) => c.status === "open").length,
    in_progress_calls: calls.filter((c) => c.status === "in_progress").length,
    on_hold_calls: calls.filter((c) => c.status === "on_hold").length,
    closed_calls: calls.filter((c) => c.status === "closed").length,
    avg_mttr: Math.round(
      calls.reduce((sum, call) => sum + Number(call.mttr_min || 0), 0) / Math.max(calls.length, 1)
    )
  };
}

function dashboardCharts() {
  const calls = records.map(shape);
  const statusMap = new Map();
  const divisionMap = new Map();
  const trendMap = new Map();

  for (const call of calls) {
    statusMap.set(call.status, (statusMap.get(call.status) || 0) + 1);
    divisionMap.set(call.division, (divisionMap.get(call.division) || 0) + 1);
    const key = call.call_date || (call.open_dt ? String(call.open_dt).slice(0, 10) : "unknown");
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  }

  return {
    byStatus: [...statusMap.entries()].map(([status, value]) => ({ status, value })),
    byDivision: [...divisionMap.entries()].map(([division, value]) => ({ division, value })),
    trend: [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, value]) => ({ date, value }))
  };
}

module.exports = {
  listCallLogs,
  getCallLogById,
  createCallLog,
  updateCallLog,
  updateCallStatus,
  dashboardKpis,
  dashboardCharts,
  listImportHistory,
  listImportErrors,
  importBreakdownChunk,
  rollbackLastImport,
  deleteCallLogs
};
