require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const env = require("./config/env");
const { sanitizeBody } = require("./middleware/sanitize");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const ercRoutes = require("./routes/erc");
const fmsRoutes = require("./routes/fms");
const adminRoutes = require("./routes/admin");

const app = express();

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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "sgs-cms-server" });
});

app.use("/api/auth", authRoutes);
app.use("/api/erc", ercRoutes);
app.use("/api/fms", fmsRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`SGS CMS server running on port ${env.port}`);
});
