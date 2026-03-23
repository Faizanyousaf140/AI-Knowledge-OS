const Chat = require("./chat.model");
const { askAI, streamAI } = require("./rag.service");
const usageService = require("../usage/usage.service");

const saveConversation = async (userId, question, answer, sources = [], projectId = null) => {
  await Chat.create({
    owner: userId,
    project: projectId || null,
    question,
    answer,
    sources,
  });
};

exports.chat = async (userId, question, projectId) => {
  const history = await Chat.find({ owner: userId, project: projectId })
    .select("question answer")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const result = await askAI(userId, question, projectId, history.reverse());

  await usageService.trackAIRequest(userId, projectId, {
    promptTokens: result.usage?.prompt_tokens || 0,
    completionTokens: result.usage?.completion_tokens || 0,
    totalTokens: result.usage?.total_tokens || 0,
  });

  await saveConversation(userId, question, result.answer, result.sources, projectId);
  return result;
};

exports.getHistory = async (userId, projectId) => {
  const query = { owner: userId };
  if (projectId) {
    query.project = projectId;
  }

  return Chat.find(query)
    .select("question answer sources project createdAt")
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
};

exports.streamChat = async (userId, question, projectId) => {
  const history = await Chat.find({ owner: userId, project: projectId })
    .select("question answer")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  await usageService.trackAIRequest(userId, projectId, {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  });

  return streamAI(userId, question, projectId, history.reverse());
};

exports.saveConversation = saveConversation;
