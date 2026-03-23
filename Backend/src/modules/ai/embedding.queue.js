const { Queue } = require("bullmq");
const { getRedisConnection, queueEnabled } = require("../../config/redis");
const logger = require("../../utils/logger");

const EMBEDDING_QUEUE_NAME = "embedding-jobs";

let embeddingQueue;

const getEmbeddingQueue = () => {
  if (!queueEnabled) {
    return null;
  }

  if (!embeddingQueue) {
    const connection = getRedisConnection();
    if (!connection) {
      return null;
    }

    embeddingQueue = new Queue(EMBEDDING_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    });
  }

  return embeddingQueue;
};

const addEmbeddingJob = async ({ noteId, content }) => {
  const queue = getEmbeddingQueue();
  if (!queue) {
    logger.info({ message: "Embedding queue is disabled; skipping background job" });
    return false;
  }

  await queue.add("embed-note", { noteId, content });
  return true;
};

module.exports = {
  EMBEDDING_QUEUE_NAME,
  addEmbeddingJob,
};
