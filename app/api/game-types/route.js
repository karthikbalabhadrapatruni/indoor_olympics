import {
  appendRow,
  getSheetsClient,
  readSheet,
  rowToGameType,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_types!A2:B");
    return json(rows.map(rowToGameType));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return error("name required", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_types!A2:B");
    if (rows.some((row) => row[1] === name)) {
      return error("game type already exists", 409);
    }

    const gameType = { game_type_id: crypto.randomUUID(), name };
    await appendRow(sheets, "game_types!A:B", [gameType.game_type_id, gameType.name]);
    globalThis.__gtCacheInvalidated = Date.now();
    return json(gameType, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
