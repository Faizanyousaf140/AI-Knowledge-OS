const Usage = require("./usage.model");

const getDateKey = () => new Date().toISOString().slice(0, 10);

exports.trackAIRequest = async (owner, project, usage = {}) => {
  await Usage.findOneAndUpdate(
    {
      owner,
      project: project || null,
      dateKey: getDateKey(),
    },
    {
      $inc: {
        aiRequestsCount: 1,
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
      },
    },
    { upsert: true, new: true }
  );
};

exports.trackEmbeddingCreated = async (owner, project) => {
  await Usage.findOneAndUpdate(
    {
      owner,
      project: project || null,
      dateKey: getDateKey(),
    },
    {
      $inc: {
        embeddingsCreated: 1,
      },
    },
    { upsert: true, new: true }
  );
};
