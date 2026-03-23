OAuth + Email Auth Setup

This backend now supports:

- OAuth login: GitHub, Facebook, Google
- Email/password login
- Email verification
- Forgot/reset password
- Link/unlink social providers from Settings

Required env vars

- API_BASE=http://localhost:5000
- FRONTEND_URL=http://localhost:3000
- APP_BASE_URL=http://localhost:3000

GitHub

- OAUTH_GITHUB_CLIENT_ID=
- OAUTH_GITHUB_CLIENT_SECRET=
- OAUTH_GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/oauth/github/callback

Facebook

- OAUTH_FACEBOOK_CLIENT_ID=
- OAUTH_FACEBOOK_CLIENT_SECRET=
- OAUTH_FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/oauth/facebook/callback

Google

- OAUTH_GOOGLE_CLIENT_ID=
- OAUTH_GOOGLE_CLIENT_SECRET=
- OAUTH_GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/oauth/google/callback

Email SMTP (for verify/reset)

- EMAIL_SMTP_HOST=
- EMAIL_SMTP_PORT=587
- EMAIL_SMTP_SECURE=false
- EMAIL_SMTP_USER=
- EMAIL_SMTP_PASS=
- EMAIL_FROM=

Routes

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/verify-email?token=...
- POST /api/auth/resend-verification
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

OAuth

- GET /api/auth/oauth/:provider
- GET /api/auth/oauth/:provider/callback
- DELETE /api/auth/oauth/:provider (authenticated unlink)

Frontend pages added

- /auth/success
- /verify-email
- /forgot-password
- /reset-password
- /settings (link/unlink social accounts)

Run

1. Fill all env variables in Backend/.env.
2. Start backend:
   - npm run dev
3. Start frontend:
   - cd ../Frontend
   - npm run dev
4. Test OAuth from /login social buttons.
5. Test linking from /settings.
6. Test email verify/reset flows (SMTP required).
