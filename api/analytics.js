// api/analytics.js
import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function readAll() {
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const { type, user_id } = req.query;

  try {
    const { users, gameTypes, sessions, scores, stats } = await readAll();

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

    if (!type || type === "rankings") {
      const ranked = users
        .map(u => ({ ...u, ...aggregateUser(u.user_id) }))
        .sort((a, b) => b.total_score - a.total_score)
        .map((u, i) => ({ ...u, rank: i + 1 }));
      return res.json(ranked);
    }

    if (type === "allrounders") {
      const result = users
        .map(u => ({ ...u, ...aggregateUser(u.user_id) }))
        .sort((a, b) => b.total_score - a.total_score)
        .map(u => ({ ...u, is_allrounder: u.game_types_played.length >= 2 }));
      return res.json(result);
    }

    if (type === "player") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const user = users.find(u => u.user_id === user_id);
      if (!user) return res.status(404).json({ error: "user not found" });

      const agg = aggregateUser(user_id);

      const history = scores
        .filter(s => s.user_id === user_id)
        .map(s => {
          const session = sessions.find(g => g.game_id === s.game_id);
          const gt = session ? gameTypes.find(g => g.game_type_id === session.game_type_id) : null;
          return { ...s, played_at: session?.played_at || null, game_type_name: gt?.name || null };
        })
        .sort((a, b) => (b.played_at || "").localeCompare(a.played_at || ""));

      const allRanked = users
        .map(u => ({ user_id: u.user_id, total_score: aggregateUser(u.user_id).total_score }))
        .sort((a, b) => b.total_score - a.total_score);
      const rank = allRanked.findIndex(r => r.user_id === user_id) + 1;

      return res.json({ ...user, ...agg, rank, history });
    }

    return res.status(400).json({ error: "Unknown type. Use: rankings | allrounders | player" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
