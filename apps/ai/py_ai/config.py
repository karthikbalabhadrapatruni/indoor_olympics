import os


def get_required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def get_internal_token() -> str:
    return get_required_env("AI_INTERNAL_TOKEN")


def get_gemini_api_key() -> str:
    return get_required_env("GEMINI_API_KEY")


def get_text_model() -> str:
    return os.environ.get("GEMINI_TEXT_MODEL", "gemini-2.5-flash").strip()


def get_reasoning_model() -> str:
    return os.environ.get("GEMINI_REASONING_MODEL", "gemini-2.5-pro").strip()


def get_ai_retry_count() -> int:
    return int(os.environ.get("AI_RETRY_COUNT", "3"))


def get_ai_initial_backoff_ms() -> int:
    return int(os.environ.get("AI_INITIAL_BACKOFF_MS", "1200"))


def get_ai_workflow_cooldown_seconds(workflow_name: str, default_seconds: int) -> int:
    key = f"AI_{workflow_name.upper().replace('-', '_')}_COOLDOWN_SECONDS"
    return int(os.environ.get(key, str(default_seconds)))


def get_spreadsheet_id() -> str:
    return get_required_env("SPREADSHEET_ID")


def get_service_account_info() -> dict:
    private_key = get_required_env("GOOGLE_PRIVATE_KEY").replace("\\n", "\n")
    return {
        "type": "service_account",
        "client_email": get_required_env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        "private_key": private_key,
        "token_uri": "https://oauth2.googleapis.com/token",
    }
