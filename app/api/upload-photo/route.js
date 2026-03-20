import { Readable } from "stream";
import {
  getDriveClient,
  getSheetsClient,
  readSheet,
  updateRow,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { user_id, file_data, file_name, mime_type } = await request.json();
    if (!user_id || !file_data) {
      return error("user_id and file_data required", 400);
    }

    const sheets = getSheetsClient();
    const drive = getDriveClient();
    const rows = await readSheet(sheets, "users!A2:E");
    const idx = rows.findIndex((row) => row[0] === user_id);
    if (idx === -1) {
      return error("user not found", 404);
    }

    const oldFileId = rows[idx][3];
    if (oldFileId) {
      try {
        await drive.files.delete({ fileId: oldFileId });
      } catch (deleteError) {
        console.warn("Failed to delete old Drive file", deleteError);
      }
    }

    const buffer = Buffer.from(file_data, "base64");
    const uploaded = await drive.files.create({
      requestBody: {
        name: file_name || `photo_${user_id}.jpg`,
        parents: process.env.DRIVE_FOLDER_ID ? [process.env.DRIVE_FOLDER_ID] : [],
      },
      media: {
        mimeType: mime_type || "image/jpeg",
        body: Readable.from(buffer),
      },
      fields: "id",
    });

    const fileId = uploaded.data.id;
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const photoUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
    const sheetRow = idx + 2;
    await updateRow(sheets, `users!A${sheetRow}:E${sheetRow}`, [
      rows[idx][0],
      rows[idx][1],
      rows[idx][2],
      fileId,
      photoUrl,
    ]);

    globalThis.__gtCacheInvalidated = Date.now();
    return json({ photo_drive_id: fileId, photo_url: photoUrl });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
