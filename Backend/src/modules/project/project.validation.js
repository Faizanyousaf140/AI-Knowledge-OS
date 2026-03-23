const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

exports.createProjectSchema = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().allow(""),
  tags: Joi.array().items(Joi.string()),
});

exports.updateProjectSchema = Joi.object({
  name: Joi.string().min(3),
  description: Joi.string().allow(""),
  tags: Joi.array().items(Joi.string()),
});

exports.projectIdParamsSchema = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

exports.projectListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(5),
    search: Joi.string().allow("").default(""),
    sort: Joi.string().allow("createdAt", "-createdAt", "name", "-name").default("-createdAt"),
    tag: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};