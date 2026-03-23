import { appendRow, getSheetsClient, readSheet, rowToUser } from "../../../lib/sheets";
import { error, json } from "../../../lib/http";
import { requireSessionUser } from "../../../lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "users!A2:H");
    return json(rows.map(rowToUser));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const { username } = await request.json();
    if (!username) {
      return error("username required", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "users!A2:H");
    if (rows.some((row) => row[1] === username)) {
      return error("username already taken", 409);
    }

    const user = {
      user_id: crypto.randomUUID(),
      username,
      created_at: new Date().toISOString(),
      photo_drive_id: "",
      photo_url: "",
      email: "",
      google_name: "",
      avatar_url: "",
    };

    await appendRow(sheets, "users!A:H", [
      user.user_id,
      user.username,
      user.created_at,
      user.photo_drive_id,
      user.photo_url,
      user.email,
      user.google_name,
      user.avatar_url,
    ]);

    globalThis.__gtCacheInvalidated = Date.now();
    return json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
