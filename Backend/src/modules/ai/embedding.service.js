const logger = require("../../utils/logger");
const crypto = require('crypto');

let localEmbedder = null;

const normalizeText = (text) => String(text || "").trim();

const parseEmbeddingVector = (data) => {
  if (!data) return null;

  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data;
  }

  if (Array.isArray(data.embedding)) {
    return data.embedding;
  }

  if (Array.isArray(data.data) && data.data[0] && Array.isArray(data.data[0].embedding)) {
    return data.data[0].embedding;
  }

  if (Array.isArray(data[0]) && typeof data[0][0] === 'number') {
    return data[0];
  }

  if (Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0])) {
    return data.embeddings[0];
  }

  return null;
};

const generateLocalTransformersEmbedding = async (text) => {
  const model = process.env.EMBEDDING_TRANSFORMERS_MODEL || 'Xenova/all-MiniLM-L6-v2';

  if (!localEmbedder) {
    const mod = await import('@xenova/transformers');
    localEmbedder = await mod.pipeline('feature-extraction', model);
    logger.info({ message: 'Transformers.js embedder loaded', model });
  }

  const result = await localEmbedder(text, {
    pooling: 'mean',
    normalize: true,
  });

  if (result && result.data) {
    return Array.from(result.data);
  }

  if (Array.isArray(result)) {
    const vec = parseEmbeddingVector(result);
    if (vec) return vec;
  }

  if (result && typeof result.tolist === 'function') {
    const list = result.tolist();
    const vec = parseEmbeddingVector(list);
    if (vec) return vec;
  }

  throw new Error('Transformers.js returned an unsupported embedding shape');
};

// Embedding provider order:
// 1) Local Transformers.js (when EMBEDDING_PROVIDER=transformers-js or EMBEDDING_USE_TRANSFORMERS=true)
// 2) HuggingFace API (when HUGGINGFACE_API_KEY is set)
// 3) Custom fallback URL
// 4) Local deterministic fallback (developer fallback only)
exports.generateEmbedding = async (text) => {
  const input = normalizeText(text);
  const provider = String(process.env.EMBEDDING_PROVIDER || '').toLowerCase();

  // 1) Local Transformers.js provider
  if (provider === 'transformers-js' || process.env.EMBEDDING_USE_TRANSFORMERS === 'true') {
    try {
      const vector = await generateLocalTransformersEmbedding(input);
      if (Array.isArray(vector) && vector.length) return vector;
    } catch (localModelErr) {
      logger.warn({ message: 'Transformers.js embedding failed', error: localModelErr.message });
    }
  }

  // 1) HuggingFace embeddings (primary)
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const model = process.env.HUGGINGFACE_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
      // Use HuggingFace Router endpoint (newer routing API)
      // Try multiple candidate HuggingFace endpoints (router, models endpoint, legacy embeddings endpoints)
      const candidates = [
        { url: process.env.HUGGINGFACE_ROUTER_URL || 'https://router.huggingface.co/api/embeddings', body: { model, input: text } },
        { url: `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, body: { inputs: text } },
        { url: `https://api-inference.huggingface.co/embeddings/${encodeURIComponent(model)}`, body: { inputs: text } },
        { url: `https://api-inference.huggingface.co/embeddings`, body: { model, input: text } },
      ];

      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate.url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(candidate.body),
          });

          if (!res.ok) {
            const bodyText = await res.text().catch(() => '');
            logger.warn({ message: 'HuggingFace embedding request failed', status: res.status, body: bodyText, url: candidate.url });
            continue;
          }

          const data = await res.json().catch(() => null);
          if (!data) {
            logger.warn({ message: 'HuggingFace returned empty embedding response', url: candidate.url });
            continue;
          }

          const vector = parseEmbeddingVector(data);
          if (vector) return vector;

          logger.warn({ message: 'Unexpected HuggingFace embedding response shape', data, url: candidate.url });
        } catch (innerErr) {
          logger.warn({ message: 'HuggingFace candidate request failed', error: innerErr.message, url: candidate.url });
        }
      }
    } catch (hfErr) {
      logger.warn({ message: 'HuggingFace embedding failed', error: hfErr.message });
    }
  }

  // 2) Custom fallback endpoint
  if (process.env.EMBEDDING_FALLBACK_URL) {
    try {
      const res = await fetch(process.env.EMBEDDING_FALLBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.embedding)) return data.embedding;
      } else {
        const body = await res.text().catch(() => "");
        logger.warn({ message: `Fallback embedding URL failed: ${res.status} ${body}` });
      }
    } catch (fbErr) {
      logger.warn({ message: "Embedding fallback URL failed", error: fbErr.message });
    }
  }

  // 3) Local deterministic fallback (developer only)
  if (process.env.EMBEDDING_LOCAL_FALLBACK === 'true') {
    try {
      const dim = parseInt(process.env.EMBEDDING_LOCAL_DIM || '512', 10);
      const embedding = [];
      let hash = crypto.createHash('sha256').update(text).digest();
      while (embedding.length < dim) {
        hash = crypto.createHash('sha256').update(hash).digest();
        for (let i = 0; i < hash.length && embedding.length < dim; i += 4) {
          const v = hash.readUInt32BE(i);
          const f = (v / 0xffffffff) * 2 - 1; // normalize to [-1,1]
          embedding.push(f);
        }
      }
      return embedding.slice(0, dim);
    } catch (localErr) {
      logger.warn({ message: 'Local embedding fallback failed', error: localErr.message });
    }
  }

  const error = new Error("No embedding provider succeeded. Configure EMBEDDING_PROVIDER=transformers-js (and install @xenova/transformers), or HUGGINGFACE_API_KEY, or EMBEDDING_FALLBACK_URL, or enable EMBEDDING_LOCAL_FALLBACK=true");
  error.statusCode = 500;
  throw error;
};
