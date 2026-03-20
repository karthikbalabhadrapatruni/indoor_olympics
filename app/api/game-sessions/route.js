import {
  getSheetsClient,
  readSheet,
  rowToGameSession,
  safeReadSheet,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";
import { createGame } from "../../../lib/game-service";
import { requireSessionUser } from "../../../lib/server-auth";
import { findUserByEmail } from "../../../lib/user-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "game_sessions!A2:E");
    const accessRows = await safeReadSheet(sheets, "game_access!A2:E");
    const allowedIds = new Set(accessRows.filter((row) => row[2] === currentUser.user.user_id).map((row) => row[1]));
    return json(
      rows.map(rowToGameSession).map((session) => ({
        ...session,
        can_manage: session.owner_user_id === currentUser.user.user_id || allowedIds.has(session.game_id),
      }))
    );
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

    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const { game_type_id, title } = await request.json();
    if (!game_type_id || !title?.trim()) {
      return error("game_type_id and title required", 400);
    }

    const session = await createGame({
      ownerUserId: currentUser.user.user_id,
      gameTypeId: game_type_id,
      title: title.trim(),
    });

    globalThis.__gtCacheInvalidated = Date.now();
    return json(session, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
