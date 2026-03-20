import { buildAnalytics, readAllData } from "../../../lib/game-tracker-data";
import { error, json } from "../../../lib/http";
import { requireSessionUser } from "../../../lib/server-auth";
import { findUserByEmail } from "../../../lib/user-service";

const cacheByUser = new Map();
const CACHE_TTL_MS = 30_000;

if (globalThis.__gtCacheInvalidated === undefined) {
  globalThis.__gtCacheInvalidated = 0;
}

export const runtime = "nodejs";

export async function GET() {
  const now = Date.now();
  const invalidatedAt = globalThis.__gtCacheInvalidated || 0;

  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }
    const cached = cacheByUser.get(sessionUser.email);
    if (cached && now - cached.at < CACHE_TTL_MS && cached.at > invalidatedAt) {
      return json(cached.data, { headers: { "X-Cache": "HIT" } });
    }

    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const data = await readAllData();
    const analytics = buildAnalytics(data);
    const accessibleIds = new Set(
      data.access.filter((entry) => entry.user_id === currentUser.user.user_id).map((entry) => entry.game_id)
    );
    const sessions = data.sessions
      .filter(
        (session) =>
          session.visibility !== "private" ||
          session.owner_user_id === currentUser.user.user_id ||
          accessibleIds.has(session.game_id)
      )
      .map((session) => ({
        ...session,
        can_manage:
          session.owner_user_id === currentUser.user.user_id || accessibleIds.has(session.game_id),
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
      }));
    const visibleGameIds = new Set(sessions.map((session) => session.game_id));
    const scores = data.scores.filter((score) => visibleGameIds.has(score.game_id));
    const me = analytics.rankings.find((item) => item.user_id === currentUser.user.user_id) || currentUser.user;

    const payload = {
      me,
      users: data.users,
      gameTypes: data.gameTypes,
      sessions,
      scores,
      rankings: analytics.rankings,
      allrounders: analytics.allrounders,
    };
    cacheByUser.set(sessionUser.email, { data: payload, at: now });
    return json(payload, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error(err);
    const sessionUser = await requireSessionUser().catch(() => null);
    const cached = sessionUser?.email ? cacheByUser.get(sessionUser.email) : null;
    if (cached) {
      return json(cached.data, { headers: { "X-Cache": "STALE" } });
    }
    return error(err.message);
  }
}
