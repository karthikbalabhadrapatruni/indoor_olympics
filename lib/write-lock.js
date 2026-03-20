const SCORE_WRITE_LOCK_KEY = "__gameTrackerScoreWriteLock";
const SCORE_WRITE_LOCK_TTL_MS = 15_000;

function getLockStore() {
  if (!globalThis[SCORE_WRITE_LOCK_KEY]) {
    globalThis[SCORE_WRITE_LOCK_KEY] = {
      token: null,
      acquiredAt: 0,
    };
  }

  return globalThis[SCORE_WRITE_LOCK_KEY];
}

export function acquireScoreWriteLock() {
  const lock = getLockStore();
  const now = Date.now();

  if (lock.token && now - lock.acquiredAt < SCORE_WRITE_LOCK_TTL_MS) {
    return null;
  }

  const token = crypto.randomUUID();
  lock.token = token;
  lock.acquiredAt = now;
  return token;
}

export function releaseScoreWriteLock(token) {
  const lock = getLockStore();
  if (lock.token === token) {
    lock.token = null;
    lock.acquiredAt = 0;
  }
}
