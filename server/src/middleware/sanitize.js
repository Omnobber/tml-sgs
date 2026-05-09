function sanitizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }

  if (payload && typeof payload === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(payload)) {
      cleaned[key] = sanitizePayload(value);
    }
    return cleaned;
  }

  if (typeof payload === "string") {
    return payload.trim();
  }

  return payload;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizePayload(req.body);
  }
  next();
}

module.exports = { sanitizeBody };
