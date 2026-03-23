import json
from datetime import datetime, timezone
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from .config import get_service_account_info, get_spreadsheet_id

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class SheetsStore:
    def __init__(self):
        credentials = Credentials.from_service_account_info(get_service_account_info(), scopes=SCOPES)
        self.client = build("sheets", "v4", credentials=credentials, cache_discovery=False)
        self.spreadsheet_id = get_spreadsheet_id()

    def read(self, range_name: str):
        result = self.client.spreadsheets().values().get(
            spreadsheetId=self.spreadsheet_id, range=range_name
        ).execute()
        return result.get("values", [])

    def safe_read(self, range_name: str):
        try:
            return self.read(range_name)
        except Exception:
            return []

    def append(self, range_name: str, values):
        self.client.spreadsheets().values().append(
            spreadsheetId=self.spreadsheet_id,
            range=range_name,
            valueInputOption="RAW",
            body={"values": [values]},
        ).execute()

    def ensure_sheet(self, title: str, headers):
        spreadsheet = self.client.spreadsheets().get(spreadsheetId=self.spreadsheet_id).execute()
        existing = {sheet["properties"]["title"] for sheet in spreadsheet.get("sheets", [])}
        if title not in existing:
            self.client.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={"requests": [{"addSheet": {"properties": {"title": title}}}]},
            ).execute()

        end_column = chr(64 + len(headers))
        self.client.spreadsheets().values().update(
            spreadsheetId=self.spreadsheet_id,
            range=f"{title}!A1:{end_column}1",
            valueInputOption="RAW",
            body={"values": [headers]},
        ).execute()

    def append_ai_insight(self, insight_type: str, scope_type: str, scope_id: str, content: str, model: str,
                          game_id: str = "", user_id: str = "", period_key: str = "", metadata=None):
        self.ensure_sheet(
            "ai_insights",
            [
                "insight_id",
                "type",
                "scope_type",
                "scope_id",
                "game_id",
                "user_id",
                "period_key",
                "content",
                "model",
                "created_at",
                "metadata_json",
            ],
        )
        metadata = metadata or {}
        self.append(
            "ai_insights!A:K",
            [
                f"AI-{int(datetime.now(tz=timezone.utc).timestamp() * 1000)}",
                insight_type,
                scope_type,
                scope_id,
                game_id,
                user_id,
                period_key,
                content,
                model,
                datetime.now(tz=timezone.utc).isoformat(),
                json.dumps(metadata),
            ],
        )
