const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

exports.createNoteSchema = Joi.object({
  content: Joi.string().min(3).required(),
});

exports.noteParamsSchema = {
  params: Joi.object({
    projectId: objectId.required(),
  }),
};

exports.noteDeleteParamsSchema = {
  params: Joi.object({
    projectId: objectId.required(),
    noteId: objectId.required(),
  }),
};

exports.noteListQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

exports.updateNoteSchema = Joi.object({
  content: Joi.string().min(1).required(),
});

exports.noteUpdateParamsSchema = {
  params: Joi.object({
    projectId: objectId.required(),
    noteId: objectId.required(),
  }),
};
