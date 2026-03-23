const express = require("express");
const router = express.Router();
const projectController = require("./project.controller");
const protect = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
	createProjectSchema,
	updateProjectSchema,
	projectIdParamsSchema,
	projectListQuerySchema,
} = require("./project.validation");

// Mount notes routes as nested resource
const noteRoutes = require("../note/note.routes");
router.use("/:projectId/notes", noteRoutes);

router.get("/admin/all", protect, authorize("admin"), projectController.getAllProjectsAdmin);
router.post("/admin/:projectId/regenerate-embeddings", protect, authorize("admin"), projectController.regenerateEmbeddings);
router.get("/:id/stats", protect, validate(projectIdParamsSchema), projectController.getStats);
router.post("/", protect, validate(createProjectSchema), projectController.createProject);
router.get("/", protect, validate(projectListQuerySchema), projectController.getProjects);
router.get("/:id", protect, validate(projectIdParamsSchema), projectController.getProjectById);
router.patch("/:id", protect, validate(projectIdParamsSchema), validate(updateProjectSchema), projectController.updateProject);
router.put("/:id", protect, validate(projectIdParamsSchema), validate(updateProjectSchema), projectController.updateProject);
router.delete("/:id", protect, validate(projectIdParamsSchema), projectController.deleteProject);
module.exports = router;