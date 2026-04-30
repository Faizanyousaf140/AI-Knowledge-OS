const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const app = require("../src/app");

let connectPromise;

async function ensureDatabaseConnection() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI");
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  await connectPromise;
}

module.exports = async (req, res) => {
  await ensureDatabaseConnection();
  return app(req, res);
};