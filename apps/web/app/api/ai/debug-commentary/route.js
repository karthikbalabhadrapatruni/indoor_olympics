import { error, json } from "../../../../lib/http";
import { requireSessionUser } from "../../../../lib/server-auth";
import { findUserByEmail } from "../../../../lib/user-service";
import { invokeInternalAiWorkflow } from "../../../../lib/ai/internal";
import { readAllData } from "../../../../lib/game-tracker-data";

export const runtime = "nodejs";

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

    const { game_id } = await request.json();
    if (!game_id) {
      return error("game_id required", 400);
    }

    const data = await readAllData();
    const session = data.sessions.find((entry) => entry.game_id === game_id);
    if (!session) {
      return error("game not found", 404);
    }

    const canView =
      session.visibility !== "private" ||
      session.owner_user_id === currentUser.user.user_id ||
      data.access.some((entry) => entry.game_id === game_id && entry.user_id === currentUser.user.user_id);

    if (!canView) {
      return error("you do not have access to this game", 403);
    }

    const latestRound = data.scores
      .filter((entry) => entry.game_id === game_id)
      .reduce((maxRound, entry) => Math.max(maxRound, entry.round_number || 0), 0);

    if (!latestRound) {
      return error("no rounds found for this game yet", 400);
    }

    const result = await invokeInternalAiWorkflow(request, "match-commentary", {
      game_id,
      round_number: latestRound,
      actor_user_id: currentUser.user.user_id,
      actor_email: sessionUser.email,
    });

    return json(result);
  } catch (err) {
    console.error("[ai-debug] commentary failed", err);
    return error(err.message);
  }
}
