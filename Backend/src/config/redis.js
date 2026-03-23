const IORedis = require("ioredis");
const logger = require("../utils/logger");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const queueEnabled = process.env.EMBEDDING_QUEUE_ENABLED === "true";

let connection;

const getRedisConnection = () => {
  if (!queueEnabled) {
    return null;
  }

  if (!connection) {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    connection.on("error", (error) => {
      logger.error({ message: "Redis connection error", error: error.message });
    });
  }

  return connection;
};

module.exports = { getRedisConnection, queueEnabled };
