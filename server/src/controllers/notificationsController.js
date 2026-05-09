const notificationService = require("../services/notificationService");
const { AppError } = require("../utils/errors");

async function list(req, res, next) {
  try {
    const notifications = await notificationService.listNotifications(req.scopeModule, req.user.sub);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    const record = await notificationService.markRead(req.scopeModule, id, req.user.sub);
    if (!record) {
      throw new AppError(404, "Notification not found");
    }
    res.json({ notification: record });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, markRead };
