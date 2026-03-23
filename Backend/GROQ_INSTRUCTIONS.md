Groq + Local/HuggingFace embedding integration notes

We use a flexible embedding + LLM approach:

- Transformers.js local model: embeddings (recommended default)
- HuggingFace: embeddings (optional remote fallback)
- Groq: chat / LLM (OpenAI-compatible)

Environment variables (Backend/.env):

- `GROQ_API_KEY` (required) — your Groq API key. Example: `gsk_...`
- `GROQ_CHAT_URL` (optional) — defaults to `https://api.groq.com/openai/v1/chat/completions`
- `GROQ_CHAT_MODEL` (optional) — current default `llama-3.3-70b-versatile`
- `EMBEDDING_PROVIDER` (optional) — set `transformers-js` to force local embeddings
- `EMBEDDING_USE_TRANSFORMERS` (optional) — `true` enables local embeddings
- `EMBEDDING_TRANSFORMERS_MODEL` (optional) — default `Xenova/all-MiniLM-L6-v2`
- `HUGGINGFACE_API_KEY` (required for HF embeddings) — set to your HF token
- `HUGGINGFACE_EMBEDDING_MODEL` (optional) — default `sentence-transformers/all-MiniLM-L6-v2`

Flow used by the code:

1) Create embedding locally via Transformers.js (`Xenova/all-MiniLM-L6-v2`) when enabled.
2) If local provider is disabled/unavailable, try HuggingFace router/inference endpoints.
3) Store vectors in MongoDB on notes and search them with cosine similarity in `rag.service.js`.
4) Build `Context:\n${topNotes}\n\nQuestion:\n${question}` and call Groq chat endpoint using OpenAI-compatible payload `{ model, messages }`.

Note: Groq provides chat/completions but does NOT provide embeddings. Embeddings must come from local Transformers.js, HuggingFace, or fallback embeddings.

If you need to test locally without HF, enable `EMBEDDING_LOCAL_FALLBACK=true` in `.env` (generates deterministic, low-quality embeddings). For production, configure `HUGGINGFACE_API_KEY`.

Router / inference endpoint note:
- HuggingFace now routes inference traffic through `router.huggingface.co` for many models. If you are using a hosted Inference Endpoint (a model deployment in your HF account), set `HUGGINGFACE_ROUTER_URL` to the full endpoint URL provided by Hugging Face (for example: `https://router.huggingface.co/api/embeddings` or a tenant-specific endpoint). The code will try several HF endpoint candidates but some accounts require a specific router URL. If you receive a 410 or 404 from HF, set `HUGGINGFACE_ROUTER_URL` to the endpoint URL shown in your Hugging Face console.

If you prefer to avoid remote embeddings during development, keep `EMBEDDING_LOCAL_FALLBACK=true` enabled so the app uses deterministic local embeddings instead.
