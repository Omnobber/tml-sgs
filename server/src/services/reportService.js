const { query } = require("../db/pool");
const { resolveSchema } = require("./moduleService");

async function getModuleSummary(moduleName) {
  const schema = resolveSchema(moduleName);
  const summary = await query(
    `SELECT
      COUNT(*)::int AS total_calls,
      COUNT(*) FILTER (WHERE status IN ('open', 'in_progress'))::int AS open_calls,
      COUNT(*) FILTER (WHERE status = 'closed')::int AS closed_calls,
      COUNT(*) FILTER (WHERE priority = 'critical')::int AS critical_calls,
      ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2) AS avg_resolution_hours
     FROM ${schema}.call_logs`
  );

  const byPriority = await query(
    `SELECT priority, COUNT(*)::int AS count
     FROM ${schema}.call_logs
     GROUP BY priority
     ORDER BY count DESC`
  );

  const monthlyTrend = await query(
    `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*)::int AS count
     FROM ${schema}.call_logs
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY DATE_TRUNC('month', created_at) ASC`
  );

  return {
    summary: summary.rows[0],
    byPriority: byPriority.rows,
    monthlyTrend: monthlyTrend.rows
  };
}

async function getSuperAdminSummary() {
  const [erc, fms] = await Promise.all([
    getModuleSummary("sgs-erc"),
    getModuleSummary("sgs-fms")
  ]);

  return {
    erc,
    fms,
    totals: {
      totalCalls: Number(erc.summary.total_calls || 0) + Number(fms.summary.total_calls || 0),
      openCalls: Number(erc.summary.open_calls || 0) + Number(fms.summary.open_calls || 0),
      closedCalls: Number(erc.summary.closed_calls || 0) + Number(fms.summary.closed_calls || 0)
    }
  };
}

module.exports = { getModuleSummary, getSuperAdminSummary };
