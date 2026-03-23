const Note = require("../note/note.model");
const { generateEmbedding } = require("./embedding.service");
const mongoose = require("mongoose");
const logger = require("../../utils/logger");

const cosineSimilarity = (vecA, vecB) => {
  const dot = vecA.reduce((sum, val, i) => sum + val * (vecB[i] || 0), 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (normA * normB);
};

const getRelevantNotes = async (userId, question, projectId) => {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error("Valid projectId is required");
    error.statusCode = 400;
    throw error;
  }

  const questionEmbedding = await generateEmbedding(question);

  const query = {
    owner: userId,
    isDeleted: false,
    embedding: { $exists: true, $ne: [] },
  };

  query.project = projectId;

  const notes = await Note.find(query).select("_id content embedding createdAt").lean();

  if (!notes.length) {
    return {
      context: "",
      sources: [],
      empty: true,
    };
  }

  const scoredNotes = notes.map((note) => ({
    note,
    score: cosineSimilarity(questionEmbedding, note.embedding),
  }));

  scoredNotes.sort((a, b) => b.score - a.score);

  const topNotes = scoredNotes.slice(0, 3);
  return {
    context: topNotes.map((item) => item.note.content).join("\n\n"),
    sources: topNotes.map((item) => item.note._id),
    topNotes: topNotes.map((item) => ({ _id: item.note._id, content: item.note.content, createdAt: item.note.createdAt })),
    empty: false,
  };
};

const buildMessages = (history, context, question) => {
  const recent = history.slice(-5);

  const historyMessages = recent.flatMap((item) => ([
    { role: "user", content: item.question },
    { role: "assistant", content: item.answer },
  ]));

  return [
    {
      role: "system",
      content: "Answer using the provided notes context. If context is missing, say you are unsure.",
    },
    ...historyMessages,
    {
      role: "user",
      content: `Context:\n${context}\n\nQuestion:\n${question}`,
    },
  ];
};

const getGroqModelCandidates = () => {
  const fromList = String(process.env.GROQ_CHAT_MODELS || '').split(',').map((m) => m.trim()).filter(Boolean);
  const primary = process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile';
  const defaults = ['llama-3.3-70b-versatile', 'llama3-8b-8192'];
  return Array.from(new Set([primary, ...fromList, ...defaults]));
};

const extractAnswerText = (data) => {
  return data?.answer || data?.output || (data?.choices && (data.choices[0]?.message?.content || data.choices[0]?.text)) || '';
};

const tryGroqChat = async (messages) => {
  if (!process.env.GROQ_API_KEY) return null;

  const chatUrl = process.env.GROQ_CHAT_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const models = getGroqModelCandidates();
  let lastError = null;

  for (const model of models) {
    try {
      const payload = { model, messages, stream: false };
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        lastError = new Error(`Groq chat failed for model ${model}: ${res.status} ${body}`);
        logger.warn({ message: 'Groq model attempt failed', model, status: res.status, body });
        continue;
      }

      const data = await res.json().catch(() => ({}));
      const answer = extractAnswerText(data);
      if (!answer) {
        lastError = new Error(`Groq returned empty answer for model ${model}`);
        logger.warn({ message: 'Groq model returned empty answer', model });
        continue;
      }

      return {
        answer,
        usage: data.usage || (data.choices && data.choices[0]?.usage) || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model,
      };
    } catch (err) {
      lastError = err;
      logger.warn({ message: 'Groq model request threw error', model, error: err.message });
    }
  }

  if (lastError) {
    logger.warn({ message: 'All Groq model attempts failed', error: lastError.message });
  }

  return null;
};

exports.askAI = async (userId, question, projectId, history = []) => {
  const relevant = await getRelevantNotes(userId, question, projectId);

  if (relevant.empty) {
    return {
      answer: "No searchable notes were found for this project. Please create or save a note so the AI can use it as context.",
      sources: [],
    };
  }

  const messages = buildMessages(history, relevant.context, question);
  const groqResult = await tryGroqChat(messages);
  if (groqResult) {
    return {
      answer: groqResult.answer,
      sources: relevant.sources,
      usage: groqResult.usage,
      model: groqResult.model,
    };
  }

  // Local fallback: synthesize a safe, structured answer from the retrieved notes context
  try {
    const excerpts = relevant.topNotes.map((n) => {
      const excerpt = (n.content || '').replace(/\s+/g, ' ').trim().slice(0, 240);
      return { id: n._id, excerpt, createdAt: n.createdAt };
    });

    const summary = excerpts.map((e, i) => `Note ${i + 1}: ${e.excerpt}`).join('\n');
    const fallback = `Based on your notes:\n\n${summary}`;
    return {
      answer: fallback,
      sources: relevant.sources,
      meta: {
        fallback: true,
        summary: summary,
        mappedNotes: excerpts,
      },
    };
  } catch (localErr) {
    const error = new Error('No chat provider is configured and local fallback failed. Set GROQ_API_KEY to enable Groq chat.');
    error.statusCode = 500;
    throw error;
  }
};

exports.streamAI = async (userId, question, projectId, history = []) => {
  const relevant = await getRelevantNotes(userId, question, projectId);

  if (relevant.empty) {
    return {
      stream: null,
      sources: [],
      fallbackAnswer: 'No searchable notes were found for this project. Please create or save a note so the AI can use it as context.',
    };
  }

  const messages = buildMessages(history, relevant.context, question);
  const groqResult = await tryGroqChat(messages);
  if (groqResult && groqResult.answer) {
    async function* gen() {
      yield { choices: [{ delta: { content: groqResult.answer } }] };
    }
    return { stream: gen(), sources: relevant.sources, fallbackAnswer: null };
  }

  // Local fallback stream: yield a single summary chunk
  try {
    const summary = relevant.context.split('\n\n').slice(0, 5).map((s, i) => `Note ${i + 1}: ${s}`).join('\n');
    async function* gen() {
      yield { choices: [{ delta: { content: `Based on your notes:\n${summary}` } }] };
    }
    return { stream: gen(), sources: relevant.sources, fallbackAnswer: null };
  } catch (err) {
    return { stream: null, sources: relevant.sources, fallbackAnswer: 'No chat provider configured.' };
  }
};
