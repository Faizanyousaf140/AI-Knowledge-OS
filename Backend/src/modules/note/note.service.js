const Note = require("./note.model");
const Project = require("../project/project.model");
const logger = require("../../utils/logger");
const { addEmbeddingJob } = require("../ai/embedding.queue");
const { generateEmbedding } = require("../ai/embedding.service");
const usageService = require("../usage/usage.service");

// Create Note
exports.createNote = async (projectId, userId, data) => {
  const project = await Project.findOne({
    _id: projectId,
    owner: userId,
    isDeleted: false,
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const note = await Note.create({
    content: data.content,
    project: projectId,
    owner: userId,
  });

  try {
    const queued = await addEmbeddingJob({
      noteId: note._id.toString(),
      content: note.content,
    });

    if (!queued) {
      const embedding = await generateEmbedding(note.content);
      note.embedding = embedding;
      await note.save();
      await usageService.trackEmbeddingCreated(userId, projectId);
    }
  } catch (error) {
    logger.error({
      message: "Failed to enqueue embedding job for note",
      error: error.message,
      noteId: note._id,
    });
  }

  return note;
};

// Get Notes for a Project (READ → use lean)
exports.getProjectNotes = async (projectId, userId, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {
    project: projectId,
    owner: userId,
    isDeleted: false,
  };

  const notes = await Note.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();   // ✅ performance boost

  const total = await Note.countDocuments(query);

  return {
    data: notes,
    page,
    totalPages: Math.ceil(total / limit),
    total,
  };
};

// Soft Delete Note
exports.deleteNote = async (noteId, userId) => {
  const note = await Note.findOne({
    _id: noteId,
    owner: userId,
    isDeleted: false,
  });

  if (!note) {
    const error = new Error("Note not found");
    error.statusCode = 404;
    throw error;
  }

  note.isDeleted = true;
  await note.save();
};

// Update Note content and re-generate embedding
exports.updateNote = async (noteId, userId, data) => {
  const note = await Note.findOne({
    _id: noteId,
    owner: userId,
    isDeleted: false,
  });

  if (!note) {
    const error = new Error("Note not found");
    error.statusCode = 404;
    throw error;
  }

  note.content = data.content;
  note.updatedAt = new Date();
  await note.save();

  try {
    const queued = await addEmbeddingJob({
      noteId: note._id.toString(),
      content: note.content,
    });

    if (!queued) {
      const embedding = await generateEmbedding(note.content);
      note.embedding = embedding;
      await note.save();
      await usageService.trackEmbeddingCreated(userId, note.project);
    }
  } catch (error) {
    logger.error({
      message: "Failed to enqueue/generate embedding for updated note",
      error: error.message,
      noteId: note._id,
    });
  }

  return note;
};
