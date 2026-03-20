# GameTracker — Olympic-style Analytics Platform

A full-stack game analytics tracker backed by **Google Sheets** as the database, deployed on **Vercel for free**.

---

## Architecture

```
Vercel (free tier)
├── public/index.html       ← Frontend (single HTML file, no build step)
└── api/
    ├── users.js            ← GET /api/users · POST /api/users
    ├── game-types.js       ← GET /api/game-types · POST /api/game-types
    ├── game-sessions.js    ← GET /api/game-sessions · POST /api/game-sessions
    ├── scores.js           ← GET /api/scores · POST /api/scores
    └── analytics.js        ← GET /api/analytics?type=rankings|allrounders|player
        
lib/sheets.js               ← Shared Google Sheets client + helpers
```

Google Sheets acts as the database with 6 sheets/tabs:
`users` · `game_types` · `game_sessions` · `game_participants` · `scores` · `user_game_stats`

---

## Step 1 — Set up Google Sheets

1. Create a new Google Spreadsheet at https://sheets.google.com
2. Create 6 sheets (tabs) with these exact names and headers:

**users** (row 1 headers):
```
user_id | username | created_at
```

**game_types** (row 1 headers):
```
game_type_id | name
```
Seed with your game types:
```
<uuid> | Rummy
<uuid> | Carroms
```

**game_sessions** (row 1 headers):
```
game_id | game_type_id | played_at
```

**game_participants** (row 1 headers):
```
id | game_id | user_id
```

**scores** (row 1 headers):
```
score_id | game_id | user_id | score | is_winner
```

**user_game_stats** (row 1 headers):
```
id | user_id | game_type_id | total_score | total_games | total_wins
```

3. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

---

## Step 2 — Create a Google Service Account

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable **Google Sheets API**:
   - APIs & Services → Enable APIs → search "Google Sheets API" → Enable
4. Create a Service Account:
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Give it any name (e.g. `gametracker-sa`)
   - Click the service account → Keys → Add Key → JSON
   - Download the JSON file
5. From the JSON file you need:
   - `client_email`  → this is `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key`   → this is `GOOGLE_PRIVATE_KEY`
6. **Share your spreadsheet** with the service account email (give it Editor access)

---

## Step 3 — Deploy to Vercel

### Option A: GitHub (recommended)

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/gametracker
   git push -u origin main
   ```
2. Go to https://vercel.com → New Project → Import your repo
3. Vercel auto-detects the project. No build config needed.
4. Add Environment Variables (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `gametracker-sa@your-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----\n...` (paste the full key, newlines as `\n`) |
| `SPREADSHEET_ID` | Your spreadsheet ID from step 1 |

5. Deploy → your app is live at `https://gametracker-xxx.vercel.app`

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, then add env vars:
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add SPREADSHEET_ID
vercel --prod
```

---

## Step 4 — Seed initial data

Use the **Add Player** page in the UI to register your players, or POST directly:

```bash
# Add players
curl -X POST https://your-app.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"Kashyap"}'

# Add game type (or seed directly in Sheets)
curl -X POST https://your-app.vercel.app/api/game-types \
  -H "Content-Type: application/json" \
  -d '{"name":"Rummy"}'

# Create a game session
curl -X POST https://your-app.vercel.app/api/game-sessions \
  -H "Content-Type: application/json" \
  -d '{"game_id":"G1","game_type_id":"<game_type_id_from_above>"}'

# Submit scores (auto-detects winner, updates aggregates)
curl -X POST https://your-app.vercel.app/api/scores \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "G1",
    "scores": [
      {"user_id":"<kashyap_id>","score":50},
      {"user_id":"<karthik_id>","score":30},
      {"user_id":"<anish_id>","score":20}
    ]
  }'
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all players |
| POST | `/api/users` | Create player `{username}` |
| GET | `/api/game-types` | List all game types |
| POST | `/api/game-types` | Create game type `{name}` |
| GET | `/api/game-sessions` | List all sessions |
| POST | `/api/game-sessions` | Create session `{game_id, game_type_id}` |
| GET | `/api/scores` | List all scores |
| POST | `/api/scores` | Submit scores `{game_id, scores:[{user_id,score}]}` — auto-detects winner, updates stats |
| GET | `/api/analytics?type=rankings` | Player rankings by total score |
| GET | `/api/analytics?type=allrounders` | All-rounder classification |
| GET | `/api/analytics?type=player&user_id=X` | Full player profile + history |

---

## Notes

- **Free tier limits**: Vercel Hobby = unlimited deployments, 100GB bandwidth/month. Google Sheets API = 300 reads/minute (plenty for this use case).
- **Private key formatting**: In Vercel's env var dashboard, paste the key with literal `\n` — Vercel handles the escaping. The `lib/sheets.js` replaces `\\n` → `\n` at runtime.
- **Concurrency**: Google Sheets has no row-level locking. For high-frequency concurrent writes, consider adding a Redis layer or upgrading to Firestore/Supabase. For a small group of friends, Sheets works perfectly.
