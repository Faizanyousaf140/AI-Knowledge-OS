const Joi = require("joi");

const passwordSchema = Joi.string().min(8).max(128).required();

exports.registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().email().required(),
    password: passwordSchema,
  }),
};

exports.loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

exports.refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

exports.logoutSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

exports.emailSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

exports.resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    password: passwordSchema,
  }),
};

exports.updateProfileSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).optional(),
    interests: Joi.array().items(Joi.string().trim().min(1).max(80)).max(30).optional(),
  }).min(1),
};

exports.updateUserRoleParamsSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.updateUserRoleSchema = {
  body: Joi.object({
    role: Joi.string().valid("user", "admin").required(),
  }),
};
