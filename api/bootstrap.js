// api/bootstrap.js
import { google } from "googleapis";

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 30_000;

if (globalThis.__gtCacheInvalidated === undefined) {
  globalThis.__gtCacheInvalidated = 0;
}

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

async function batchReadAllSheets() {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.SPREADSHEET_ID,
    ranges: [
      "users!A2:E",
      "game_types!A2:B",
      "game_sessions!A2:C",
      "scores!A2:E",
      "user_game_stats!A2:F",
    ],
  });

  const [uR, gtR, gsR, scR, stR] = res.data.valueRanges.map(vr => vr.values || []);

  return {
    users: uR.map(([user_id, username, created_at, photo_drive_id, photo_url]) => ({
      user_id, username, created_at,
      photo_drive_id: photo_drive_id || "",
      photo_url: photo_url || "",
    })),
    gameTypes: gtR.map(([game_type_id, name]) => ({ game_type_id, name })),
    sessions:  gsR.map(([game_id, game_type_id, played_at]) => ({ game_id, game_type_id, played_at })),
    scores:    scR.map(([score_id, game_id, user_id, score, is_winner]) => ({
      score_id, game_id, user_id, score: Number(score), is_winner: is_winner === "TRUE",
    })),
    stats: stR.map(([id, user_id, game_type_id, total_score, total_games, total_wins]) => ({
      id, user_id, game_type_id,
      total_score: Number(total_score),
      total_games: Number(total_games),
      total_wins:  Number(total_wins),
    })),
  };
}

function buildAnalytics({ users, gameTypes, stats }) {
  function aggregateUser(uid) {
    const userStats = stats.filter(s => s.user_id === uid);
    const total_score = userStats.reduce((a, s) => a + s.total_score, 0);
    const total_games = userStats.reduce((a, s) => a + s.total_games, 0);
    const total_wins  = userStats.reduce((a, s) => a + s.total_wins,  0);
    const win_pct = total_games > 0 ? Math.round((total_wins / total_games) * 100) : 0;
    const game_types_played = userStats
      .filter(s => s.total_games > 0)
      .map(s => {
        const gt = gameTypes.find(g => g.game_type_id === s.game_type_id);
        return { ...s, game_type_name: gt ? gt.name : s.game_type_id };
      });
    return { total_score, total_games, total_wins, win_pct, game_types_played };
  }

  const enriched = users.map(u => ({ ...u, ...aggregateUser(u.user_id) }));
  const rankings = [...enriched]
    .sort((a, b) => b.total_score - a.total_score)
    .map((u, i) => ({ ...u, rank: i + 1 }));
  const allrounders = [...enriched]
    .sort((a, b) => b.total_score - a.total_score)
    .map(u => ({ ...u, is_allrounder: u.game_types_played.length >= 2 }));

  return { rankings, allrounders };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const now = Date.now();
  const invalidatedAt = globalThis.__gtCacheInvalidated || 0;
  if (_cache && now - _cacheAt < CACHE_TTL_MS && _cacheAt > invalidatedAt) {
    res.setHeader("X-Cache", "HIT");
    return res.json(_cache);
  }

  try {
    const { users, gameTypes, sessions, scores, stats } = await batchReadAllSheets();
    const { rankings, allrounders } = buildAnalytics({ users, gameTypes, stats });

    _cache = { users, gameTypes, sessions, scores, rankings, allrounders };
    _cacheAt = now;

    res.setHeader("X-Cache", "MISS");
    return res.json(_cache);
  } catch (err) {
    console.error(err);
    if (_cache) {
      res.setHeader("X-Cache", "STALE");
      return res.json(_cache);
    }
    return res.status(500).json({ error: err.message });
  }
}
