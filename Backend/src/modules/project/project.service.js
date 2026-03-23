const projectRepository = require("./project.repository");

exports.createProject = async (data, userId) => {
  return await projectRepository.create({
    ...data,
    owner: userId,
  });
};

exports.getUserProjects = async (userId, options) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 5;
  const skip = (page - 1) * limit;
  const search = options.search || "";
  const sort = options.sort || "-createdAt";
  const tag = options.tag;
  const startDate = options.startDate;
  const endDate = options.endDate;

  const sortObj = {};
  if (sort.startsWith("-")) {
    sortObj[sort.slice(1)] = -1;
  } else {
    sortObj[sort] = 1;
  }

  const query = {
    owner: userId,
    isDeleted: false,
    name: { $regex: search, $options: "i" },
  };

  if (tag) {
    query.tags = tag;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const projects = await projectRepository.findMany(query, {
    skip,
    limit,
    sort: sortObj,
  });

  const total = await projectRepository.count(query);

  return {
    page,
    totalPages: Math.ceil(total / limit),
    total,
    data: projects,
  };
};

exports.getProjectById = async (projectId, userId) => {
  const project = await projectRepository.findOneLean({
    _id: projectId,
    owner: userId,
    isDeleted: false,
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

exports.updateProject = async (projectId, userId, data) => {
  const project = await projectRepository.findOneAndUpdate(
    { _id: projectId, owner: userId, isDeleted: false },
    data
  );

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

exports.softDeleteProject = async (projectId, userId) => {
  const project = await projectRepository.findOne({
    _id: projectId,
    owner: userId,
    isDeleted: false,
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  project.isDeleted = true;
  await project.save();
};

exports.getProjectStats = async (userId) => {
  const totalProjects = await projectRepository.count({
    owner: userId,
    isDeleted: false,
  });

  const totalNotes = await projectRepository.countNotesByUser(userId);

  return {
    totalProjects,
    totalNotes,
  };
};

exports.getProjectByIdStats = async (projectId, userId) => {
  const project = await projectRepository.findOneLean({
    _id: projectId,
    owner: userId,
    isDeleted: false,
  }, "_id tags");

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const noteStats = await projectRepository.aggregateNoteStatsByProject(
    projectId,
    userId,
    oneWeekAgo
  );

  return {
    totalNotes: noteStats[0]?.totalNotes || 0,
    notesThisWeek: noteStats[0]?.notesThisWeek || 0,
    tagsCount: project.tags?.length || 0,
  };
};

exports.getAllProjectsAdmin = async (options) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { isDeleted: false };

  const projects = await projectRepository.findMany(query, {
    skip,
    limit,
    sort: { createdAt: -1 },
  });

  const total = await projectRepository.count(query);

  return {
    page,
    totalPages: Math.ceil(total / limit),
    total,
    data: projects,
  };
};

exports.regenerateEmbeddingsForProject = async (projectId) => {
  const Note = require('../note/note.model');
  const { addEmbeddingJob } = require('../ai/embedding.queue');
  const { generateEmbedding } = require('../ai/embedding.service');
  const notes = await Note.find({ project: projectId, isDeleted: false });
  let processed = 0;

  for (const note of notes) {
    try {
      const queued = await addEmbeddingJob({ noteId: note._id.toString(), content: note.content });
      if (!queued) {
        const emb = await generateEmbedding(note.content);
        note.embedding = emb;
        await note.save();
      }
      processed++;
    } catch (e) {
      // continue on error for other notes
    }
  }

  return { processed };
};
