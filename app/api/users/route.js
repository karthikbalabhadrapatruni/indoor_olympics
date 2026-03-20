import { appendRow, getSheetsClient, readSheet, rowToUser } from "../../../lib/sheets";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "users!A2:E");
    return json(rows.map(rowToUser));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const { username } = await request.json();
    if (!username) {
      return error("username required", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "users!A2:E");
    if (rows.some((row) => row[1] === username)) {
      return error("username already taken", 409);
    }

    const user = {
      user_id: crypto.randomUUID(),
      username,
      created_at: new Date().toISOString(),
      photo_drive_id: "",
      photo_url: "",
    };

    await appendRow(sheets, "users!A:E", [
      user.user_id,
      user.username,
      user.created_at,
      user.photo_drive_id,
      user.photo_url,
    ]);

    globalThis.__gtCacheInvalidated = Date.now();
    return json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
