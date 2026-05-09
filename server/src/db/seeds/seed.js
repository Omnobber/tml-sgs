const bcrypt = require("bcryptjs");
require("../../config/env");

const env = require("../../config/env");
const { query, pool } = require("../pool");

const seedUsers = [
  { name: "ERC Admin", email: "erc.admin@sgs.local", password: "Password@123", module: "sgs-erc", role: "admin" },
  { name: "ERC Engineer", email: "erc.engineer@sgs.local", password: "Password@123", module: "sgs-erc", role: "engineer" },
  { name: "ERC Client", email: "erc.client@sgs.local", password: "Password@123", module: "sgs-erc", role: "client" },
  { name: "FMS Admin", email: "fms.admin@sgs.local", password: "Password@123", module: "sgs-fms", role: "admin" },
  { name: "FMS Engineer", email: "fms.engineer@sgs.local", password: "Password@123", module: "sgs-fms", role: "engineer" },
  { name: "FMS Client", email: "fms.client@sgs.local", password: "Password@123", module: "sgs-fms", role: "client" },
  { name: "Super Admin", email: "super.admin@sgs.local", password: "Password@123", module: "super", role: "super_admin" }
];

async function upsertUsers() {
  for (const user of seedUsers) {
    const hash = await bcrypt.hash(user.password, env.bcryptRounds);
    await query(
      `INSERT INTO public.users (name, email, password_hash, module, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       module = EXCLUDED.module,
       role = EXCLUDED.role`,
      [user.name, user.email, hash, user.module, user.role]
    );
  }
}

async function seedCalls() {
  const ercCreator = await query(`SELECT id FROM public.users WHERE email = 'erc.engineer@sgs.local'`);
  const fmsCreator = await query(`SELECT id FROM public.users WHERE email = 'fms.engineer@sgs.local'`);

  if (ercCreator.rows[0]) {
    await query(
      `INSERT INTO erc.call_logs (reference_no, caller_name, contact, location, issue_type, priority, status, description, created_by)
       VALUES
       ('ERC-SEED-1001', 'Plant Supervisor', '+91-9000000001', 'Line A', 'Power Trip', 'high', 'open', 'Unexpected power trip in control panel', $1)
       ON CONFLICT (reference_no) DO NOTHING`,
      [ercCreator.rows[0].id]
    );
  }

  if (fmsCreator.rows[0]) {
    await query(
      `INSERT INTO fms.call_logs (reference_no, caller_name, contact, location, issue_type, priority, status, description, created_by, vehicle_number, severity)
       VALUES
       ('FMS-SEED-2001', 'Depot Manager', '+91-9000000002', 'Pune Yard', 'Engine Fault', 'critical', 'in_progress', 'Vehicle stalling after ignition', $1, 'MH12AB1234', 'critical')
       ON CONFLICT (reference_no) DO NOTHING`,
      [fmsCreator.rows[0].id]
    );
  }
}

async function run() {
  await upsertUsers();
  await seedCalls();
  console.log("Seed complete");
  await pool.end();
}

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
