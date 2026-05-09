const { z } = require("zod");
const userService = require("../services/userService");
const { recordAudit } = require("../services/auditService");
const { AppError } = require("../utils/errors");

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "engineer", "client"])
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["admin", "engineer", "client"]).optional(),
  isActive: z.boolean().optional()
});

async function list(req, res, next) {
  try {
    const users = await userService.listUsersByModule(req.scopeModule);
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const payload = createSchema.parse(req.body);
    const user = await userService.createModuleUser({ ...payload, moduleName: req.scopeModule });

    await recordAudit({
      userId: req.user.sub,
      moduleName: req.scopeModule,
      action: "create",
      entityType: "user",
      entityId: user.id,
      payload: { email: payload.email, role: payload.role }
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = updateSchema.parse(req.body);
    const user = await userService.updateModuleUser({
      id,
      moduleName: req.scopeModule,
      ...payload
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    await recordAudit({
      userId: req.user.sub,
      moduleName: req.scopeModule,
      action: "update",
      entityType: "user",
      entityId: user.id,
      payload
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update };
