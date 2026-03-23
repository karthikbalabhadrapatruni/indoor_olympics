from collections import defaultdict
from datetime import datetime, timezone
from math import exp
import json
from .sheets_store import SheetsStore


def _bool(value):
    return str(value).upper() == "TRUE"


def load_dataset():
    store = SheetsStore()
    users = [
        {
            "user_id": row[0],
            "username": row[1] or row[6] or (row[5].split("@")[0] if len(row) > 5 and row[5] else row[0]),
            "email": row[5] if len(row) > 5 else "",
            "photo_url": row[4] if len(row) > 4 else "",
            "avatar_url": row[7] if len(row) > 7 else "",
        }
        for row in store.read("users!A2:H")
    ]
    game_types = [
        {
            "game_type_id": row[0],
            "name": row[1],
            "scoring_mode": row[2] if len(row) > 2 and row[2] else "highest",
            "description": row[3] if len(row) > 3 else "",
        }
        for row in store.read("game_types!A2:D")
    ]
    sessions = [
        {
            "game_id": row[0],
            "game_type_id": row[1],
            "played_at": row[2],
            "owner_user_id": row[3] if len(row) > 3 else "",
            "title": row[4] if len(row) > 4 and row[4] else row[0],
            "visibility": row[5] if len(row) > 5 and row[5] else "public",
            "status": row[6] if len(row) > 6 and row[6] else "active",
            "ended_at": row[7] if len(row) > 7 else "",
        }
        for row in store.read("game_sessions!A2:H")
    ]
    scores = [
        {
            "score_id": row[0],
            "game_id": row[1],
            "user_id": row[2],
            "score": float(row[3] or 0),
            "is_winner": _bool(row[4]) if len(row) > 4 else False,
            "round_number": int(row[5] or 0) if len(row) > 5 else 0,
        }
        for row in store.read("scores!A2:F")
    ]
    access = [
        {
            "access_id": row[0],
            "game_id": row[1],
            "user_id": row[2],
            "role": row[3] if len(row) > 3 else "member",
        }
        for row in store.safe_read("game_access!A2:E")
    ]
    stats = [
        {
            "id": row[0],
            "user_id": row[1],
            "game_type_id": row[2],
            "total_score": float(row[3] or 0),
            "total_games": int(row[4] or 0),
            "total_wins": int(row[5] or 0),
        }
        for row in store.read("user_game_stats!A2:F")
    ]
    insights = [
        {
            "type": row[1],
            "scope_type": row[2],
            "scope_id": row[3],
            "game_id": row[4] if len(row) > 4 else "",
            "user_id": row[5] if len(row) > 5 else "",
            "period_key": row[6] if len(row) > 6 else "",
            "content": row[7] if len(row) > 7 else "",
            "model": row[8] if len(row) > 8 else "",
            "created_at": row[9] if len(row) > 9 else "",
            "metadata": json.loads(row[10]) if len(row) > 10 and row[10] else {},
        }
        for row in store.safe_read("ai_insights!A2:K")
    ]
    return {
        "store": store,
        "users": users,
        "game_types": game_types,
        "sessions": sessions,
        "scores": scores,
        "access": access,
        "stats": stats,
        "insights": insights,
    }


def user_map(data):
    return {entry["user_id"]: entry for entry in data["users"]}


def game_type_map(data):
    return {entry["game_type_id"]: entry for entry in data["game_types"]}


def session_context(data, game_id: str):
    users = user_map(data)
    game_types = game_type_map(data)
    session = next((entry for entry in data["sessions"] if entry["game_id"] == game_id), None)
    if not session:
        raise ValueError("game session not found")
    scores = [entry for entry in data["scores"] if entry["game_id"] == game_id]
    members = [entry for entry in data["access"] if entry["game_id"] == game_id]
    return {
        "session": session,
        "game_type": game_types.get(session["game_type_id"]),
        "scores": scores,
        "members": [
            {
                **member,
                "username": users.get(member["user_id"], {}).get("username", member["user_id"]),
            }
            for member in members
        ],
    }


def round_scores(scores, round_number=None):
    if round_number is None:
        round_number = max((entry["round_number"] for entry in scores), default=0)
    return [entry for entry in scores if entry["round_number"] == round_number], round_number


def compute_pre_game_probabilities(data, game_type_id: str, user_ids):
    relevant_stats = [entry for entry in data["stats"] if entry["game_type_id"] == game_type_id and entry["user_id"] in user_ids]
    stats_by_user = {entry["user_id"]: entry for entry in relevant_stats}

    pairwise_games = defaultdict(lambda: {"games": 0, "wins": 0})
    relevant_session_ids = {
        entry["game_id"]
        for entry in data["sessions"]
        if entry["game_type_id"] == game_type_id
    }
    for game_id in relevant_session_ids:
        game_scores = [score for score in data["scores"] if score["game_id"] == game_id]
        players = {score["user_id"] for score in game_scores}
        if not set(user_ids).issubset(players):
            continue
        for user_id in user_ids:
            key = tuple(sorted([user_id] + [other for other in user_ids if other != user_id]))
            pairwise_games[(user_id, key)]["games"] += 1
            pairwise_games[(user_id, key)]["wins"] += sum(
                1 for score in game_scores if score["user_id"] == user_id and score["is_winner"]
            )

    scores = {}
    for user_id in user_ids:
        stats = stats_by_user.get(user_id, {})
        total_games = max(int(stats.get("total_games", 0)), 1)
        total_wins = int(stats.get("total_wins", 0))
        base_win_rate = (total_wins + 1) / (total_games + 2)

        pair_key = tuple(sorted(user_ids))
        pairwise = pairwise_games.get((user_id, pair_key), {"games": 0, "wins": 0})
        pairwise_rate = (pairwise["wins"] + 1) / (pairwise["games"] + 2)
        experience = min(total_games / 12, 1)
        raw_score = 0.55 * base_win_rate + 0.30 * pairwise_rate + 0.15 * experience
        scores[user_id] = exp(raw_score * 3)

    total = sum(scores.values()) or 1
    return {
        user_id: round((value / total) * 100, 1)
        for user_id, value in sorted(scores.items(), key=lambda item: item[1], reverse=True)
    }


def head_to_head_summary(data, user_a: str, user_b: str, game_type_id: str | None = None):
    sessions = {
        session["game_id"]: session
        for session in data["sessions"]
        if not game_type_id or session["game_type_id"] == game_type_id
    }
    games = 0
    wins = {user_a: 0, user_b: 0}
    for game_id in sessions:
        game_scores = [score for score in data["scores"] if score["game_id"] == game_id]
        players = {score["user_id"] for score in game_scores}
        if not {user_a, user_b}.issubset(players):
            continue
        games += 1
        for score in game_scores:
            if score["user_id"] in wins and score["is_winner"]:
                wins[score["user_id"]] += 1
    return {"games": games, "wins": wins}


def game_rankings_summary(data, game_type_id: str | None = None, limit: int = 10):
    users = user_map(data)
    game_types = game_type_map(data)
    rows = [
        row
        for row in data["stats"]
        if (not game_type_id or row["game_type_id"] == game_type_id)
    ]

    ranked = []
    for row in rows:
        total_games = int(row.get("total_games", 0))
        total_wins = int(row.get("total_wins", 0))
        ranked.append(
            {
                "user_id": row["user_id"],
                "username": users.get(row["user_id"], {}).get("username", row["user_id"]),
                "game_type_id": row["game_type_id"],
                "game_type_name": game_types.get(row["game_type_id"], {}).get("name", row["game_type_id"]),
                "total_games": total_games,
                "total_wins": total_wins,
                "win_rate": round((total_wins / total_games) * 100, 1) if total_games else 0.0,
                "total_score": float(row.get("total_score", 0)),
            }
        )

    ranked.sort(
        key=lambda item: (item["total_wins"], item["win_rate"], item["total_games"], item["total_score"]),
        reverse=True,
    )
    return {"items": ranked[:limit]}


def player_summary(data, user_id: str, game_type_id: str | None = None):
    users = user_map(data)
    game_types = game_type_map(data)
    stats_rows = [
        row for row in data["stats"] if row["user_id"] == user_id and (not game_type_id or row["game_type_id"] == game_type_id)
    ]

    if not stats_rows:
        return {
            "user_id": user_id,
            "username": users.get(user_id, {}).get("username", user_id),
            "game_type_name": game_types.get(game_type_id, {}).get("name", game_type_id) if game_type_id else "",
            "total_games": 0,
            "total_wins": 0,
            "win_rate": 0.0,
            "total_score": 0.0,
        }

    total_games = sum(int(row.get("total_games", 0)) for row in stats_rows)
    total_wins = sum(int(row.get("total_wins", 0)) for row in stats_rows)
    total_score = sum(float(row.get("total_score", 0)) for row in stats_rows)

    return {
        "user_id": user_id,
        "username": users.get(user_id, {}).get("username", user_id),
        "game_type_name": game_types.get(game_type_id, {}).get("name", game_type_id) if game_type_id else "All games",
        "total_games": total_games,
        "total_wins": total_wins,
        "win_rate": round((total_wins / total_games) * 100, 1) if total_games else 0.0,
        "total_score": total_score,
        "by_game_type": [
            {
                "game_type_id": row["game_type_id"],
                "game_type_name": game_types.get(row["game_type_id"], {}).get("name", row["game_type_id"]),
                "total_games": int(row.get("total_games", 0)),
                "total_wins": int(row.get("total_wins", 0)),
                "win_rate": round(
                    (int(row.get("total_wins", 0)) / int(row.get("total_games", 0))) * 100, 1
                )
                if int(row.get("total_games", 0))
                else 0.0,
            }
            for row in stats_rows
        ],
    }


def rivalry_candidates(data, game_type_id: str | None = None, limit: int = 5):
    users = user_map(data)
    pair_counts = defaultdict(lambda: {"games": 0, "close_games": 0, "wins": defaultdict(int)})
    sessions = [session for session in data["sessions"] if not game_type_id or session["game_type_id"] == game_type_id]

    for session in sessions:
        game_scores = [score for score in data["scores"] if score["game_id"] == session["game_id"]]
        players = sorted({score["user_id"] for score in game_scores})
        if len(players) < 2:
            continue
        score_values = sorted([score["score"] for score in game_scores])
        close_margin = abs(score_values[-1] - score_values[0]) <= 20 if len(score_values) > 1 else False
        for idx in range(len(players)):
            for jdx in range(idx + 1, len(players)):
                pair = (players[idx], players[jdx])
                pair_counts[pair]["games"] += 1
                if close_margin:
                    pair_counts[pair]["close_games"] += 1
                for score in game_scores:
                    if score["is_winner"] and score["user_id"] in pair:
                        pair_counts[pair]["wins"][score["user_id"]] += 1

    ranked = []
    for pair, summary in pair_counts.items():
        ranked.append(
            {
                "players": pair,
                "player_names": [users.get(pair[0], {}).get("username", pair[0]), users.get(pair[1], {}).get("username", pair[1])],
                "games": summary["games"],
                "close_games": summary["close_games"],
                "wins": dict(summary["wins"]),
            }
        )
    ranked.sort(key=lambda item: (item["games"], item["close_games"]), reverse=True)
    return ranked[:limit]


def month_key(value: str | None = None):
    if value:
        return value
    return datetime.utcnow().strftime("%Y-%m")


def parse_iso_timestamp(value: str | None):
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except Exception:
        return None


def latest_matching_insight(data, insight_type: str, scope_type: str, scope_id: str):
    matches = [
        entry
        for entry in data["insights"]
        if entry["type"] == insight_type and entry["scope_type"] == scope_type and entry["scope_id"] == scope_id
    ]
    if not matches:
        return None
    matches.sort(key=lambda entry: str(entry.get("created_at", "")), reverse=True)
    return matches[0]


def insight_is_fresh(insight, cooldown_seconds: int):
    if not insight:
        return False
    created_at = parse_iso_timestamp(insight.get("created_at"))
    if not created_at:
        return False
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (datetime.now(tz=timezone.utc) - created_at).total_seconds() < cooldown_seconds


def season_summary(data, period_key: str):
    sessions = [session for session in data["sessions"] if str(session["played_at"]).startswith(period_key)]
    session_ids = {session["game_id"] for session in sessions}
    scores = [score for score in data["scores"] if score["game_id"] in session_ids]
    users = user_map(data)
    game_types = game_type_map(data)

    wins = defaultdict(int)
    round_counts = defaultdict(int)
    for score in scores:
        if score["is_winner"]:
            wins[score["user_id"]] += 1
        round_counts[score["game_id"]] = max(round_counts[score["game_id"]], score["round_number"])

    top_winner = None
    if wins:
        winner_id = max(wins, key=wins.get)
        top_winner = {"user_id": winner_id, "username": users.get(winner_id, {}).get("username", winner_id), "wins": wins[winner_id]}

    return {
        "period_key": period_key,
        "total_sessions": len(sessions),
        "total_rounds": sum(round_counts.values()),
        "top_winner": top_winner,
        "sessions": [
            {
                "game_id": session["game_id"],
                "title": session["title"],
                "game_type_name": game_types.get(session["game_type_id"], {}).get("name", session["game_type_id"]),
                "played_at": session["played_at"],
            }
            for session in sessions
        ],
    }
