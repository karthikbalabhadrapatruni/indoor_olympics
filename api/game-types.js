// api/game-types.js
import {
  getSheetsClient, readSheet, appendRow, rowToGameType,
} from "../lib/sheets.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const sheets = getSheetsClient();

  try {
    if (req.method === "GET") {
      const rows = await readSheet(sheets, "game_types!A2:B");
      return res.json(rows.map(rowToGameType));
    }

    if (req.method === "POST") {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });

      const rows = await readSheet(sheets, "game_types!A2:B");
      if (rows.some((r) => r[1] === name)) {
        return res.status(409).json({ error: "game type already exists" });
      }

      const game_type_id = crypto.randomUUID();
      await appendRow(sheets, "game_types!A:B", [game_type_id, name]);
      return res.status(201).json({ game_type_id, name });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
