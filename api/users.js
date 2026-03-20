import { getSheetsClient, readSheet, appendRow, updateRow, rowToUser, SPREADSHEET_ID } from "../lib/sheets.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  const sheets = getSheetsClient();
  try {
    if (req.method === "GET") {
      const rows = await readSheet(sheets, "users!A2:E");
      return res.json(rows.map(rowToUser));
    }
    if (req.method === "POST") {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: "username required" });
      const rows = await readSheet(sheets, "users!A2:E");
      if (rows.some(r => r[1] === username)) return res.status(409).json({ error: "username already taken" });
      const user_id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      await appendRow(sheets, "users!A:E", [user_id, username, created_at, "", ""]);
      return res.status(201).json({ user_id, username, created_at, photo_drive_id: "", photo_url: "" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
