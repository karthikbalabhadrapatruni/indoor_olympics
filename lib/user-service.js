import { appendRow, getSheetsClient, readSheet, rowToUser, updateRow } from "./sheets";

export async function findUserByEmail(email) {
  const sheets = getSheetsClient();
  const rows = await readSheet(sheets, "users!A2:H");
  const index = rows.findIndex((row) => (row[5] || "").toLowerCase() === email.toLowerCase());
  if (index === -1) {
    return null;
  }
  return { user: rowToUser(rows[index]), index, rows, sheets };
}

export async function createOrUpdateOnboardedUser({ email, username, googleName, avatarUrl }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    const duplicateUsername = existing.rows.some(
      (row, rowIndex) => rowIndex !== existing.index && (row[1] || "").toLowerCase() === username.toLowerCase()
    );
    if (duplicateUsername) {
      throw new Error("username already taken");
    }

    const current = existing.rows[existing.index];
    const updated = [
      current[0],
      username,
      current[2],
      current[3] || "",
      current[4] || avatarUrl || "",
      email,
      googleName || current[6] || "",
      avatarUrl || current[7] || "",
    ];
    await updateRow(existing.sheets, `users!A${existing.index + 2}:H${existing.index + 2}`, updated);
    return rowToUser(updated);
  }

  const sheets = getSheetsClient();
  const rows = await readSheet(sheets, "users!A2:H");
  if (rows.some((row) => (row[1] || "").toLowerCase() === username.toLowerCase())) {
    throw new Error("username already taken");
  }

  const user = [
    crypto.randomUUID(),
    username,
    new Date().toISOString(),
    "",
    avatarUrl || "",
    email,
    googleName || "",
    avatarUrl || "",
  ];
  await appendRow(sheets, "users!A:H", user);
  return rowToUser(user);
}
