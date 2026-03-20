import {
  appendRow,
  getSheetsClient,
  readSheet,
  updateRow,
  rowToGameType,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_types!A2:D");
    return json(rows.map(rowToGameType));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const { name, scoring_mode, description } = await request.json();
    if (!name) {
      return error("name required", 400);
    }
    if (scoring_mode && !["highest", "lowest"].includes(scoring_mode)) {
      return error("scoring_mode must be highest or lowest", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_types!A2:D");
    if (rows.some((row) => row[1] === name)) {
      return error("game type already exists", 409);
    }

    const gameType = {
      game_type_id: crypto.randomUUID(),
      name,
      scoring_mode: scoring_mode || "highest",
      description: description || "",
    };
    await appendRow(sheets, "game_types!A:D", [
      gameType.game_type_id,
      gameType.name,
      gameType.scoring_mode,
      gameType.description,
    ]);
    globalThis.__gtCacheInvalidated = Date.now();
    return json(gameType, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const { game_type_id, name, scoring_mode, description } = await request.json();
    if (!game_type_id) {
      return error("game_type_id required", 400);
    }
    if (scoring_mode && !["highest", "lowest"].includes(scoring_mode)) {
      return error("scoring_mode must be highest or lowest", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_types!A2:D");
    const index = rows.findIndex((row) => row[0] === game_type_id);
    if (index === -1) {
      return error("game type not found", 404);
    }

    const current = rows[index];
    const updated = [
      game_type_id,
      name || current[1],
      scoring_mode || current[2] || "highest",
      description ?? current[3] ?? "",
    ];

    await updateRow(sheets, `game_types!A${index + 2}:D${index + 2}`, updated);
    globalThis.__gtCacheInvalidated = Date.now();
    return json(rowToGameType(updated));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
