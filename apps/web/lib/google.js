import { google } from "googleapis";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPrivateKey() {
  return requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getAuth() {
  return new google.auth.JWT({
    email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: getPrivateKey(),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export function getSpreadsheetId() {
  return requireEnv("SPREADSHEET_ID");
}
