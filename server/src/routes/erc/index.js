const express = require("express");
const { authRequired } = require("../../middleware/auth");
const { moduleGuard, roleGuard } = require("../../middleware/guards");
const callsController = require("../../controllers/callsController");
const usersController = require("../../controllers/usersController");
const reportsController = require("../../controllers/reportsController");
const notificationsController = require("../../controllers/notificationsController");

const router = express.Router();

router.use(authRequired, moduleGuard("sgs-erc"));

router.get("/calls", callsController.list);
router.post("/calls", roleGuard(["admin", "engineer"]), callsController.create);
router.get("/calls/:id", callsController.detail);
router.patch("/calls/:id", roleGuard(["admin", "engineer", "client"]), callsController.update);

router.get("/reports/summary", roleGuard(["admin", "engineer"]), reportsController.moduleSummary);

router.get("/users", roleGuard(["admin"]), usersController.list);
router.post("/users", roleGuard(["admin"]), usersController.create);
router.patch("/users/:id", roleGuard(["admin"]), usersController.update);

router.get("/notifications", notificationsController.list);
router.patch("/notifications/:id/read", notificationsController.markRead);

module.exports = router;
