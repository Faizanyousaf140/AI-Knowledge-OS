const { Worker } = require("bullmq");
const { getRedisConnection, queueEnabled } = require("../config/redis");
const logger = require("../utils/logger");
const Note = require("../modules/note/note.model");
const { generateEmbedding } = require("../modules/ai/embedding.service");
const { EMBEDDING_QUEUE_NAME } = require("../modules/ai/embedding.queue");
const usageService = require("../modules/usage/usage.service");

const startEmbeddingWorker = () => {
  if (!queueEnabled) {
    logger.info({ message: "Embedding worker is disabled by EMBEDDING_QUEUE_ENABLED" });
    return null;
  }

  const connection = getRedisConnection();
  if (!connection) {
    logger.info({ message: "Embedding worker not started because Redis is unavailable" });
    return null;
  }

  const worker = new Worker(
    EMBEDDING_QUEUE_NAME,
    async (job) => {
      const { noteId, content } = job.data;

      const note = await Note.findById(noteId);
      if (!note || note.isDeleted) {
        return;
      }

      if (note.embedding && note.embedding.length) {
        return;
      }

      const embedding = await generateEmbedding(content || note.content);
      note.embedding = embedding;
      await note.save();
      await usageService.trackEmbeddingCreated(note.owner, note.project);
    },
    { connection }
  );

  worker.on("completed", (job) => {
    logger.info({ message: "Embedding job completed", jobId: job.id });
  });

  worker.on("failed", (job, error) => {
    logger.error({
      message: "Embedding job failed",
      jobId: job?.id,
      error: error.message,
    });
  });

  return worker;
};

module.exports = { startEmbeddingWorker };
