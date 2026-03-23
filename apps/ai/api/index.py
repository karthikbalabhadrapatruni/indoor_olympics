from flask import Flask, jsonify, request

from py_ai.config import get_internal_token
from py_ai.workflows import (
    generate_match_commentary,
    generate_pre_game_win_probability,
    generate_rivalry_tracker,
    generate_season_recap,
    generate_stats_chat,
)

app = Flask(__name__)


def _require_internal_token():
    provided = request.headers.get("X-AI-Internal-Token", "")
    expected = get_internal_token()
    if provided != expected:
        return jsonify({"error": "Unauthorized"}), 401
    return None


def _error_response(exc: Exception):
    message = str(exc)
    status = 503 if "quota" in message.lower() or "resource_exhausted" in message.lower() else 500
    return jsonify({"error": message}), status


@app.post("/api/match-commentary")
def match_commentary():
    unauthorized = _require_internal_token()
    if unauthorized:
        return unauthorized
    payload = request.get_json(silent=True) or {}
    if not payload.get("game_id"):
        return jsonify({"error": "game_id required"}), 400
    try:
        return jsonify(generate_match_commentary(payload))
    except Exception as exc:
        return _error_response(exc)


@app.post("/api/pre-game-win-probability")
def pre_game_win_probability():
    unauthorized = _require_internal_token()
    if unauthorized:
      return unauthorized
    payload = request.get_json(silent=True) or {}
    if not payload.get("game_type_id") or not payload.get("user_ids"):
        return jsonify({"error": "game_type_id and user_ids required"}), 400
    try:
        return jsonify(generate_pre_game_win_probability(payload))
    except Exception as exc:
        return _error_response(exc)


@app.post("/api/stats-chat")
def stats_chat():
    unauthorized = _require_internal_token()
    if unauthorized:
        return unauthorized
    payload = request.get_json(silent=True) or {}
    if not payload.get("message"):
        return jsonify({"error": "message required"}), 400
    try:
        return jsonify(generate_stats_chat(payload))
    except Exception as exc:
        return _error_response(exc)


@app.post("/api/season-recap")
def season_recap():
    unauthorized = _require_internal_token()
    if unauthorized:
        return unauthorized
    payload = request.get_json(silent=True) or {}
    try:
        return jsonify(generate_season_recap(payload))
    except Exception as exc:
        return _error_response(exc)


@app.post("/api/rivalry-tracker")
def rivalry_tracker():
    unauthorized = _require_internal_token()
    if unauthorized:
        return unauthorized
    payload = request.get_json(silent=True) or {}
    try:
        return jsonify(generate_rivalry_tracker(payload))
    except Exception as exc:
        return _error_response(exc)


@app.get("/")
def healthcheck():
    return jsonify({"ok": True, "service": "indoor-olympics-ai"})
