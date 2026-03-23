const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";
const disableAllRateLimits = process.env.RATE_LIMIT_DISABLE === "true";
const disableInDev = process.env.RATE_LIMIT_DISABLE_IN_DEV !== "false";

const apiWindowMs = Number(process.env.RATE_LIMIT_API_WINDOW_MS || 15 * 60 * 1000);
const apiMax = Number(process.env.RATE_LIMIT_API_MAX || (isProduction ? 100 : 5000));

const aiWindowMs = Number(process.env.RATE_LIMIT_AI_WINDOW_MS || 60 * 1000);
const aiMax = Number(process.env.RATE_LIMIT_AI_MAX || (isProduction ? 20 : 300));

const shouldSkip = () => {
  if (disableAllRateLimits) return true;
  if (!isProduction && disableInDev) return true;
  return false;
};

exports.apiLimiter = rateLimit({
  windowMs: apiWindowMs,
  max: apiMax,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Try again later.",
});

exports.aiLimiter = rateLimit({
  windowMs: aiWindowMs,
  max: aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: "Too many AI requests. Try again in a minute.",
});