const projectService = require("./project.service");
const asyncHandler = require("../../utils/asyncHandler");

exports.createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: project,
  });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const { page, limit, search, sort, tag, startDate, endDate } = req.query;

  const result = await projectService.getUserProjects(
    req.user.id,
    { page, limit, search, sort, tag, startDate, endDate }
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: project,
  });
});

exports.updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.id,
    req.user.id,
    req.body
  );

  res.status(200).json({
    success: true,
    data: project,
  });
});

exports.deleteProject = asyncHandler(async (req, res) => {
  await projectService.softDeleteProject(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await projectService.getProjectByIdStats(
    req.params.id,
    req.user.id
  );

  res.json({
    success: true,
    data: stats,
  });
});

exports.getAllProjectsAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await projectService.getAllProjectsAdmin({ page, limit });

  res.status(200).json({
    success: true,
    ...result,
  });
});

exports.regenerateEmbeddings = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const result = await projectService.regenerateEmbeddingsForProject(projectId);

  res.status(200).json({
    success: true,
    data: result,
    message: `Regeneration requested for project ${projectId}`,
  });
});