// api/analytics.js
// GET /api/analytics?type=rankings
// GET /api/analytics?type=player&user_id=xxx
// GET /api/analytics?type=allrounders
import {
  getSheetsClient, readSheet,
  rowToUser, rowToGameType, rowToStats, rowToScore, rowToGameSession,
} from "../lib/sheets.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const sheets = getSheetsClient();
  const { type, user_id } = req.query;

  try {
    // Load all tables once
    const [userRows, typeRows, statsRows, scoreRows, sessionRows] = await Promise.all([
      readSheet(sheets, "users!A2:C"),
      readSheet(sheets, "game_types!A2:B"),
      readSheet(sheets, "user_game_stats!A2:F"),
      readSheet(sheets, "scores!A2:E"),
      readSheet(sheets, "game_sessions!A2:C"),
    ]);

    const users     = userRows.map(rowToUser);
    const gameTypes = typeRows.map(rowToGameType);
    const stats     = statsRows.map(rowToStats);
    const scores    = scoreRows.map(rowToScore);
    const sessions  = sessionRows.map(rowToGameSession);

    // ── helper: aggregate per user ──────────────────────────────────────────
    function aggregateUser(uid) {
      const userStats = stats.filter((s) => s.user_id === uid);
      const total_score = userStats.reduce((acc, s) => acc + s.total_score, 0);
      const total_games = userStats.reduce((acc, s) => acc + s.total_games, 0);
      const total_wins  = userStats.reduce((acc, s) => acc + s.total_wins,  0);
      const win_pct = total_games > 0 ? Math.round((total_wins / total_games) * 100) : 0;
      const game_types_played = userStats
        .filter((s) => s.total_games > 0)
        .map((s) => {
          const gt = gameTypes.find((g) => g.game_type_id === s.game_type_id);
          return { ...s, game_type_name: gt ? gt.name : s.game_type_id };
        });
      return { total_score, total_games, total_wins, win_pct, game_types_played };
    }

    // ── rankings ────────────────────────────────────────────────────────────
    if (!type || type === "rankings") {
      const ranked = users
        .map((u) => {
          const agg = aggregateUser(u.user_id);
          return { ...u, ...agg };
        })
        .sort((a, b) => b.total_score - a.total_score)
        .map((u, i) => ({ ...u, rank: i + 1 }));

      return res.json(ranked);
    }

    // ── all-rounders ────────────────────────────────────────────────────────
    if (type === "allrounders") {
      const result = users
        .map((u) => {
          const agg = aggregateUser(u.user_id);
          return { ...u, ...agg, is_allrounder: agg.game_types_played.length >= 2 };
        })
        .sort((a, b) => b.total_score - a.total_score);

      return res.json(result);
    }

    // ── individual player profile ───────────────────────────────────────────
    if (type === "player") {
      if (!user_id) return res.status(400).json({ error: "user_id required" });

      const user = users.find((u) => u.user_id === user_id);
      if (!user) return res.status(404).json({ error: "user not found" });

      const agg = aggregateUser(user_id);

      // game history (individual scores, enriched)
      const history = scores
        .filter((s) => s.user_id === user_id)
        .map((s) => {
          const session = sessions.find((g) => g.game_id === s.game_id);
          const gt = session
            ? gameTypes.find((g) => g.game_type_id === session.game_type_id)
            : null;
          return {
            ...s,
            played_at: session ? session.played_at : null,
            game_type_name: gt ? gt.name : null,
          };
        })
        .sort((a, b) => (b.played_at || "").localeCompare(a.played_at || ""));

      // overall rank
      const allRanked = users
        .map((u) => ({ user_id: u.user_id, total_score: aggregateUser(u.user_id).total_score }))
        .sort((a, b) => b.total_score - a.total_score);
      const rank = allRanked.findIndex((r) => r.user_id === user_id) + 1;

      return res.json({ ...user, ...agg, rank, history });
    }

    return res.status(400).json({ error: "Unknown type. Use: rankings | allrounders | player" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
