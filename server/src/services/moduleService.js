const { MODULE_SCHEMA_MAP } = require("../utils/constants");
const { AppError } = require("../utils/errors");

function resolveSchema(moduleName) {
  const schema = MODULE_SCHEMA_MAP[moduleName];
  if (!schema) {
    throw new AppError(400, "Unknown module");
  }
  return schema;
}

module.exports = { resolveSchema };
