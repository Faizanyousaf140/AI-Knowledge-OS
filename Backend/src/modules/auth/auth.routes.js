const express = require("express");
const router = express.Router();
const protect = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  emailSchema,
  resetPasswordSchema,
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserRoleParamsSchema,
} = require("./auth.validation");

const {
  register,
  login,
  refreshToken,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  listUsers,
  updateUserRole,
  deleteUser,
  updateProfile,
  unlinkProvider,
} = require("./auth.controller");
const oauthRoutes = require('./oauth.routes');

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth routes",
    useMethod: "POST",
    endpoints: ["/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout"],
  });
});

router.get("/register", (req, res) => {
  res.status(200).json({
    success: false,
    message: "Use POST /api/auth/register",
  });
});

router.get("/login", (req, res) => {
  res.status(200).json({
    success: false,
    message: "Use POST /api/auth/login",
  });
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get('/me', protect, me);
router.post("/refresh", validate(refreshSchema), refreshToken);
router.post("/logout", validate(logoutSchema), logout);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', validate(emailSchema), resendVerification);
router.post('/forgot-password', validate(emailSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get("/users", protect, authorize("admin"), listUsers);
router.patch('/users/:id/role', protect, authorize('admin'), validate(updateUserRoleParamsSchema), validate(updateUserRoleSchema), updateUserRole);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
// OAuth placeholders: /api/auth/oauth/google etc.
router.use('/oauth', oauthRoutes);
// Update profile (name, interests)
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);
router.delete('/oauth/:provider', protect, unlinkProvider);

module.exports = router;