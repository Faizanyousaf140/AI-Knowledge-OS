const noteService = require("./note.service");
const asyncHandler = require("../../utils/asyncHandler");

// Create Note
exports.createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(
    req.params.projectId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: note,
  });
});

// Get Notes
exports.getNotes = asyncHandler(async (req, res) => {
  const result = await noteService.getProjectNotes(
    req.params.projectId,
    req.user.id,
    {
      page: req.query.page,
      limit: req.query.limit,
    }
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

// Delete Note
exports.deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote(
    req.params.noteId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Note deleted successfully",
  });
});

// Update Note
exports.updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(
    req.params.noteId,
    req.user.id,
    req.body
  );

  res.status(200).json({
    success: true,
    data: note,
  });
});
