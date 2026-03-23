module.exports = (schema) => (req, res, next) => {
  const segments = schema.body || schema.params || schema.query
    ? schema
    : { body: schema };

  for (const [segment, segmentSchema] of Object.entries(segments)) {
    const { error, value } = segmentSchema.validate(req[segment], {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    req[segment] = value;
  }

  next();
};