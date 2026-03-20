# Deploy in 3 steps (< 5 minutes)

## Step 1 — Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2 — Deploy the project
```bash
cd gametracker
vercel deploy --prod --yes \
  --token <PAC-HERE>
```
This deploys the code. The app will load but show an error until env vars are set.

## Step 3 — Set environment variables on Vercel dashboard

Go to: https://vercel.com/dashboard → your `gametracker` project → Settings → Environment Variables

Add these 4 variables:

| Name | Value |
|------|-------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `gametracker-sa@game-tracker-490809.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | *(paste the full private key from your service account JSON — including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)* |
| `SPREADSHEET_ID` | `1SmaHLnzX5e5PWLNuGbdxrV5Aa8hPHHp9Ws055lvGvjQ` |
| `DRIVE_FOLDER_ID` | `1IGoIwzWJcoHHk1HhdEXZz8m_Rzr6550z` |

Then click **Redeploy** (from the Deployments tab) → your app is fully live!

## Google Sheet setup reminder

Make sure your sheet has these 6 tabs with row-1 headers:

- **users**: `user_id | username | created_at | photo_drive_id | photo_url`
- **game_types**: `game_type_id | name`
- **game_sessions**: `game_id | game_type_id | played_at`
- **game_participants**: `id | game_id | user_id`
- **scores**: `score_id | game_id | user_id | score | is_winner`
- **user_game_stats**: `id | user_id | game_type_id | total_score | total_games | total_wins`

Share the sheet with: `gametracker-sa@game-tracker-490809.iam.gserviceaccount.com` (Editor)
