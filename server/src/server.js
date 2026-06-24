require("./config/env");

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const env = require("./config/env");
const { query, isMySQL } = require("./db/pool");
const { sanitizeBody } = require("./middleware/sanitize");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const ercRoutes = require("./routes/erc");
const fmsRoutes = require("./routes/fms");
const adminRoutes = require("./routes/admin");

const app = express();
const clientDistPath = path.resolve(process.cwd(), "client", "dist");

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((x) => x.trim()),
    credentials: true
  })
);
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(sanitizeBody);
app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({
      status: "ok",
      service: "sgs-cms-server",
      database: "ok",
      databaseType: isMySQL ? "mysql" : "postgres"
    });
  } catch (error) {
    console.error("Health check failed:", {
      message: error?.message,
      code: error?.code
    });
    res.status(503).json({
      status: "degraded",
      service: "sgs-cms-server",
      database: "unavailable",
      databaseType: isMySQL ? "mysql" : "postgres",
      message: "Database unavailable"
    });
  }
});

function setClientCacheHeaders(res, filePath) {
  if (!filePath) return;
  if (filePath.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return;
  }

  if (filePath.includes("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
}

app.use("/api/auth", authRoutes);
app.use("/api/erc", ercRoutes);
app.use("/api/fms", fmsRoutes);
app.use("/api/admin", adminRoutes);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { setHeaders: setClientCacheHeaders }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.accepts("html")) {
      return res.sendFile(path.join(clientDistPath, "index.html"));
    }

    return next();
  });
}

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`SGS CMS server running on port ${env.port}`);
});
