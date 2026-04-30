const mongoose = require("mongoose");
const app = require("./src/app");
const { startEmbeddingWorker } = require("./src/workers/embedding.worker");
const { queueEnabled } = require("./src/config/redis");

const PORT = process.env.PORT || 5000;

// 🔍 DEBUG: Check if Railway env is loading
console.log("MONGO_URI =", process.env.MONGO_URI);

// 🚨 Validate required env vars
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

for (const name of requiredEnvVars) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

// 🟢 MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    // Worker start (if enabled)
    if (queueEnabled) {
      startEmbeddingWorker();
      console.log("🚀 Embedding worker started");
    } else {
      console.log("⚠️ Embedding worker disabled");
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:");
    console.error(err);
  });
