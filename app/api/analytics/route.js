import {
  buildAnalytics,
  buildPlayerAnalytics,
  readAllData,
} from "../../../lib/game-tracker-data";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "rankings";
  const userId = searchParams.get("user_id");

  try {
    const data = await readAllData();

    if (type === "rankings") {
      return json(buildAnalytics(data).rankings);
    }

    if (type === "allrounders") {
      return json(buildAnalytics(data).allrounders);
    }

    if (type === "player") {
      if (!userId) {
        return error("user_id required", 400);
      }

      const player = buildPlayerAnalytics(data, userId);
      if (!player) {
        return error("user not found", 404);
      }

      return json(player);
    }

    return error("Unknown type. Use: rankings | allrounders | player", 400);
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
