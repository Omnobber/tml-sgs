const { z } = require("zod");
const callService = require("../services/callService");
const { recordAudit } = require("../services/auditService");
const { createNotification } = require("../services/notificationService");
const { AppError } = require("../utils/errors");

const createSchema = z.object({
  callerName: z.string().min(2),
  contact: z.string().min(3),
  location: z.string().min(2),
  issueType: z.string().min(2),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(3),
  assignedTo: z.number().int().positive().optional(),
  vehicleNumber: z.string().optional(),
  severity: z.string().optional()
});

const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  assignedTo: z.number().int().positive().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  description: z.string().min(3).optional(),
  comment: z.string().min(2)
});

async function list(req, res, next) {
  try {
    const calls = await callService.listCalls({
      moduleName: req.scopeModule,
      user: req.user,
      filters: req.query
    });
    res.json({ calls });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const payload = createSchema.parse(req.body);
    const created = await callService.createCall({ moduleName: req.scopeModule, payload, user: req.user });

    if (created.assigned_to) {
      await createNotification(
        req.scopeModule,
        created.assigned_to,
        `New call assigned: ${created.reference_no} (${created.issue_type})`
      );
    }

    await recordAudit({
      userId: req.user.sub,
      moduleName: req.scopeModule,
      action: "create",
      entityType: "call_log",
      entityId: created.id,
      payload
    });

    res.status(201).json({ call: created });
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const record = await callService.getCallById({ moduleName: req.scopeModule, id, user: req.user });
    if (!record) {
      throw new AppError(404, "Call not found");
    }
    res.json({ call: record });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = updateSchema.parse(req.body);
    const updated = await callService.updateCall({ moduleName: req.scopeModule, id, payload, user: req.user });

    if (!updated) {
      throw new AppError(404, "Call not found or access denied");
    }

    if (updated.assigned_to) {
      await createNotification(
        req.scopeModule,
        updated.assigned_to,
        `Call ${updated.reference_no} updated to status ${updated.status}`
      );
    }

    await recordAudit({
      userId: req.user.sub,
      moduleName: req.scopeModule,
      action: "update",
      entityType: "call_log",
      entityId: id,
      payload
    });

    res.json({ call: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, detail, update };
