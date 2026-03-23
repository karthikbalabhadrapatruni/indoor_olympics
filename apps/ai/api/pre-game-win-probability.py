from http.server import BaseHTTPRequestHandler
from py_ai.config import get_internal_token
from py_ai.http import read_json, send_error, send_json
from py_ai.workflows import generate_pre_game_win_probability


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            if self.headers.get("X-AI-Internal-Token") != get_internal_token():
                return send_error(self, "Unauthorized", 401)
            payload = read_json(self)
            if not payload.get("game_type_id") or not payload.get("user_ids"):
                return send_error(self, "game_type_id and user_ids required", 400)
            send_json(self, generate_pre_game_win_probability(payload))
        except Exception as exc:
            send_error(self, str(exc), 500)
