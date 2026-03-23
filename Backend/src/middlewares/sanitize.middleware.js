const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(value)) {
    const cleanKey = key.replace(/\$/g, "").replace(/\./g, "");
    sanitized[cleanKey] = sanitizeObject(val);
  }

  return sanitized;
};

module.exports = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  next();
};
