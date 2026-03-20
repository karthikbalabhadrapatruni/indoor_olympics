import {
  appendRow,
  getSheetsClient,
  readSheet,
  rowToGameSession,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_sessions!A2:C");
    return json(rows.map(rowToGameSession));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const { game_id, game_type_id } = await request.json();
    if (!game_id || !game_type_id) {
      return error("game_id and game_type_id required", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_sessions!A2:C");
    if (rows.some((row) => row[0] === game_id)) {
      return error("game_id already exists", 409);
    }

    const session = {
      game_id,
      game_type_id,
      played_at: new Date().toISOString(),
    };

    await appendRow(sheets, "game_sessions!A:C", [
      session.game_id,
      session.game_type_id,
      session.played_at,
    ]);

    globalThis.__gtCacheInvalidated = Date.now();
    return json(session, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
