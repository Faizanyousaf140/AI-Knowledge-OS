const express = require("express");
const router = express.Router({ mergeParams: true });

const protect = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  createNoteSchema,
  noteParamsSchema,
  noteDeleteParamsSchema,
  noteListQuerySchema,
  updateNoteSchema,
  noteUpdateParamsSchema,
} = require("./note.validation");
const {
  createNote,
  getNotes,
  deleteNote,
  updateNote,
} = require("./note.controller");

router.post("/", protect, validate(noteParamsSchema), validate(createNoteSchema), createNote);
router.get("/", protect, validate(noteParamsSchema), validate(noteListQuerySchema), getNotes);
router.patch("/:noteId", protect, validate(noteUpdateParamsSchema), validate(updateNoteSchema), updateNote);
router.delete("/:noteId", protect, validate(noteDeleteParamsSchema), deleteNote);

module.exports = router;
