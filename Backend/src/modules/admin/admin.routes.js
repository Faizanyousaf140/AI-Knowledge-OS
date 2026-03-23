const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const protect = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { usageQuerySchema, userUsageQuerySchema } = require('./admin.validation');

router.get('/usage', protect, authorize('admin'), validate(usageQuerySchema), adminController.getUsage);
router.get('/usage/user', protect, authorize('admin'), validate(userUsageQuerySchema), adminController.getRecentUsageByUser);

module.exports = router;
