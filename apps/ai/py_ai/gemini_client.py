import json
import re
import time
from google import genai
from .config import (
    get_ai_initial_backoff_ms,
    get_ai_retry_count,
    get_gemini_api_key,
    get_reasoning_model,
    get_text_model,
)


class GeminiClient:
    def __init__(self):
        self.client = genai.Client(api_key=get_gemini_api_key())

    def _is_quota_error(self, exc: Exception) -> bool:
        message = str(exc).lower()
        return "resource_exhausted" in message or "quota exceeded" in message or "429" in message

    def _build_models_to_try(self, use_reasoning: bool) -> list[str]:
        primary_model = get_reasoning_model() if use_reasoning else get_text_model()
        fallback_model = get_text_model()
        models = [primary_model]
        if fallback_model and fallback_model not in models:
            models.append(fallback_model)
        return models

    def _normalize_error(self, exc: Exception) -> RuntimeError:
        if self._is_quota_error(exc):
            return RuntimeError(
                "Gemini quota is currently exhausted. The AI service retried with the lighter model, "
                "but your project still has no available free-tier capacity. Set "
                "GEMINI_REASONING_MODEL=gemini-2.5-flash for now or enable Gemini billing."
            )
        return RuntimeError(str(exc))

    def generate_text(self, prompt: str, use_reasoning: bool = False) -> str:
        last_error = None
        retries = max(get_ai_retry_count(), 1)
        backoff_ms = max(get_ai_initial_backoff_ms(), 200)
        models_to_try = self._build_models_to_try(use_reasoning=use_reasoning)

        for model_index, model in enumerate(models_to_try):
            for attempt in range(retries):
                try:
                    response = self.client.models.generate_content(model=model, contents=prompt)
                    return (response.text or "").strip()
                except Exception as exc:
                    last_error = exc
                    is_last_attempt = attempt == retries - 1
                    has_another_model = model_index < len(models_to_try) - 1
                    if is_last_attempt and has_another_model and self._is_quota_error(exc):
                        break
                    if is_last_attempt:
                        continue
                    time.sleep((backoff_ms / 1000.0) * (2 ** attempt))

        raise self._normalize_error(last_error)

    def generate_json(self, prompt: str, use_reasoning: bool = False) -> dict:
        text = self.generate_text(prompt, use_reasoning=use_reasoning)
        fenced = re.search(r"```json\s*(.*?)```", text, re.DOTALL)
        candidate = fenced.group(1).strip() if fenced else text.strip()
        return json.loads(candidate)
