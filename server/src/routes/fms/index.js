const express = require("express");
const { authRequired } = require("../../middleware/auth");
const { moduleGuard, roleGuard } = require("../../middleware/guards");
const usersController = require("../../controllers/usersController");
const reportsController = require("../../controllers/reportsController");
const notificationsController = require("../../controllers/notificationsController");
const fmsController = require("../../controllers/fmsController");

const router = express.Router();

router.use(authRequired, moduleGuard("sgs-fms"));

router.get("/calls", fmsController.listCallLogs);
router.post("/calls", roleGuard(["admin", "engineer", "supervisor", "super_admin"]), fmsController.createCallLog);
router.get("/calls/:id", fmsController.getCallLog);
router.patch("/calls/:id", roleGuard(["admin", "engineer", "supervisor", "super_admin"]), fmsController.updateCallLog);
router.delete("/calls/:id", roleGuard(["admin", "engineer", "supervisor", "super_admin"]), fmsController.deleteCallLog);
router.post("/calls/delete", roleGuard(["admin", "engineer", "supervisor", "super_admin"]), fmsController.deleteCallLogs);

router.get("/reports/summary", roleGuard(["admin", "engineer"]), reportsController.moduleSummary);

router.get("/users", roleGuard(["admin"]), usersController.list);
router.post("/users", roleGuard(["admin"]), usersController.create);
router.patch("/users/:id", roleGuard(["admin"]), usersController.update);

router.get("/notifications", notificationsController.list);
router.patch("/notifications/:id/read", notificationsController.markRead);

router.get("/vehicle-status", fmsController.vehicleStatus);
router.get("/maintenance", roleGuard(["admin", "engineer"]), fmsController.listMaintenance);
router.post("/maintenance", roleGuard(["admin", "engineer"]), fmsController.createMaintenance);
router.patch("/maintenance/:id", roleGuard(["admin", "engineer"]), fmsController.updateMaintenance);
router.get("/imports", roleGuard(["admin", "supervisor"]), fmsController.listImportHistory);
router.post("/imports", roleGuard(["admin", "supervisor"]), fmsController.importCallLogs);
router.get("/imports/:id/errors", roleGuard(["admin", "supervisor"]), fmsController.listImportErrors);
router.post("/imports/rollback-last", roleGuard(["admin", "supervisor"]), fmsController.rollbackLastImport);

module.exports = router;
