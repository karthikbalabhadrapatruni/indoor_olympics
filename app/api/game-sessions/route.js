import { error, json } from "../../../lib/http";
import { createGame, endGame } from "../../../lib/game-service";
import { requireSessionUser } from "../../../lib/server-auth";
import { findUserByEmail } from "../../../lib/user-service";
import { readAllData } from "../../../lib/game-tracker-data";
import { compareValues, paginateItems, parsePositiveInt, parseSortOrder } from "../../../lib/pagination";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams?.get("page"), 1);
    const pageSize = Math.min(parsePositiveInt(searchParams?.get("pageSize"), 8), 24);
    const sortOrder = parseSortOrder(searchParams?.get("sortOrder"), "desc");
    const sortBy = searchParams?.get("sortBy") || "played_at";
    const gameTypeName = searchParams?.get("gameType") || "all";

    const data = await readAllData();
    const allowedIds = new Set(
      data.access.filter((entry) => entry.user_id === currentUser.user.user_id).map((entry) => entry.game_id)
    );

    const allowedSortFields = new Set(["played_at", "title", "game_id"]);
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "played_at";

    const enriched = data.sessions
      .filter((session) => {
        if (
          session.visibility === "private" &&
          session.owner_user_id !== currentUser.user.user_id &&
          !allowedIds.has(session.game_id)
        ) {
          return false;
        }
        if (gameTypeName === "all") return true;
        const gameType = data.gameTypes.find((entry) => entry.game_type_id === session.game_type_id);
        return gameType?.name === gameTypeName;
      })
      .map((session) => ({
        ...session,
        can_manage: session.owner_user_id === currentUser.user.user_id || allowedIds.has(session.game_id),
        members: data.access
          .filter((entry) => entry.game_id === session.game_id)
          .map((entry) => {
            const user = data.users.find((item) => item.user_id === entry.user_id);
            return {
              ...entry,
              username: user?.username || entry.user_id,
              photo_url: user?.photo_url || user?.avatar_url || "",
            };
          }),
        recent_scores: data.scores
          .filter((entry) => entry.game_id === session.game_id)
          .sort((left, right) => {
            if ((right.round_number || 1) !== (left.round_number || 1)) {
              return (right.round_number || 1) - (left.round_number || 1);
            }
            return right.score - left.score;
          })
          .map((entry) => {
            const user = data.users.find((item) => item.user_id === entry.user_id);
            return {
              ...entry,
              username: user?.username || entry.user_id,
              photo_url: user?.photo_url || user?.avatar_url || "",
            };
          }),
      }))
      .map((session) => {
        const gameType = data.gameTypes.find((entry) => entry.game_type_id === session.game_type_id);
        const scoringMode = gameType?.scoring_mode || "highest";
        const roundCount = session.recent_scores.reduce(
          (maxRound, entry) => Math.max(maxRound, entry.round_number || 0),
          0
        );
        const memberIds = new Set(session.members.map((member) => member.user_id));
        for (const score of session.recent_scores) {
          memberIds.add(score.user_id);
        }

        const sessionLeaderboard = [...memberIds]
          .map((userId) => {
            const user = data.users.find((item) => item.user_id === userId);
            const scores = session.recent_scores.filter((entry) => entry.user_id === userId);
            return {
              user_id: userId,
              username: user?.username || userId,
              photo_url: user?.photo_url || user?.avatar_url || "",
              total_score: scores.reduce((sum, entry) => sum + Number(entry.score || 0), 0),
              rounds_won: scores.filter((entry) => entry.is_winner).length,
              rounds_played: scores.length,
            };
          })
          .sort((left, right) => {
            const scoreCompare =
              scoringMode === "lowest"
                ? left.total_score - right.total_score
                : right.total_score - left.total_score;
            if (scoreCompare !== 0) return scoreCompare;
            if (right.rounds_won !== left.rounds_won) return right.rounds_won - left.rounds_won;
            return left.username.localeCompare(right.username);
          });

        return {
          ...session,
          round_count: roundCount,
          session_leaderboard: sessionLeaderboard,
        };
      })
      .sort((left, right) => {
        const primary = compareValues(left[safeSortBy], right[safeSortBy], sortOrder);
        if (primary !== 0) return primary;
        return compareValues(left.title, right.title, "asc");
      });

    const paged = paginateItems(enriched, page, pageSize);
    return json({
      items: paged.items,
      pagination: paged.pagination,
      sort: { sortBy: safeSortBy, sortOrder },
    });
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

    const { game_type_id, title, visibility } = await request.json();
    if (!game_type_id || !title?.trim()) {
      return error("game_type_id and title required", 400);
    }
    if (visibility && !["public", "private"].includes(visibility)) {
      return error("visibility must be public or private", 400);
    }

    const session = await createGame({
      ownerUserId: currentUser.user.user_id,
      gameTypeId: game_type_id,
      title: title.trim(),
      visibility: visibility || "public",
    });

    globalThis.__gtCacheInvalidated = Date.now();
    return json(session, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const { game_id, action } = await request.json();
    if (!game_id || action !== "end") {
      return error("game_id and action=end required", 400);
    }

    const session = await endGame({
      actorUserId: currentUser.user.user_id,
      gameId: game_id,
    });

    globalThis.__gtCacheInvalidated = Date.now();
    return json(session);
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
