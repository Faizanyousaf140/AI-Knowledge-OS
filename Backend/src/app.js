const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const app = express();
const authRoutes = require("./modules/auth/auth.routes");
const projectRoutes = require("./modules/project/project.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const { apiLimiter } = require("./middlewares/rateLimit.middleware");
const sanitize = require("./middlewares/sanitize.middleware");
const logger = require("./utils/logger");
const swaggerDocument = require("./config/swagger");
// Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(sanitize);
app.use("/api", apiLimiter);
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Root test route
app.get("/", (req, res) => {
  res.send("AI Knowledge OS API Running 🚀");
});

// API info route (browser-friendly)
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    endpoints: {
      auth: "/api/auth",
      projects: "/api/projects",
      ai: "/api/ai",
    },
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//error middleware
const errorHandler = require("./middlewares/error.middleware");

app.use(errorHandler);

module.exports = app;