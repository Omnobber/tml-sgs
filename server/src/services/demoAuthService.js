const { MODULES, ROLES } = require("../utils/constants");

const DEMO_PASSWORD = "Password@123";

const demoUsers = [
  { id: 1001, name: "ERC Admin", email: "erc.admin@sgs.local", module: MODULES.ERC, role: ROLES.ADMIN },
  { id: 1002, name: "ERC Engineer", email: "erc.engineer@sgs.local", module: MODULES.ERC, role: ROLES.ENGINEER },
  { id: 1003, name: "ERC Client", email: "erc.client@sgs.local", module: MODULES.ERC, role: ROLES.CLIENT },
  { id: 2001, name: "FMS Admin", email: "fms.admin@sgs.local", module: MODULES.FMS, role: ROLES.ADMIN },
  { id: 2002, name: "FMS Engineer", email: "fms.engineer@sgs.local", module: MODULES.FMS, role: ROLES.ENGINEER },
  { id: 2003, name: "FMS Client", email: "fms.client@sgs.local", module: MODULES.FMS, role: ROLES.CLIENT },
  { id: 9001, name: "Super Admin", email: "super.admin@sgs.local", module: MODULES.SUPER, role: ROLES.SUPER_ADMIN }
];

function findDemoUser(email, moduleName, role) {
  const normalized = String(email || "").toLowerCase().trim();
  const user = demoUsers.find((u) => u.email === normalized && u.module === moduleName && u.role === role);
  if (!user) {
    return null;
  }
  return {
    ...user,
    is_active: true,
    is_demo: true,
    password_plain: DEMO_PASSWORD
  };
}

function validateDemoPassword(user, password) {
  return user?.is_demo && password === user.password_plain;
}

module.exports = {
  findDemoUser,
  validateDemoPassword
};
