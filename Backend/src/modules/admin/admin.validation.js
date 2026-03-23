const Joi = require('joi');

exports.usageQuerySchema = {
  query: Joi.object({
    userId: Joi.string().hex().length(24).optional(),
    projectId: Joi.string().hex().length(24).optional(),
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};

exports.userUsageQuerySchema = {
  query: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};
