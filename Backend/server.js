const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const app = require("./src/app");
const { startEmbeddingWorker } = require("./src/workers/embedding.worker");
const { queueEnabled } = require("./src/config/redis");

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
for (const name of requiredEnvVars) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    if (queueEnabled) {
      startEmbeddingWorker();
      console.log("Embedding worker started");
    } else {
      console.log("Embedding worker disabled");
    }

    app.listen(PORT, () => {
      const url = `http://localhost:${PORT}`;
      // Print a clickable link for local development
      console.log(`Server running on port ${PORT}\nClick to open: \x1b[36m${url}\x1b[0m`);
    });
  })
  .catch((err) => console.log(err));