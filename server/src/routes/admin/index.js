const express = require("express");
const { authRequired } = require("../../middleware/auth");
const { roleGuard } = require("../../middleware/guards");
const reportsController = require("../../controllers/reportsController");

const router = express.Router();

router.use(authRequired, roleGuard(["super_admin"]));

router.get("/summary", reportsController.superSummary);

module.exports = router;
