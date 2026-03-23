from http.server import BaseHTTPRequestHandler
from py_ai.config import get_internal_token
from py_ai.http import read_json, send_error, send_json
from py_ai.workflows import generate_match_commentary


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            if self.headers.get("X-AI-Internal-Token") != get_internal_token():
                return send_error(self, "Unauthorized", 401)
            payload = read_json(self)
            if not payload.get("game_id"):
                return send_error(self, "game_id required", 400)
            send_json(self, generate_match_commentary(payload))
        except Exception as exc:
            send_error(self, str(exc), 500)
