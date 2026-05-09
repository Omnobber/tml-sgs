const { z } = require("zod");
const { query } = require("../db/pool");
const { recordAudit } = require("../services/auditService");

const createScheduleSchema = z.object({
  vehicleNumber: z.string().min(3),
  plannedDate: z.string(),
  notes: z.string().optional()
});

const updateScheduleSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed"]).optional(),
  notes: z.string().optional()
});

async function vehicleStatus(req, res, next) {
  try {
    const result = await query(
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

module.exports = {
  vehicleStatus,
  listMaintenance,
  createMaintenance,
  updateMaintenance
};
