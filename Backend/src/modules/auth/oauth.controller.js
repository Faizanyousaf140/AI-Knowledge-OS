const asyncHandler = require("../../utils/asyncHandler");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const authService = require("./auth.service");

const API_BASE = process.env.API_BASE || "http://localhost:5000";
const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";

const providerConfig = {
  github: {
    clientIdEnv: "OAUTH_GITHUB_CLIENT_ID",
    clientSecretEnv: "OAUTH_GITHUB_CLIENT_SECRET",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
  },
  facebook: {
    clientIdEnv: "OAUTH_FACEBOOK_CLIENT_ID",
    clientSecretEnv: "OAUTH_FACEBOOK_CLIENT_SECRET",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scope: "email,public_profile",
  },
  google: {
    clientIdEnv: "OAUTH_GOOGLE_CLIENT_ID",
    clientSecretEnv: "OAUTH_GOOGLE_CLIENT_SECRET",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid profile email",
  },
};

const getCallbackUrl = (provider) => {
  const envKey = `OAUTH_${provider.toUpperCase()}_CALLBACK_URL`;
  return process.env[envKey] || `${API_BASE}/api/auth/oauth/${provider}/callback`;
};

const makeState = ({ provider, mode = "login", existingUserId = null }) => {
  return jwt.sign(
    {
      provider,
      mode,
      existingUserId,
      nonce: Math.random().toString(36).slice(2),
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const parseState = (state) => {
  try {
    return jwt.verify(String(state || ""), process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
};

const issueFrontendRedirect = async (res, user, mode = "login") => {
  const { accessToken, refreshToken } = await authService.issueTokensForUser(user);
  const redirectUrl = `${FRONTEND_BASE}/auth/success?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&mode=${encodeURIComponent(mode)}`;
  return res.redirect(302, redirectUrl);
};

exports.startOAuth = asyncHandler(async (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  const config = providerConfig[provider];
  if (!config) {
    return res.status(400).json({ success: false, message: "Unsupported OAuth provider" });
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return res.status(501).json({ success: false, message: `OAuth for ${provider} is not configured. Set ${config.clientIdEnv} in .env.` });
  }

  const callbackUrl = getCallbackUrl(provider);
  const link = req.query.link === "true";
  let existingUserId = null;
  if (link) {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        existingUserId = decoded.id;
      } catch (e) {
        return res.status(401).json({ success: false, message: "Invalid token for account linking" });
      }
    } else {
      return res.status(401).json({ success: false, message: "Login required to link provider" });
    }
  }

  const state = makeState({ provider, mode: link ? "link" : "login", existingUserId });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: config.scope,
    state,
  });

  if (provider === "google") {
    params.set("response_type", "code");
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  const redirectUrl = `${config.authUrl}?${params.toString()}`;
  return res.json({ success: true, redirectUrl });
});

const exchangeGithubCode = async (code, callbackUrl) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth is missing client ID/secret");

  const tokenRes = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenRes.data && tokenRes.data.access_token;
  if (!accessToken) throw new Error("GitHub token exchange failed");

  const userRes = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  let email = userRes.data.email;
  if (!email) {
    const emailsRes = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const primary = Array.isArray(emailsRes.data) ? emailsRes.data.find((e) => e.primary) || emailsRes.data[0] : null;
    email = primary ? primary.email : null;
  }

  return {
    providerId: String(userRes.data.id),
    email,
    name: userRes.data.name || userRes.data.login,
    avatar: userRes.data.avatar_url,
    username: userRes.data.login,
  };
};

const exchangeFacebookCode = async (code, callbackUrl) => {
  const clientId = process.env.OAUTH_FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.OAUTH_FACEBOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Facebook OAuth is missing client ID/secret");

  const tokenRes = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      code,
    },
  });

  const accessToken = tokenRes.data && tokenRes.data.access_token;
  if (!accessToken) throw new Error("Facebook token exchange failed");

  const userRes = await axios.get("https://graph.facebook.com/me", {
    params: {
      fields: "id,name,email,picture",
      access_token: accessToken,
    },
  });

  return {
    providerId: String(userRes.data.id),
    email: userRes.data.email || null,
    name: userRes.data.name,
    avatar: userRes.data.picture && userRes.data.picture.data ? userRes.data.picture.data.url : null,
  };
};

const exchangeGoogleCode = async (code, callbackUrl) => {
  const clientId = process.env.OAUTH_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is missing client ID/secret");

  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const accessToken = tokenRes.data && tokenRes.data.access_token;
  if (!accessToken) throw new Error("Google token exchange failed");

  const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    providerId: String(userRes.data.id),
    email: userRes.data.email || null,
    name: userRes.data.name,
    avatar: userRes.data.picture || null,
  };
};

exports.handleCallback = asyncHandler(async (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  const code = req.query.code;
  const state = req.query.state;

  const parsedState = parseState(state);
  if (!parsedState || parsedState.provider !== provider) {
    return res.status(400).json({ success: false, message: "Invalid OAuth state" });
  }

  if (!code) {
    return res.status(400).json({ success: false, message: "Missing authorization code" });
  }

  const callbackUrl = getCallbackUrl(provider);
  let profile;

  if (provider === "github") {
    profile = await exchangeGithubCode(code, callbackUrl);
  } else if (provider === "facebook") {
    profile = await exchangeFacebookCode(code, callbackUrl);
  } else if (provider === "google") {
    profile = await exchangeGoogleCode(code, callbackUrl);
  } else {
    return res.status(400).json({ success: false, message: "Unsupported OAuth provider" });
  }

  const existingUserId = parsedState.mode === "link" ? parsedState.existingUserId : null;

  const user = await authService.findOrCreateOAuthUser({
    provider,
    providerId: profile.providerId,
    email: profile.email,
    name: profile.name,
    avatar: profile.avatar,
    username: profile.username,
    existingUserId,
  });

  return issueFrontendRedirect(res, user, parsedState.mode || "login");
});
