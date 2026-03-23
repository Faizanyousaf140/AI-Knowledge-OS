const asyncHandler = require("../../utils/asyncHandler");
const authService = require("./auth.service");
const jwt = require("jsonwebtoken");
const User = require("./auth.model");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  interests: user.interests || [],
  oauthProviders: user.oauthProviders || {},
});

// REGISTER
exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: sanitizeUser(user),
    message: "Account created. Please verify your email.",
  });
});

// LOGIN
exports.login = asyncHandler(async (req, res) => {
  const tokens = await authService.login(req.body.email, req.body.password);

  res.status(200).json({
    success: true,
    ...tokens,
  });
});

// GET CURRENT USER
exports.me = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({ success: true, data: sanitizeUser(user) });
});

// REFRESH
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token provided" });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(403).json({ success: false, message: "Invalid refresh token" });
  }

  const tokens = await authService.issueTokensForUser(user);

  res.status(200).json({
    success: true,
    ...tokens,
  });
});

// LOGOUT
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const user = await User.findOne({ refreshToken });

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// RESEND EMAIL VERIFICATION
exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (user && !user.emailVerified) {
    await authService.sendVerificationEmail(user);
  }

  return res.status(200).json({ success: true, message: "If the account exists, a verification email was sent." });
});

// VERIFY EMAIL
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: "Verification token is required" });
  }

  await authService.verifyEmailToken(token);
  return res.status(200).json({ success: true, message: "Email verified successfully" });
});

// FORGOT PASSWORD
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  await authService.requestPasswordReset(email);
  return res.status(200).json({ success: true, message: "If the account exists, a reset link was sent." });
});

// RESET PASSWORD
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token and password are required" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  await authService.resetPassword(token, password);
  return res.status(200).json({ success: true, message: "Password reset successful" });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("_id name email role createdAt emailVerified oauthProviders").sort({ createdAt: -1 }).lean();

  res.status(200).json({
    success: true,
    data: users,
  });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.role = role;
  await user.save();

  res.status(200).json({ success: true, data: { id: user._id, role: user.role } });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  await User.deleteOne({ _id: id });

  res.status(200).json({ success: true, message: "User deleted" });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { name, interests } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (typeof name === "string" && name.trim()) user.name = name.trim();
  if (Array.isArray(interests)) user.interests = interests.filter((x) => typeof x === "string");
  await user.save();

  res.status(200).json({ success: true, data: sanitizeUser(user) });
});

exports.unlinkProvider = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  const provider = String(req.params.provider || "").toLowerCase();
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!["google", "github", "facebook"].includes(provider)) {
    return res.status(400).json({ success: false, message: "Unsupported provider" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (user.oauthProviders && user.oauthProviders[provider]) {
    user.oauthProviders[provider].id = null;
    if (provider === "github") user.oauthProviders[provider].username = null;
  }

  const hasAnyProvider = ["google", "github", "facebook"].some((p) => user.oauthProviders && user.oauthProviders[p] && user.oauthProviders[p].id);
  if (!hasAnyProvider && !user.password) {
    return res.status(400).json({ success: false, message: "Cannot unlink last auth method without a password" });
  }

  await user.save();
  return res.status(200).json({ success: true, message: `${provider} unlinked`, data: sanitizeUser(user) });
});
