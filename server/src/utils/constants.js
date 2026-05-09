const MODULES = {
  ERC: "sgs-erc",
  FMS: "sgs-fms",
  SUPER: "super"
};

const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  ENGINEER: "engineer",
  CLIENT: "client"
};

const MODULE_SCHEMA_MAP = {
  [MODULES.ERC]: "erc",
  [MODULES.FMS]: "fms"
};

const VALID_PRIORITIES = ["low", "medium", "high", "critical"];
const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];

module.exports = {
  MODULES,
  ROLES,
  MODULE_SCHEMA_MAP,
  VALID_PRIORITIES,
  VALID_STATUSES
};
