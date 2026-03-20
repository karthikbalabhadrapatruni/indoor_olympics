#!/bin/bash
set -e
echo "=== GameTracker Vercel Deploy ==="

TOKEN=""
SA_EMAIL=""
SHEET_ID=""
DRIVE_ID=""

# Read private key from service account JSON (must be in same dir)
PRIVATE_KEY=$(node -e "const k=require('./service-account.json').private_key; process.stdout.write(k)")

echo "1/4  Installing Vercel CLI..."
npm install -g vercel --quiet

echo "2/4  Deploying project..."
vercel deploy --prod --yes --token "$TOKEN" \
  --env GOOGLE_SERVICE_ACCOUNT_EMAIL="$SA_EMAIL" \
  --env "GOOGLE_PRIVATE_KEY=$PRIVATE_KEY" \
  --env SPREADSHEET_ID="$SHEET_ID" \
  --env DRIVE_FOLDER_ID="$DRIVE_ID"

echo ""
echo "=== Done! Your app is live. ==="
