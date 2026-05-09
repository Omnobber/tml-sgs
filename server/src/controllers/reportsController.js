const { getModuleSummary, getSuperAdminSummary } = require("../services/reportService");

async function moduleSummary(req, res, next) {
  try {
    const data = await getModuleSummary(req.scopeModule);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function superSummary(req, res, next) {
  try {
    const data = await getSuperAdminSummary();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { moduleSummary, superSummary };
