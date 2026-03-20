// api/upload-photo.js
// POST multipart/form-data: { user_id, file (base64 encoded image) }
// 1. Uploads image to Google Drive folder
// 2. Makes it publicly readable
// 3. Updates users sheet: photo_drive_id + photo_url columns
import { getSheetsClient, getDriveClient, readSheet, updateRow, SPREADSHEET_ID } from "../lib/sheets.js";
import { Readable } from "stream";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { user_id, file_data, file_name, mime_type } = req.body;
  if (!user_id || !file_data) return res.status(400).json({ error: "user_id and file_data required" });

  try {
    const sheets = getSheetsClient();
    const drive  = getDriveClient();

    // Find user row
    const rows = await readSheet(sheets, "users!A2:E");
    const idx  = rows.findIndex(r => r[0] === user_id);
    if (idx === -1) return res.status(404).json({ error: "user not found" });

    // Delete old Drive file if exists
    const oldFileId = rows[idx][3];
    if (oldFileId) {
      try { await drive.files.delete({ fileId: oldFileId }); } catch (_) {}
    }

    // Upload new file to Drive
    const buffer   = Buffer.from(file_data, "base64");
    const stream   = Readable.from(buffer);
    const folderId = process.env.DRIVE_FOLDER_ID;
    const safeName = file_name || `photo_${user_id}.jpg`;
    const mimeType = mime_type || "image/jpeg";

    const uploaded = await drive.files.create({
      requestBody: {
        name: safeName,
        parents: folderId ? [folderId] : [],
      },
      media: { mimeType, body: stream },
      fields: "id,webViewLink",
    });

    const fileId = uploaded.data.id;

    // Make publicly readable
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // Build a direct thumbnail URL (works without auth)
    const photo_url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;

    // Update users sheet cols D (photo_drive_id) and E (photo_url)
    const sheetRow = idx + 2;
    await updateRow(sheets, `users!A${sheetRow}:E${sheetRow}`, [
      rows[idx][0], rows[idx][1], rows[idx][2], fileId, photo_url,
    ]);

    return res.status(200).json({ photo_drive_id: fileId, photo_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
