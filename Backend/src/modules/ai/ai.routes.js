const express = require("express");
const router = express.Router();

const protect = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { aiLimiter } = require("../../middlewares/rateLimit.middleware");
const { chatSchema, historySchema } = require("./ai.validation");
const { chat, streamChat, history } = require("./ai.controller");

router.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "AI routes",
		useMethod: "POST for chat endpoints",
		endpoints: {
			chat: "POST /api/ai/chat",
			stream: "POST /api/ai/chat/stream",
			history: "GET /api/ai/history?projectId=<projectId>",
		},
	});
});

router.get("/chat", (req, res) => {
	res.status(200).json({
		success: false,
		message: "Use POST /api/ai/chat with { question, projectId }",
	});
});

router.get("/chat/stream", (req, res) => {
	res.status(200).json({
		success: false,
		message: "Use POST /api/ai/chat/stream with { question, projectId }",
	});
});

router.post("/chat", protect, aiLimiter, validate(chatSchema), chat);
router.post("/chat/stream", protect, aiLimiter, validate(chatSchema), streamChat);
router.get("/history", protect, validate(historySchema), history);

module.exports = router;
