const port = process.env.PORT || 5000;
const apiBase = process.env.API_BASE || `http://localhost:${port}`;

module.exports = {
  openapi: "3.0.0",
  info: {
    title: "AI Knowledge OS API",
    version: "1.0.0",
    description: "Basic API documentation",
  },
  servers: [{ url: apiBase }],
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Login",
        responses: {
          200: { description: "Login successful" },
        },
      },
    },
    "/api/projects": {
      get: {
        summary: "Get projects",
        responses: {
          200: { description: "Projects fetched" },
        },
      },
      post: {
        summary: "Create project",
        responses: {
          201: { description: "Project created" },
        },
      },
    },
  },
};
