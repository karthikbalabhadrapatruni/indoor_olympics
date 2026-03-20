import { google } from "googleapis";

function getAuth() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  return auth;
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

export async function readSheet(sheets, range) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  return res.data.values || [];
}

export async function appendRow(sheets, range, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID, range, valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

export async function updateRow(sheets, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range, valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

export function rowToUser([user_id, username, created_at, photo_drive_id, photo_url]) {
  return { user_id, username, created_at, photo_drive_id: photo_drive_id||"", photo_url: photo_url||"" };
}

export function rowToGameType([game_type_id, name]) { return { game_type_id, name }; }
export function rowToGameSession([game_id, game_type_id, played_at]) { return { game_id, game_type_id, played_at }; }
export function rowToScore([score_id, game_id, user_id, score, is_winner]) {
  return { score_id, game_id, user_id, score: Number(score), is_winner: is_winner === "TRUE" };
}
export function rowToStats([id, user_id, game_type_id, total_score, total_games, total_wins]) {
  return { id, user_id, game_type_id, total_score: Number(total_score), total_games: Number(total_games), total_wins: Number(total_wins) };
}

export async function upsertStats(sheets, userId, gameTypeId, scoreDelta, winDelta) {
  const rows = await readSheet(sheets, "user_game_stats!A2:F");
  const idx = rows.findIndex(r => r[1] === userId && r[2] === gameTypeId);
  if (idx === -1) {
    const id = crypto.randomUUID();
    await appendRow(sheets, "user_game_stats!A:F", [id, userId, gameTypeId, scoreDelta, 1, winDelta]);
  } else {
    const row = rows[idx];
    const sheetRow = idx + 2;
    await updateRow(sheets, `user_game_stats!A${sheetRow}:F${sheetRow}`, [
      row[0], userId, gameTypeId,
      Number(row[3]) + scoreDelta, Number(row[4]) + 1, Number(row[5]) + winDelta,
    ]);
  }
}
