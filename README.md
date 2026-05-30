# AI Knowledge OS

AI Knowledge OS is a full-stack platform for building personal/team knowledge workspaces with projects, notes, and AI-assisted Q&A.

It combines a **Next.js frontend** with an **Express + MongoDB backend**, including authentication, project/note management, retrieval-augmented AI chat, and admin usage views.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Authentication & OAuth](#authentication--oauth)
- [AI & Embeddings](#ai--embeddings)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Additional Docs](#additional-docs)

## Features

- Email/password authentication with JWT access + refresh tokens
- Email verification and password reset flows (SMTP-based)
- OAuth support for Google, GitHub, and Facebook
- User profile updates and linked social account management
- Project CRUD with per-project notes
- AI chat and streaming AI responses scoped to project context
- Embedding pipeline for note retrieval (RAG-style context injection)
- Admin capabilities:
  - List all projects
  - Regenerate project embeddings
  - View usage analytics
- API docs endpoint via Swagger UI (`/api/docs`)
- Security middleware: Helmet, CORS controls, rate limiting, input sanitization

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- Native fetch-based service layer

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Joi request validation
- BullMQ + Redis (optional queue worker for embeddings)
- Groq chat API + local/HuggingFace embedding options

## Project Structure

```text
AI-Knowledge-OS/
├── Frontend/                # Next.js app
│   ├── app/                 # Route pages (dashboard, projects, auth, admin, etc.)
│   ├── components/          # Shared UI components
│   ├── lib/                 # API client utilities
│   └── services/            # Frontend service modules
└── Backend/                 # Express API
    ├── src/
    │   ├── modules/         # Domain modules (auth, project, note, ai, admin)
    │   ├── middlewares/     # Auth, validation, rate limiting, sanitization, errors
    │   ├── workers/         # Background worker(s)
    │   ├── config/          # Redis + Swagger config
    │   └── utils/           # Logger and utility code
    └── server.js            # Backend entry point
```

## Architecture Overview

1. Frontend authenticates users and stores access/refresh tokens in local storage.
2. Frontend calls backend APIs under `/api/...`.
3. Backend validates requests, enforces auth/authorization, and persists data in MongoDB.
4. Notes are embedded and stored for semantic retrieval.
5. AI chat endpoints fetch relevant project notes and send context + question to Groq chat models.
6. Optional queue worker can process embeddings through Redis/BullMQ.

## Getting Started

### 1) Prerequisites

- Node.js 18+ (recommended modern LTS)
- npm
- MongoDB instance (local or cloud)
- (Optional) Redis instance for embedding queue

### 2) Clone and install

```bash
git clone https://github.com/Faizanyousaf140/AI-Knowledge-OS.git
cd AI-Knowledge-OS

cd Backend
npm install

cd ../Frontend
npm install
```

### 3) Configure environment

Create:

- `Backend/.env`
- (Optional) `Frontend/.env.local`

Use the variables listed in [Environment Variables](#environment-variables).

### 4) Run locally

Terminal 1 (Backend):

```bash
cd Backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd Frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Environment Variables

### Backend (core)

Required for startup/auth:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

General:

- `PORT` (default `5000`)
- `NODE_ENV`
- `API_BASE` (used by Swagger server URL)
- `FRONTEND_URL`
- `CORS_ORIGIN` (comma-separated allowed origins)

### Backend (auth + email)

- `APP_BASE_URL`
- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT` (default `587`)
- `EMAIL_SMTP_SECURE` (`true`/`false`)
- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASS`
- `EMAIL_FROM`

### Backend (OAuth)

GitHub:

- `OAUTH_GITHUB_CLIENT_ID`
- `OAUTH_GITHUB_CLIENT_SECRET`
- `OAUTH_GITHUB_CALLBACK_URL`

Facebook:

- `OAUTH_FACEBOOK_CLIENT_ID`
- `OAUTH_FACEBOOK_CLIENT_SECRET`
- `OAUTH_FACEBOOK_CALLBACK_URL`

Google:

- `OAUTH_GOOGLE_CLIENT_ID`
- `OAUTH_GOOGLE_CLIENT_SECRET`
- `OAUTH_GOOGLE_CALLBACK_URL`

### Backend (AI, embeddings, queue)

- `GROQ_API_KEY`
- `GROQ_CHAT_URL` (optional)
- `GROQ_CHAT_MODEL` (optional)
- `GROQ_CHAT_MODELS` (optional comma-separated)
- `EMBEDDING_PROVIDER`
- `EMBEDDING_USE_TRANSFORMERS`
- `EMBEDDING_TRANSFORMERS_MODEL`
- `HUGGINGFACE_API_KEY`
- `HUGGINGFACE_EMBEDDING_MODEL`
- `HUGGINGFACE_ROUTER_URL`
- `EMBEDDING_FALLBACK_URL`
- `EMBEDDING_LOCAL_FALLBACK`
- `EMBEDDING_LOCAL_DIM`
- `EMBEDDING_QUEUE_ENABLED` (`true` enables queue worker)
- `REDIS_URL`

### Frontend

- `NEXT_PUBLIC_API_BASE_URL` (or `NEXT_PUBLIC_API_URL`)

## Available Scripts

### Backend (`/Backend`)

- `npm run dev` — run API with nodemon
- `npm start` — run API with Node

### Frontend (`/Frontend`)

- `npm run dev` — start Next.js in development
- `npm run build` — create production build
- `npm run start` — run built app
- `npm run lint` — run lint command

## API Overview

Base: `/api`

Core route groups:

- `/api/auth` — authentication, profile, user admin actions
- `/api/auth/oauth` — OAuth provider start/callback
- `/api/projects` — project CRUD, stats, admin project operations
- `/api/projects/:projectId/notes` — note CRUD inside project
- `/api/ai` — AI chat, stream chat, history
- `/api/admin` — admin usage reporting
- `/api/docs` — Swagger UI

## Authentication & OAuth

- Supports register/login + refresh token flow
- Email verification and password reset endpoints are included
- OAuth providers: Google, GitHub, Facebook
- Social accounts can be unlinked from authenticated user settings

## AI & Embeddings

- Chat uses project notes as retrieval context
- Streaming and non-streaming chat endpoints are available
- Embeddings can be generated with:
  - Local Transformers.js (recommended default path)
  - HuggingFace embeddings
  - Optional deterministic local fallback for development
- Groq is used for chat completion (OpenAI-compatible API format)

## Deployment Notes

- Backend includes `vercel.json` and can be hosted on Node-compatible platforms (e.g., Railway/Vercel server runtime)
- Ensure all required environment variables are configured in your deployment environment
- Configure CORS (`CORS_ORIGIN` / `FRONTEND_URL`) to match deployed frontend domain(s)
- If using queue workers, provide Redis and enable `EMBEDDING_QUEUE_ENABLED=true`

## Troubleshooting

- **`Missing required environment variable` on backend start**  
  Ensure `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are set.

- **CORS blocked requests**  
  Verify frontend origin is included in `CORS_ORIGIN` or `FRONTEND_URL`.

- **OAuth callback errors**  
  Check provider callback URL config and exact environment variable values.

- **AI response issues**  
  Confirm `GROQ_API_KEY` and embedding-related variables are configured.

## Additional Docs

- `/Backend/OAUTH_EMAIL_SETUP.md` — detailed OAuth + email flow setup
- `/Backend/GROQ_INSTRUCTIONS.md` — Groq + embedding integration notes
