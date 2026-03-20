// api/game-sessions.js
import {
  getSheetsClient, readSheet, appendRow,
  rowToGameSession,
} from "../lib/sheets.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const sheets = getSheetsClient();

  try {
    if (req.method === "GET") {
      const rows = await readSheet(sheets, "game_sessions!A2:C");
      return res.json(rows.map(rowToGameSession));
    }

    if (req.method === "POST") {
      const { game_id, game_type_id } = req.body;
      if (!game_id || !game_type_id) {
        return res.status(400).json({ error: "game_id and game_type_id required" });
      }

      // uniqueness check
      const rows = await readSheet(sheets, "game_sessions!A2:C");
      if (rows.some((r) => r[0] === game_id)) {
        return res.status(409).json({ error: "game_id already exists" });
      }

      const played_at = new Date().toISOString();
      await appendRow(sheets, "game_sessions!A:C", [game_id, game_type_id, played_at]);
      return res.status(201).json({ game_id, game_type_id, played_at });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
