# Deploy in 4 steps

This repo is now a standard Next.js app, so Vercel can deploy it directly without custom rewrites.

## Step 1 — Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2 — Install dependencies locally
```bash
cd gametracker
npm install
```

## Step 3 — Deploy the project
```bash
vercel deploy --prod --yes \
  --token <PAC-HERE>
```
This deploys the code. The app will load but show an error until env vars are set.

## Step 4 — Set environment variables on Vercel dashboard

Go to: https://vercel.com/dashboard → your `gametracker` project → Settings → Environment Variables

Add these 4 variables:

| Name | Value |
|------|-------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `gametracker-sa@game-tracker-490809.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | *(paste the full private key from your service account JSON — including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)* |
| `SPREADSHEET_ID` | `1SmaHLnzX5e5PWLNuGbdxrV5Aa8hPHHp9Ws055lvGvjQ` |
| `DRIVE_FOLDER_ID` | `1IGoIwzWJcoHHk1HhdEXZz8m_Rzr6550z` |

Then click **Redeploy** from the Deployments tab and the Next.js app will come up fully configured.

## Additional AI env vars

For the Gemini workflows, also add:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `AI_INTERNAL_TOKEN` | A long random shared secret for Node -> Python internal calls |
| `GEMINI_TEXT_MODEL` | `gemini-2.5-flash` |
| `GEMINI_REASONING_MODEL` | `gemini-2.5-pro` |

## Additional AI sheet tab

Add this tab too:

- **ai_insights**: `insight_id | type | scope_type | scope_id | game_id | user_id | period_key | content | model | created_at | metadata_json`

## Google Sheet setup reminder

Make sure your sheet has these tabs with row-1 headers:

- **users**: `user_id | username | created_at | photo_drive_id | photo_url`
- **game_types**: `game_type_id | name`
- **game_sessions**: `game_id | game_type_id | played_at`
- **scores**: `score_id | game_id | user_id | score | is_winner`
- **user_game_stats**: `id | user_id | game_type_id | total_score | total_games | total_wins`

Share the sheet with: `gametracker-sa@game-tracker-490809.iam.gserviceaccount.com` (Editor)
