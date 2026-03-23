# Indoor Olympics Monorepo

This repository is now split into two deployable apps:

```text
apps/
  web/   Next.js app deployed to one Vercel project
  ai/    Python Gemini AI service deployed to a second Vercel project
```

Recommended deployment model:

- `apps/web`
  - Vercel project: web app
  - Framework: Next.js
- `apps/ai`
  - Vercel project: AI service
  - Framework: Other / Python

Shared integration:

- `apps/web` calls `apps/ai` using `AI_SERVICE_URL`
- both projects share the same `AI_INTERNAL_TOKEN`
- both projects can read the same Google Sheets backend

High-level env split:

**apps/web**
```bash
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
SPREADSHEET_ID=...
DRIVE_FOLDER_ID=...
AI_SERVICE_URL=https://your-ai-project.vercel.app
AI_INTERNAL_TOKEN=shared_secret
```

**apps/ai**
```bash
GEMINI_API_KEY=...
AI_INTERNAL_TOKEN=shared_secret
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
SPREADSHEET_ID=...
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_REASONING_MODEL=gemini-2.5-pro
```
