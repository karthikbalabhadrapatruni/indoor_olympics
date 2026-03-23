# Shared Contracts

Workflow names shared between `apps/web` and `apps/ai`:

- `match-commentary`
- `pre-game-win-probability`
- `stats-chat`
- `season-recap`
- `rivalry-tracker`

Header contract:

- `X-AI-Internal-Token`

Web -> AI request shape:

- JSON body
- authenticated at the web layer
- trusted via shared internal token at the AI layer
