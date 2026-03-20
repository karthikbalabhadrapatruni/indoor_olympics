import {
  appendRow,
  ensureSheetExists,
  getSheetsClient,
  readSheet,
  rowToGameAccess,
  rowToGameSession,
  safeReadSheet,
} from "./sheets";

export async function createGame({ ownerUserId, gameTypeId, title }) {
  const sheets = getSheetsClient();
  await ensureSheetExists(sheets, "game_access", ["access_id", "game_id", "user_id", "role", "added_at"]);

  const gameId = `G-${Date.now().toString(36).toUpperCase()}`;
  const playedAt = new Date().toISOString();
  const sessionRow = [gameId, gameTypeId, playedAt, ownerUserId, title];
  await appendRow(sheets, "game_sessions!A:E", sessionRow);
  await appendRow(sheets, "game_access!A:E", [
    crypto.randomUUID(),
    gameId,
    ownerUserId,
    "owner",
    playedAt,
  ]);
  return rowToGameSession(sessionRow);
}

export async function listGameAccess(gameId) {
  const sheets = getSheetsClient();
  const rows = await safeReadSheet(sheets, "game_access!A2:E");
  return rows.map(rowToGameAccess).filter((row) => row.game_id === gameId);
}

export async function addPlayersToGame({ actorUserId, gameId, userIds }) {
  const sheets = getSheetsClient();
  await ensureSheetExists(sheets, "game_access", ["access_id", "game_id", "user_id", "role", "added_at"]);

  const sessionRows = await readSheet(sheets, "game_sessions!A2:E");
  const session = sessionRows.map(rowToGameSession).find((row) => row.game_id === gameId);
  if (!session) {
    throw new Error("game not found");
  }

  const accessRows = (await safeReadSheet(sheets, "game_access!A2:E")).map(rowToGameAccess);
  const actorCanManage =
    session.owner_user_id === actorUserId ||
    accessRows.some((row) => row.game_id === gameId && row.user_id === actorUserId);

  if (!actorCanManage) {
    throw new Error("you do not have access to manage this game");
  }

  const existing = new Set(accessRows.filter((row) => row.game_id === gameId).map((row) => row.user_id));
  const added = [];

  for (const userId of userIds) {
    if (existing.has(userId)) {
      continue;
    }
    const row = [crypto.randomUUID(), gameId, userId, "member", new Date().toISOString()];
    await appendRow(sheets, "game_access!A:E", row);
    added.push(rowToGameAccess(row));
  }

  return added;
}
