const { ZodError } = require("zod");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Request error:", {
    path: req.path,
    method: req.method,
    message: err?.message,
    stack: err?.stack,
    code: err?.code
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    error: err.message || "Internal server error",
    details: err.details || undefined
  });
}

module.exports = { errorHandler };
