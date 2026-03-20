import {
  buildAnalytics,
  buildPlayerAnalytics,
  readAllData,
} from "../../../lib/game-tracker-data";
import { error, json } from "../../../lib/http";
import { compareValues, paginateItems, parsePositiveInt, parseSortOrder } from "../../../lib/pagination";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "rankings";
  const userId = searchParams.get("user_id");
  const gameTypeId = searchParams.get("game_type_id");
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(searchParams.get("pageSize"), 10), 50);
  const sortOrder = parseSortOrder(searchParams.get("sortOrder"), "desc");
  const sortBy = searchParams.get("sortBy") || "total_score";

  try {
    const data = await readAllData();
    const analytics = buildAnalytics(
      gameTypeId
        ? {
            ...data,
            stats: data.stats.filter((stat) => stat.game_type_id === gameTypeId),
          }
        : data
    );

    if (type === "rankings") {
      const allowedSortFields = new Set(["username", "total_score", "win_pct", "total_wins", "total_games"]);
      const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "total_score";
      const sorted = [...analytics.rankings].sort((left, right) => {
        const primary = compareValues(left[safeSortBy], right[safeSortBy], sortOrder);
        if (primary !== 0) return primary;
        return compareValues(left.username, right.username, "asc");
      });
      const paged = paginateItems(sorted, page, pageSize);
      return json({
        items: paged.items,
        pagination: paged.pagination,
        sort: { sortBy: safeSortBy, sortOrder },
        game_type_id: gameTypeId || "all",
      });
    }

    if (type === "allrounders") {
      const sorted = [...analytics.allrounders].sort((left, right) => {
        const primary = compareValues(left.total_score, right.total_score, sortOrder);
        if (primary !== 0) return primary;
        return compareValues(left.username, right.username, "asc");
      });
      const paged = paginateItems(sorted, page, pageSize);
      return json({
        items: paged.items,
        pagination: paged.pagination,
        sort: { sortBy: "total_score", sortOrder },
      });
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
