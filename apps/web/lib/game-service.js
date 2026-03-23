import {
  appendRow,
  ensureSheetExists,
  getSheetsClient,
  readSheet,
  rowToGameAccess,
  rowToGameSession,
  safeReadSheet,
  updateRow,
} from "./sheets";

export async function createGame({ ownerUserId, gameTypeId, title, visibility }) {
  const sheets = getSheetsClient();
  await ensureSheetExists(sheets, "game_access", ["access_id", "game_id", "user_id", "role", "added_at"]);
  await ensureSheetExists(sheets, "game_sessions", [
    "game_id",
    "game_type_id",
    "played_at",
    "owner_user_id",
    "title",
    "visibility",
    "status",
    "ended_at",
  ]);

  const gameId = `G-${Date.now().toString(36).toUpperCase()}`;
  const playedAt = new Date().toISOString();
  const sessionRow = [gameId, gameTypeId, playedAt, ownerUserId, title, visibility || "public", "active", ""];
  await appendRow(sheets, "game_sessions!A:H", sessionRow);
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

  const sessionRows = await readSheet(sheets, "game_sessions!A2:H");
  const session = sessionRows.map(rowToGameSession).find((row) => row.game_id === gameId);
  if (!session) {
    throw new Error("game not found");
  }
  if (session.status === "ended") {
    throw new Error("this game has already ended");
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

export async function endGame({ actorUserId, gameId }) {
  const sheets = getSheetsClient();
  const sessionRows = await readSheet(sheets, "game_sessions!A2:H");
  const index = sessionRows.findIndex((row) => row[0] === gameId);
  if (index === -1) {
    throw new Error("game not found");
  }

  const session = rowToGameSession(sessionRows[index]);
  const accessRows = (await safeReadSheet(sheets, "game_access!A2:E")).map(rowToGameAccess);
  const actorCanManage =
    session.owner_user_id === actorUserId ||
    accessRows.some((row) => row.game_id === gameId && row.user_id === actorUserId);

  if (!actorCanManage) {
    throw new Error("you do not have access to manage this game");
  }
  if (session.status === "ended") {
    return session;
  }

  const endedAt = new Date().toISOString();
  const updated = [
    session.game_id,
    session.game_type_id,
    session.played_at,
    session.owner_user_id,
    session.title,
    session.visibility,
    "ended",
    endedAt,
  ];
  await updateRow(sheets, `game_sessions!A${index + 2}:H${index + 2}`, updated);
  return rowToGameSession(updated);
}
