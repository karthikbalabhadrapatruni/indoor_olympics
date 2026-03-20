import { buildAnalytics, readAllData } from "../../../lib/game-tracker-data";
import { error, json } from "../../../lib/http";

let cache = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

if (globalThis.__gtCacheInvalidated === undefined) {
  globalThis.__gtCacheInvalidated = 0;
}

export const runtime = "nodejs";

export async function GET() {
  const now = Date.now();
  const invalidatedAt = globalThis.__gtCacheInvalidated || 0;

  if (cache && now - cacheAt < CACHE_TTL_MS && cacheAt > invalidatedAt) {
    return json(cache, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const data = await readAllData();
    const analytics = buildAnalytics(data);
    cache = {
      users: data.users,
      gameTypes: data.gameTypes,
      sessions: data.sessions,
      scores: data.scores,
      rankings: analytics.rankings,
      allrounders: analytics.allrounders,
    };
    cacheAt = now;
    return json(cache, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error(err);
    if (cache) {
      return json(cache, { headers: { "X-Cache": "STALE" } });
    }
    return error(err.message);
  }
}
