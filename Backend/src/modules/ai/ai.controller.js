const asyncHandler = require("../../utils/asyncHandler");
const aiService = require("./ai.service");

exports.chat = asyncHandler(async (req, res) => {
  const { question, projectId } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      message: "question is required",
    });
  }

  const result = await aiService.chat(req.user.id, question.trim(), projectId);

  const payload = {
    success: true,
    data: result.answer,
    sources: result.sources,
  };

  if (result.meta) payload.meta = result.meta;

  res.status(200).json(payload);
});

exports.history = asyncHandler(async (req, res) => {
  const history = await aiService.getHistory(req.user.id, req.query.projectId);

  res.status(200).json({
    success: true,
    data: history,
  });
});

exports.streamChat = async (req, res, next) => {
  try {
    const { question, projectId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const { stream, sources, fallbackAnswer } = await aiService.streamChat(
      req.user.id,
      question.trim(),
      projectId
    );

    if (!stream && fallbackAnswer) {
      await aiService.saveConversation(
        req.user.id,
        question.trim(),
        fallbackAnswer,
        sources,
        projectId
      );
      res.write(`data: ${JSON.stringify({ token: fallbackAnswer })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    let fullAnswer = "";

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content;
      if (!token) continue;
      fullAnswer += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    await aiService.saveConversation(
      req.user.id,
      question.trim(),
      fullAnswer,
      sources,
      projectId
    );

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    next(error);
  }
};
