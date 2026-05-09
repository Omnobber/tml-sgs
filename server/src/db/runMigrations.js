const fs = require("fs");
const path = require("path");
require("../config/env");

const { query, pool } = require("./pool");

async function run() {
  const migrationPath = path.resolve(__dirname, "migrations", "001_init.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  await query(sql);
  console.log("Migration complete");
  await pool.end();
}

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
