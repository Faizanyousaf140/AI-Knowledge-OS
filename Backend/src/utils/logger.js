const { createLogger, format, transports } = require("winston");

const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";

const loggerTransports = [new transports.Console()];

if (!isVercelRuntime) {
  loggerTransports.push(
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" })
  );
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: loggerTransports,
});

module.exports = logger;
