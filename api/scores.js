// api/scores.js
// POST body: { game_id, scores: [{ user_id, score }] }
// Automatically:
//   1. Determines winner (highest score)
//   2. Appends to scores sheet
//   3. Upserts user_game_stats per player
import {
  getSheetsClient, readSheet, appendRow, upsertStats,
  rowToScore,
} from "../lib/sheets.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const sheets = getSheetsClient();

  try {
    if (req.method === "GET") {
      const rows = await readSheet(sheets, "scores!A2:E");
      return res.json(rows.map(rowToScore));
    }

    if (req.method === "POST") {
      const { game_id, scores } = req.body;
      if (!game_id || !Array.isArray(scores) || scores.length === 0) {
        return res.status(400).json({ error: "game_id and scores[] required" });
      }

      // Resolve game session → game_type_id
      const sessionRows = await readSheet(sheets, "game_sessions!A2:C");
      const session = sessionRows.find((r) => r[0] === game_id);
      if (!session) {
        return res.status(404).json({ error: `game_id '${game_id}' not found` });
      }
      const game_type_id = session[1];

      const maxScore = Math.max(...scores.map((s) => Number(s.score)));

      const written = [];
      for (const entry of scores) {
        const score_id = crypto.randomUUID();
        const numScore = Number(entry.score);
        const is_winner = numScore === maxScore;

        await appendRow(sheets, "scores!A:E", [
          score_id,
          game_id,
          entry.user_id,
          numScore,
          is_winner ? "TRUE" : "FALSE",
        ]);

        await upsertStats(sheets, entry.user_id, game_type_id, numScore, is_winner ? 1 : 0);

        written.push({ score_id, game_id, user_id: entry.user_id, score: numScore, is_winner });
      }

      return res.status(201).json({ written });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
