# AI Service

This app is a standalone Python AI service intended to be deployed as its own Vercel project from the `apps/ai` root directory.

Exposed routes:

- `POST /api/match-commentary`
- `POST /api/pre-game-win-probability`
- `POST /api/stats-chat`
- `POST /api/season-recap`
- `POST /api/rivalry-tracker`

Required env vars:

```bash
GEMINI_API_KEY=...
AI_INTERNAL_TOKEN=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
SPREADSHEET_ID=...
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_REASONING_MODEL=gemini-2.5-pro
```

The service expects:

- `X-AI-Internal-Token` header on incoming requests
- shared Google Sheets access to read/write game data and `ai_insights`
