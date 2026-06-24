const { z } = require("zod");
const { query, isMySQL } = require("../db/pool");
const { recordAudit } = require("../services/auditService");
const { AppError } = require("../utils/errors");
const fmsImportService = require("../services/fmsImportService");

const createScheduleSchema = z.object({
  vehicleNumber: z.string().min(3),
  plannedDate: z.string(),
  notes: z.string().optional()
});

const updateScheduleSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed"]).optional(),
  notes: z.string().optional()
});

const createCallSchema = z
  .object({
    incidentNo: z.string().min(1).optional(),
    month: z.string().min(1),
    callOpenDate: z.string().min(1),
    division: z.string().min(1),
    area: z.string().min(1),
    machine: z.string().min(1),
    natureOfCall: z.string().min(1),
    assetType: z.string().min(1),
    callCategory: z.string().min(1),
    description: z.string().min(1),
    status: z.string().optional(),
    clientRequestId: z.string().min(8).optional()
  })
  .passthrough();

const updateCallSchema = z.object({}).passthrough();
const deleteCallSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1)
});

async function vehicleStatus(req, res, next) {
  try {
    const result = isMySQL
      ? await query(
          `SELECT
            SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) AS under_maintenance,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS out_of_service
           FROM fms.call_logs
           WHERE vehicle_number IS NOT NULL`
        )
      : await query(
          `SELECT
            COUNT(*) FILTER (WHERE status IN ('open', 'in_progress'))::int AS under_maintenance,
            COUNT(*) FILTER (WHERE status = 'closed')::int AS active,
            COUNT(*) FILTER (WHERE status = 'resolved')::int AS out_of_service
           FROM fms.call_logs
           WHERE vehicle_number IS NOT NULL`
        );

    const row = result.rows[0] || { under_maintenance: 0, active: 0, out_of_service: 0 };

    res.json({
      vehicles: [
        { label: "Active", count: row.active },
        { label: "Under Maintenance", count: row.under_maintenance },
        { label: "Out of Service", count: row.out_of_service }
      ]
    });
  } catch (error) {
    next(error);
  }
}

async function listMaintenance(req, res, next) {
  try {
    const result = await query(
      `SELECT ms.*, u.name AS created_by_name
       FROM fms.maintenance_schedules ms
       JOIN public.users u ON u.id = ms.created_by
       ORDER BY ms.planned_date ASC`
    );

    res.json({ schedules: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createMaintenance(req, res, next) {
  try {
    const payload = createScheduleSchema.parse(req.body);
    const result = await query(
      `INSERT INTO fms.maintenance_schedules (vehicle_number, planned_date, notes, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.vehicleNumber, payload.plannedDate, payload.notes || null, req.user.sub]
    );

    await recordAudit({
      userId: req.user.sub,
      moduleName: "sgs-fms",
      action: "create",
      entityType: "maintenance_schedule",
      entityId: result.rows[0].id,
      payload
    });

    res.status(201).json({ schedule: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateMaintenance(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = updateScheduleSchema.parse(req.body);

    if (isMySQL) {
      const updateResult = await query(
        `UPDATE fms.maintenance_schedules
         SET status = COALESCE($2, status),
             notes = COALESCE($3, notes)
         WHERE id = $1`,
        [id, payload.status || null, payload.notes || null]
      );

      if (!updateResult.affectedRows) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const refreshed = await query(
        `SELECT * FROM fms.maintenance_schedules WHERE id = $1`,
        [id]
      );
      if (!refreshed.rows[0]) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      await recordAudit({
        userId: req.user.sub,
        moduleName: "sgs-fms",
        action: "update",
        entityType: "maintenance_schedule",
        entityId: id,
        payload
      });

      return res.json({ schedule: refreshed.rows[0] });
    }

    const result = await query(
      `UPDATE fms.maintenance_schedules
       SET status = COALESCE($2, status),
           notes = COALESCE($3, notes)
       WHERE id = $1
       RETURNING *`,
      [id, payload.status || null, payload.notes || null]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    await recordAudit({
      userId: req.user.sub,
      moduleName: "sgs-fms",
      action: "update",
      entityType: "maintenance_schedule",
      entityId: id,
      payload
    });

    res.json({ schedule: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function listCallLogs(req, res, next) {
  try {
    const calls = await fmsImportService.listBreakdownCallLogs();
    res.json({ calls });
  } catch (error) {
    next(error);
  }
}

async function createCallLog(req, res, next) {
  try {
    const payload = createCallSchema.parse(req.body || {});
    const created = await fmsImportService.createCallLog({ payload, user: req.user });
    if (!created.wasDuplicateReplay) {
      await recordAudit({
        userId: req.user.sub,
        moduleName: "sgs-fms",
        action: "create",
        entityType: "call_log",
        entityId: created.id,
        payload
      });
    }
    const responseCall = { ...created };
    delete responseCall.wasDuplicateReplay;
    res.status(201).json({ call: responseCall });
  } catch (error) {
    console.error("FMS create call request failed:", {
      message: error?.message,
      code: error?.code,
      body: req.body ? Object.keys(req.body) : []
    });
    next(error);
  }
}

async function getCallLog(req, res, next) {
  try {
    const id = Number(req.params.id);
    const call = await fmsImportService.getCallLogById(id);
    if (!call) {
      throw new AppError(404, "Call not found");
    }
    res.json({ call });
  } catch (error) {
    next(error);
  }
}

async function updateCallLog(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = updateCallSchema.parse(req.body || {});
    const updated = await fmsImportService.updateCallLog(id, payload, req.user);
    if (!updated) {
      throw new AppError(404, "Call not found");
    }
    await recordAudit({
      userId: req.user.sub,
      moduleName: "sgs-fms",
      action: "update",
      entityType: "call_log",
      entityId: id,
      payload
    });
    res.json({ call: updated });
  } catch (error) {
    console.error("FMS update call request failed:", {
      message: error?.message,
      code: error?.code,
      callId: req.params.id
    });
    next(error);
  }
}

async function deleteCallLog(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, "Call id must be a positive number");
    }

    const result = await fmsImportService.deleteCallLogs([id], req.user);
    if (result.deletedRows) {
      await recordAudit({
        userId: req.user.sub,
        moduleName: "sgs-fms",
        action: "delete",
        entityType: "call_log",
        entityId: id,
        payload: { ids: result.deletedIds, deletedRows: result.deletedRows }
      });
    }

    res.json(result);
  } catch (error) {
    console.error("FMS delete call request failed:", {
      message: error?.message,
      code: error?.code,
      callId: req.params.id
    });
    next(error);
  }
}

async function deleteCallLogs(req, res, next) {
  try {
    const payload = deleteCallSchema.parse(req.body || {});
    const result = await fmsImportService.deleteCallLogs(payload.ids, req.user);
    if (result.deletedRows) {
      await recordAudit({
        userId: req.user.sub,
        moduleName: "sgs-fms",
        action: "delete",
        entityType: "call_log",
        entityId: result.deletedIds[0] || null,
        payload: { ids: result.deletedIds, deletedRows: result.deletedRows }
      });
    }

    res.json(result);
  } catch (error) {
    console.error("FMS bulk delete call request failed:", {
      message: error?.message,
      code: error?.code,
      ids: req.body?.ids
    });
    next(error);
  }
}

async function listImportHistory(req, res, next) {
  try {
    const imports = await fmsImportService.listImportHistory();
    res.json({ imports });
  } catch (error) {
    next(error);
  }
}

async function importCallLogs(req, res, next) {
  try {
    const payload = req.body || {};
    if (!payload.importKey || !payload.fileName || !Array.isArray(payload.rows)) {
      throw new AppError(400, "importKey, fileName, and rows are required");
    }

    const result = await fmsImportService.importBreakdownChunk({
      importKey: payload.importKey,
      fileName: payload.fileName,
      fileSizeBytes: payload.fileSizeBytes,
      totalRows: payload.totalRows,
      rows: payload.rows,
      user: req.user
    });

    res.status(201).json({
      importBatch: result.batch,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      failedCount: result.failedCount
    });
  } catch (error) {
    next(error);
  }
}

async function listImportErrors(req, res, next) {
  try {
    const importId = Number(req.params.id);
    const errors = await fmsImportService.listImportErrors(importId);
    res.json({ errors });
  } catch (error) {
    next(error);
  }
}

async function rollbackLastImport(req, res, next) {
  try {
    const result = await fmsImportService.rollbackLastImport(req.user);
    if (!result) {
      return res.status(404).json({ message: "No import batch found to roll back" });
    }

    await recordAudit({
      userId: req.user.sub,
      moduleName: "sgs-fms",
      action: "rollback",
      entityType: "call_log_import",
      entityId: result.batch.id,
      payload: { importKey: result.batch.importKey, deletedRows: result.deletedRows }
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  vehicleStatus,
  listMaintenance,
  createMaintenance,
  updateMaintenance,
  listCallLogs,
  createCallLog,
  getCallLog,
  updateCallLog,
  deleteCallLog,
  deleteCallLogs,
  listImportHistory,
  importCallLogs,
  listImportErrors,
  rollbackLastImport
};
