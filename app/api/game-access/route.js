import { error, json } from "../../../lib/http";
import { requireSessionUser } from "../../../lib/server-auth";
import { findUserByEmail } from "../../../lib/user-service";
import { addPlayersToGame } from "../../../lib/game-service";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const actor = await findUserByEmail(sessionUser.email);
    if (!actor?.user) {
      return error("Complete onboarding first", 400);
    }

    const { game_id, user_ids } = await request.json();
    if (!game_id || !Array.isArray(user_ids) || user_ids.length === 0) {
      return error("game_id and user_ids required", 400);
    }

    const added = await addPlayersToGame({
      actorUserId: actor.user.user_id,
      gameId: game_id,
      userIds: user_ids,
    });

    globalThis.__gtCacheInvalidated = Date.now();
    return json({ added }, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message, err.message.includes("access") ? 403 : 500);
  }
}
