import {
  appendRow,
  getSheetsClient,
  readSheet,
  rowToScore,
  upsertStats,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "scores!A2:E");
    return json(rows.map(rowToScore));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const { game_id, scores } = await request.json();
    if (!game_id || !Array.isArray(scores) || scores.length === 0) {
      return error("game_id and scores[] required", 400);
    }

    const sheets = getSheetsClient();
    const sessionRows = await readSheet(sheets, "game_sessions!A2:C");
    const session = sessionRows.find((row) => row[0] === game_id);
    if (!session) {
      return error(`game_id '${game_id}' not found`, 404);
    }

    const gameTypeId = session[1];
    const maxScore = Math.max(...scores.map((entry) => Number(entry.score)));
    const written = [];

    for (const entry of scores) {
      const item = {
        score_id: crypto.randomUUID(),
        game_id,
        user_id: entry.user_id,
        score: Number(entry.score),
        is_winner: Number(entry.score) === maxScore,
      };

      await appendRow(sheets, "scores!A:E", [
        item.score_id,
        item.game_id,
        item.user_id,
        item.score,
        item.is_winner ? "TRUE" : "FALSE",
      ]);
      await upsertStats(sheets, entry.user_id, gameTypeId, item.score, item.is_winner ? 1 : 0);
      written.push(item);
    }

    globalThis.__gtCacheInvalidated = Date.now();
    return json({ written }, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
