from .analytics import (
    compute_pre_game_probabilities,
    game_rankings_summary,
    head_to_head_summary,
    insight_is_fresh,
    load_dataset,
    latest_matching_insight,
    month_key,
    player_summary,
    rivalry_candidates,
    round_scores,
    season_summary,
    session_context,
    user_map,
    game_type_map,
)
from .gemini_client import GeminiClient
from .config import (
    get_ai_workflow_cooldown_seconds,
    get_reasoning_model,
    get_text_model,
)


def generate_match_commentary(payload):
    data = load_dataset()
    context = session_context(data, payload["game_id"])
    round_items, round_number = round_scores(context["scores"], payload.get("round_number"))
    scope_id = f'{context["session"]["game_id"]}-round-{round_number}'
    existing = latest_matching_insight(data, "match_commentary", "round", scope_id)
    if existing:
        return {
            "workflow": "match_commentary",
            "game_id": context["session"]["game_id"],
            "round_number": round_number,
            "commentary": existing["content"],
            "cached": True,
        }

    gemini = GeminiClient()
    users = user_map(data)

    score_lines = [
        {
            "username": users.get(score["user_id"], {}).get("username", score["user_id"]),
            "score": score["score"],
            "is_winner": score["is_winner"],
        }
        for score in round_items
    ]
    prompt = f"""
You are an energetic but not mean sports commentator for a private friend-group game tracker.
Write exactly 2 short lines.
Be witty, specific, and grounded in the data.
Do not invent facts outside the context.

Game: {context["session"]["title"]}
Game type: {context["game_type"]["name"] if context["game_type"] else "Unknown"}
Round: {round_number}
Scoring mode: {context["game_type"]["scoring_mode"] if context["game_type"] else "highest"}
Scores: {score_lines}
"""
    commentary = gemini.generate_text(prompt)
    data["store"].append_ai_insight(
        "match_commentary",
        "round",
        scope_id,
        commentary,
        get_text_model(),
        game_id=context["session"]["game_id"],
        metadata={"round_number": round_number, "game_title": context["session"]["title"]},
    )
    return {
        "workflow": "match_commentary",
        "game_id": context["session"]["game_id"],
        "round_number": round_number,
        "commentary": commentary,
    }


def generate_pre_game_win_probability(payload):
    data = load_dataset()
    user_ids = payload["user_ids"]
    scope_id = f'{payload["game_type_id"]}-{"-".join(sorted(user_ids))}'
    cooldown = get_ai_workflow_cooldown_seconds("pre_game_win_probability", 1800)
    existing = latest_matching_insight(data, "pre_game_win_probability", "lineup", scope_id)
    if insight_is_fresh(existing, cooldown):
        return {
            "workflow": "pre_game_win_probability",
            "game_type_id": payload["game_type_id"],
            "probabilities": existing.get("metadata", {}).get("probabilities", []),
            "narrative": existing["content"],
            "cached": True,
        }

    gemini = GeminiClient()
    probabilities = compute_pre_game_probabilities(data, payload["game_type_id"], user_ids)
    users = user_map(data)
    game_type = game_type_map(data).get(payload["game_type_id"])
    breakdown = [
        {"user_id": user_id, "username": users.get(user_id, {}).get("username", user_id), "probability": probability}
        for user_id, probability in probabilities.items()
    ]
    prompt = f"""
Explain this pre-game probability table in 2 sentences max.
Game type: {game_type["name"] if game_type else payload["game_type_id"]}
Probabilities: {breakdown}
Make it conversational and hype, but do not overstate certainty.
"""
    narrative = gemini.generate_text(prompt)
    metadata = {"probabilities": breakdown}
    data["store"].append_ai_insight(
        "pre_game_win_probability",
        "lineup",
        scope_id,
        narrative,
        get_text_model(),
        period_key=payload.get("period_key", ""),
        metadata=metadata,
    )
    return {
        "workflow": "pre_game_win_probability",
        "game_type_id": payload["game_type_id"],
        "probabilities": breakdown,
        "narrative": narrative,
    }


def generate_stats_chat(payload):
    data = load_dataset()
    gemini = GeminiClient()
    users = user_map(data)
    game_types = game_type_map(data)
    users_by_name = {user["username"].lower(): user for user in data["users"]}
    games_by_name = {game["name"].lower(): game for game in data["game_types"]}

    def resolve_user_id(text):
        lower = str(text or "").strip().lower()
        if not lower:
            return None
        if lower in users_by_name:
            return users_by_name[lower]["user_id"]
        for name, user in users_by_name.items():
            if lower in name or name in lower:
                return user["user_id"]
        return None

    def resolve_game_type_id(text):
        lower = str(text or "").strip().lower()
        if not lower:
            return None
        if lower in games_by_name:
            return games_by_name[lower]["game_type_id"]
        for name, game in games_by_name.items():
            if lower in name or name in lower:
                return game["game_type_id"]
        return None

    def fallback_plan_for_message(message):
        lower = message.lower()
        resolved_game_type = None
        for game in data["game_types"]:
            if game["name"].lower() in lower:
                resolved_game_type = game["game_type_id"]
                break

        mentioned_users = []
        for user in data["users"]:
            username = user["username"].lower()
            if username in lower or any(part and part in lower for part in username.split()):
                mentioned_users.append(user["user_id"])

        if "rival" in lower or "rivalry" in lower:
            return {"tool": "rivalry_candidates", "arguments": {"game_type_id": resolved_game_type or ""}}

        if len(mentioned_users) >= 2 and ("head-to-head" in lower or "against" in lower or "vs" in lower):
            return {
                "tool": "head_to_head",
                "arguments": {
                    "user_a": users[mentioned_users[0]]["username"],
                    "user_b": users[mentioned_users[1]]["username"],
                    "game_type": game_types.get(resolved_game_type, {}).get("name", ""),
                },
            }

        if "win rate" in lower or "best" in lower or "top" in lower or "leader" in lower or "rank" in lower:
            if mentioned_users:
                return {
                    "tool": "player_summary",
                    "arguments": {
                        "user": users[mentioned_users[0]]["username"],
                        "game_type": game_types.get(resolved_game_type, {}).get("name", ""),
                    },
                }
            return {
                "tool": "game_rankings",
                "arguments": {"game_type": game_types.get(resolved_game_type, {}).get("name", "")},
            }

        if mentioned_users:
            return {
                "tool": "player_summary",
                "arguments": {
                    "user": users[mentioned_users[0]]["username"],
                    "game_type": game_types.get(resolved_game_type, {}).get("name", ""),
                },
            }

        return {"tool": "group_summary", "arguments": {}}

    tool_catalog = {
        "group_summary": {
            "users": [{"user_id": user["user_id"], "username": user["username"]} for user in data["users"]],
            "game_types": [{"game_type_id": game["game_type_id"], "name": game["name"]} for game in data["game_types"]],
            "sessions_count": len(data["sessions"]),
            "scores_count": len(data["scores"]),
        },
        "top_rivalries": rivalry_candidates(data, limit=3),
    }

    planner_prompt = f"""
You are planning a stats-answering workflow.
User question: {payload["message"]}

Available tools:
1. group_summary
2. rivalry_candidates
3. head_to_head(user_a, user_b, optional game_type_id)
4. game_rankings(optional game_type_id)
5. player_summary(user, optional game_type_id)

Return JSON only with this schema:
{{
  "tool": "group_summary|rivalry_candidates|head_to_head|game_rankings|player_summary",
  "arguments": {{}}
}}
Choose exactly one tool.
"""
    try:
        plan = gemini.generate_json(planner_prompt, use_reasoning=True)
    except Exception:
        plan = fallback_plan_for_message(payload["message"])
    tool = plan.get("tool", "group_summary")
    tool_result = None

    if tool == "head_to_head":
        arg_names = plan.get("arguments", {})
        user_a = resolve_user_id(arg_names.get("user_a", ""))
        user_b = resolve_user_id(arg_names.get("user_b", ""))
        game_type_id = resolve_game_type_id(arg_names.get("game_type", ""))
        if user_a and user_b:
            tool_result = head_to_head_summary(data, user_a, user_b, game_type_id)
            tool_result["players"] = [users[user_a]["username"], users[user_b]["username"]]
            if game_type_id:
                tool_result["game_type"] = game_types[game_type_id]["name"]
        else:
            tool_result = {"error": "Could not resolve the two players from the question."}
    elif tool == "game_rankings":
        arg_names = plan.get("arguments", {})
        game_type_id = resolve_game_type_id(arg_names.get("game_type", ""))
        tool_result = game_rankings_summary(data, game_type_id, limit=10)
        if game_type_id:
            tool_result["game_type"] = game_types[game_type_id]["name"]
    elif tool == "player_summary":
        arg_names = plan.get("arguments", {})
        user_id = resolve_user_id(arg_names.get("user", ""))
        game_type_id = resolve_game_type_id(arg_names.get("game_type", ""))
        if user_id:
            tool_result = player_summary(data, user_id, game_type_id)
        else:
            tool_result = {"error": "Could not resolve the player from the question."}
    elif tool == "rivalry_candidates":
        arg_names = plan.get("arguments", {})
        game_type_id = resolve_game_type_id(arg_names.get("game_type_id") or arg_names.get("game_type", ""))
        tool_result = {"rivalries": rivalry_candidates(data, game_type_id=game_type_id, limit=5)}
        if game_type_id:
            tool_result["game_type"] = game_types[game_type_id]["name"]
    else:
        tool_result = tool_catalog["group_summary"]

    answer_prompt = f"""
Answer the user's question using only the tool result below.
Be concise, factual, and plain-English.
If the tool result is insufficient, say what is missing.

Question: {payload["message"]}
Tool result: {tool_result}
"""
    answer = gemini.generate_text(answer_prompt, use_reasoning=True)
    return {"workflow": "stats_chat", "tool": tool, "tool_result": tool_result, "answer": answer}


def generate_season_recap(payload):
    data = load_dataset()
    period = month_key(payload.get("period_key"))
    cooldown = get_ai_workflow_cooldown_seconds("season_recap", 21600)
    existing = latest_matching_insight(data, "season_recap", "period", period)
    if insight_is_fresh(existing, cooldown):
        return {
            "workflow": "season_recap",
            "period_key": period,
            "recap": existing["content"],
            "summary": existing.get("metadata", {}),
            "cached": True,
        }

    gemini = GeminiClient()
    summary = season_summary(data, period)
    prompt = f"""
Create a monthly game-night recap in 4-6 punchy lines.
Keep it lively and shareable, but grounded in facts.
Summary data: {summary}
"""
    recap = gemini.generate_text(prompt, use_reasoning=True)
    data["store"].append_ai_insight(
        "season_recap",
        "period",
        period,
        recap,
        get_reasoning_model(),
        period_key=period,
        metadata=summary,
    )
    return {"workflow": "season_recap", "period_key": period, "recap": recap, "summary": summary}


def generate_rivalry_tracker(payload):
    data = load_dataset()
    game_type_id = payload.get("game_type_id")
    scope_id = game_type_id or "all-games"
    cooldown = get_ai_workflow_cooldown_seconds("rivalry_tracker", 3600)
    existing = latest_matching_insight(data, "rivalry_tracker", "scope", scope_id)
    if insight_is_fresh(existing, cooldown):
        return {
            "workflow": "rivalry_tracker",
            "game_type_id": game_type_id or "",
            "rivalries": existing.get("metadata", {}).get("rivalries", []),
            "cached": True,
        }

    gemini = GeminiClient()
    rivalries = rivalry_candidates(data, game_type_id=game_type_id, limit=5)
    game_type = game_type_map(data).get(game_type_id) if game_type_id else None

    enriched = []
    for rivalry in rivalries:
        prompt = f"""
Write a 2-3 line rivalry narrative for this matchup.
Keep it sharp and dramatic, but factual.
Game type: {game_type['name'] if game_type else 'All games'}
Rivalry data: {rivalry}
"""
        narrative = gemini.generate_text(prompt)
        rivalry_payload = {**rivalry, "narrative": narrative}
        enriched.append(rivalry_payload)

    if enriched:
        data["store"].append_ai_insight(
            "rivalry_tracker",
            "scope",
            scope_id,
            enriched[0]["narrative"],
            get_text_model(),
            period_key=payload.get("period_key", ""),
            metadata={"rivalries": enriched},
        )

    return {"workflow": "rivalry_tracker", "game_type_id": game_type_id or "", "rivalries": enriched}
