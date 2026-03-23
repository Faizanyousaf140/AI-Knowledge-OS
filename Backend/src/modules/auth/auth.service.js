const jwt = require("jsonwebtoken");
const User = require("./auth.model");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const APP_BASE_URL = process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:3000";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const buildMailer = () => {
  if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT || 587),
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const mailer = buildMailer();
  if (!mailer) return false;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return true;
};

const createRandomToken = () => crypto.randomBytes(24).toString("hex");

const issueTokensForUser = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

exports.issueTokensForUser = issueTokensForUser;

exports.sendVerificationEmail = async (user) => {
  const token = createRandomToken();
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  const verifyUrl = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: `Verify your account: ${verifyUrl}`,
    html: `<p>Verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`,
  });

  return { verifyUrl };
};

exports.verifyEmailToken = async (token) => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  return user;
};

exports.requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user) return { sent: true };

  const token = createRandomToken();
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`,
  });

  return { sent: true, resetUrl };
};

exports.resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return user;
};

exports.findOrCreateOAuthUser = async ({ provider, providerId, email, name, avatar, username, existingUserId }) => {
  if (!provider || !providerId) {
    throw new Error("Missing provider identity");
  }

  const providerPath = `oauthProviders.${provider}.id`;
  let user = await User.findOne({ [providerPath]: providerId });

  if (!user && existingUserId) {
    user = await User.findById(existingUserId);
  }

  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase() });
  }

  if (!user) {
    const fallbackPassword = crypto.randomBytes(24).toString("hex");
    user = await User.create({
      name: name || "User",
      email: (email || `${provider}_${providerId}@no-email.local`).toLowerCase(),
      password: fallbackPassword,
      emailVerified: Boolean(email),
    });
  }

  user.name = user.name || name || "User";
  if (email && !user.email) user.email = email.toLowerCase();
  if (email) user.emailVerified = true;

  if (!user.oauthProviders) user.oauthProviders = {};
  if (!user.oauthProviders[provider]) user.oauthProviders[provider] = {};

  user.oauthProviders[provider].id = providerId;
  if (provider === "github" && username) {
    user.oauthProviders[provider].username = username;
  }

  if (avatar && !user.avatar) {
    user.avatar = avatar;
  }

  await user.save();
  return user;
};

// REGISTER
exports.register = async (data) => {
  const email = String(data.email || "").toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const user = await User.create({
    ...data,
    email,
  });

  // best-effort email verification email (no hard failure when SMTP is missing)
  try {
    await exports.sendVerificationEmail(user);
  } catch (e) {
    // ignore in development
  }

  return user;
};

// LOGIN
exports.login = async (email, password) => {
  const user = await User.findOne({ email: String(email || "").toLowerCase() });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.password) {
    throw new Error("This account uses social login. Use OAuth sign in or set a password.");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const tokens = await issueTokensForUser(user);

  return {
    ...tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  };
};
