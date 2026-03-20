# GameTracker

A Next.js app-router project for tracking players, sessions, scores, analytics, and profile photos with Google Sheets and Google Drive as the backend.

## Architecture

```text
app/
  page.js                     Home page UI
  globals.css                 Shared styling
  api/
    bootstrap/route.js        Batched dashboard bootstrap payload
    analytics/route.js        Rankings, all-rounders, player analytics
    users/route.js            Player create/list
    game-types/route.js       Game type create/list
    game-sessions/route.js    Session create/list
    scores/route.js           Score submission/list
    upload-photo/route.js     Google Drive photo upload
components/
  game-tracker-app.js         Main client-side dashboard app
lib/
  google.js                   Google auth/client helpers
  sheets.js                   Sheets CRUD helpers
  game-tracker-data.js        Shared analytics shaping
```

The app is designed to deploy directly to Vercel as a standard Next.js project.
Google Sheets is the database, and the app actively uses `users`, `game_types`, `game_sessions`, `scores`, and `user_game_stats`.

---

## Step 1 — Set up Google Sheets

1. Create a new Google Spreadsheet at https://sheets.google.com
2. Create these sheets (tabs) with these exact names and headers:

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

## Step 3 — Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   SPREADSHEET_ID=...
   DRIVE_FOLDER_ID=...
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Step 4 — Deploy to Vercel

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
3. Vercel auto-detects the project as Next.js.
4. Add Environment Variables (Settings → Environment Variables):

| Variable | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `gametracker-sa@your-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----\n...` (paste the full key, newlines as `\n`) |
| `SPREADSHEET_ID` | Your spreadsheet ID from step 1 |
| `DRIVE_FOLDER_ID` | Optional Drive folder for uploaded photos |

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

## Step 5 — Seed initial data

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
| GET | `/api/bootstrap` | Batched app payload for the dashboard |
| GET | `/api/analytics?type=rankings` | Player rankings by total score |
| GET | `/api/analytics?type=allrounders` | All-rounder classification |
| GET | `/api/analytics?type=player&user_id=X` | Full player profile + history |

---

## Notes

- `lib/google.js` replaces escaped `\\n` sequences in `GOOGLE_PRIVATE_KEY` at runtime.
- Uploaded photos are stored in Google Drive and their public thumbnail URL is written back into the `users` sheet.
- The bootstrap route uses a short in-memory cache to reduce repeated Sheets reads.
