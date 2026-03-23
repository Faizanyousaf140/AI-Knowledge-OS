const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

exports.chatSchema = {
  body: Joi.object({
    question: Joi.string().min(2).required(),
    projectId: objectId.required(),
  }),
};

exports.historySchema = {
  query: Joi.object({
    projectId: objectId.required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
};
