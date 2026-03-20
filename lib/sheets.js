import { getDriveClient, getSheetsClient, getSpreadsheetId } from "./google";

export { getDriveClient, getSheetsClient };

export async function readSheet(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range,
  });

  return res.data.values || [];
}

export async function batchReadSheets(sheets, ranges) {
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: getSpreadsheetId(),
    ranges,
  });

  return (res.data.valueRanges || []).map((valueRange) => valueRange.values || []);
}

export async function appendRow(sheets, range, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

export async function updateRow(sheets, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

export function rowToUser([user_id, username, created_at, photo_drive_id, photo_url]) {
  return {
    user_id,
    username,
    created_at,
    photo_drive_id: photo_drive_id || "",
    photo_url: photo_url || "",
  };
}

export function rowToGameType([game_type_id, name]) {
  return { game_type_id, name };
}

export function rowToGameSession([game_id, game_type_id, played_at]) {
  return { game_id, game_type_id, played_at };
}

export function rowToScore([score_id, game_id, user_id, score, is_winner]) {
  return {
    score_id,
    game_id,
    user_id,
    score: Number(score),
    is_winner: is_winner === "TRUE",
  };
}

export async function upsertStats(sheets, userId, gameTypeId, scoreDelta, winDelta) {
  const rows = await readSheet(sheets, "user_game_stats!A2:F");
  const idx = rows.findIndex((row) => row[1] === userId && row[2] === gameTypeId);

  if (idx === -1) {
    await appendRow(sheets, "user_game_stats!A:F", [
      crypto.randomUUID(),
      userId,
      gameTypeId,
      scoreDelta,
      1,
      winDelta,
    ]);
    return;
  }

  const row = rows[idx];
  const sheetRow = idx + 2;
  await updateRow(sheets, `user_game_stats!A${sheetRow}:F${sheetRow}`, [
    row[0],
    userId,
    gameTypeId,
    Number(row[3]) + scoreDelta,
    Number(row[4]) + 1,
    Number(row[5]) + winDelta,
  ]);
}
